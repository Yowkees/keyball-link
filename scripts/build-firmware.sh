#!/usr/bin/env bash
# ファームウェア（keyball39/44/61 + keyballplus、各 通常版/LED版 = 計8パターン）を
# ビルドし、public/firmware/ に配置するための唯一の正規手順。
#
# 過去に「ビルド直後にコピーせず、後から別のスクリプトが
# “最後にビルドされた方”を無条件でコピーしてしまい、
# 通常版とLED版を取り違える」事故が2度発生したため、
# 「ビルドしたら即その場でコピー」を1本のスクリプトに閉じ込め、
# 最後に全ファイルの整合性を機械的に検証するようにしている。
#
# QMK_HOMEについて（2026-09-08〜）:
# Keyball Link（39/44/61）とKeyball+は、RP2040ファームウェア開発と同じ
# ~/qmk_firmware を共有せず、専用のworktree（qmk_firmware-keyball-link /
# qmk_firmware-keyball-plus）を使う。理由は、共有していた時期に「RP2040開発中の
# keyboards/keyball をこのスクリプトが誤って上書きしてしまう」事故と紙一重の
# 状況が実際に発生したため。デフォルト値を安易に ~/qmk_firmware に戻さないこと。
#
# 使い方: npm run update-firmware
set -euo pipefail

DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/firmware"

LINK_SRC="${LINK_SRC:-$HOME/keyball-link-firmware}"
LINK_QMK="${LINK_QMK:-$HOME/qmk_firmware-keyball-link}"
LINK_KEYBOARDS=(keyball39 keyball44 keyball61)

PLUS_SRC="${PLUS_SRC:-$HOME/keyball-plus-firmware}"
PLUS_QMK="${PLUS_QMK:-$HOME/qmk_firmware-keyball-plus}"

for d in "$LINK_QMK" "$PLUS_QMK"; do
  if [ ! -d "$d" ]; then
    echo "エラー: QMKビルド環境が見つかりません: $d" >&2
    exit 1
  fi
done
if [ ! -d "$LINK_SRC/keyboards/keyball" ]; then
  echo "エラー: Keyball Linkのファームウェアソースが見つかりません: $LINK_SRC/keyboards/keyball" >&2
  exit 1
fi
if [ ! -d "$PLUS_SRC/keyboards/keyball" ]; then
  echo "エラー: Keyball+のファームウェアソースが見つかりません: $PLUS_SRC/keyboards/keyball" >&2
  exit 1
fi

echo "== Keyball Link: ソースをビルド環境に同期 =="
rsync -a --delete "$LINK_SRC/keyboards/keyball/" "$LINK_QMK/keyboards/keyball/" --exclude '.git'

echo "== Keyball+: ソースをビルド環境に同期 =="
# keyball-plus-firmwareにはdriversディレクトリ(pmw3360センサードライバ)が
# 含まれていないため、keyball-link-firmware側から補う。
rsync -a --delete "$PLUS_SRC/keyboards/keyball/" "$PLUS_QMK/keyboards/keyball/" --exclude '.git'
rsync -a --delete "$LINK_SRC/keyboards/keyball/drivers/" "$PLUS_QMK/keyboards/keyball/drivers/"

cd "$LINK_QMK"
for kb in "${LINK_KEYBOARDS[@]}"; do
  echo "== $kb 通常版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator
  cp "keyball_${kb}_web_configurator.hex" "$DEST_DIR/keyball_${kb}_web_configurator.hex"

  echo "== $kb LED版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator -e LED_VERSION=yes
  cp "keyball_${kb}_web_configurator.hex" "$DEST_DIR/keyball_${kb}_web_configurator_led.hex"
done

cd "$PLUS_QMK"
echo "== keyballplus 通常版 =="
qmk compile -kb keyball/keyballplus -km web_configurator
cp "keyball_keyballplus_web_configurator.hex" "$DEST_DIR/keyball_keyballplus_web_configurator.hex"

echo "== keyballplus LED版 =="
qmk compile -kb keyball/keyballplus -km web_configurator -e LED_VERSION=yes
cp "keyball_keyballplus_web_configurator.hex" "$DEST_DIR/keyball_keyballplus_web_configurator_led.hex"

echo "== 整合性チェック =="
fail=0
ALL_KEYBOARDS=("${LINK_KEYBOARDS[@]}" keyballplus)
for kb in "${ALL_KEYBOARDS[@]}"; do
  normal="$DEST_DIR/keyball_${kb}_web_configurator.hex"
  led="$DEST_DIR/keyball_${kb}_web_configurator_led.hex"

  if [ ! -s "$normal" ] || [ ! -s "$led" ]; then
    echo "NG: ${kb} のhexファイルが空、または存在しません" >&2
    fail=1
    continue
  fi

  normal_hash="$(md5 -q "$normal" 2>/dev/null || md5sum "$normal" | cut -d' ' -f1)"
  led_hash="$(md5 -q "$led" 2>/dev/null || md5sum "$led" | cut -d' ' -f1)"

  if [ "$normal_hash" = "$led_hash" ]; then
    echo "NG: ${kb} は通常版とLED版が同一内容になっています（取り違え事故の疑い）" >&2
    fail=1
  else
    echo "OK: ${kb} （通常版とLED版は別内容）"
  fi
done

if [ "$fail" -ne 0 ]; then
  echo >&2
  echo "整合性チェックに失敗しました。public/firmware/ のファイルはコミットしないでください。" >&2
  exit 1
fi

echo
echo "全て正常にビルド・配置されました。"
