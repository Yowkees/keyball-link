#!/usr/bin/env bash
# ファームウェア（AVR版: keyball39/44/61 + keyballplus、各 通常版/LED版 = 計8パターン。
# RP2040版: keyball39 + keyballplus、各1パターン = 計2パターン）をビルドし、
# public/firmware/ に配置するための唯一の正規手順。
#
# 過去に「ビルド直後にコピーせず、後から別のスクリプトが
# “最後にビルドされた方”を無条件でコピーしてしまい、
# 通常版とLED版を取り違える」事故が2度発生したため、
# 「ビルドしたら即その場でコピー」を1本のスクリプトに閉じ込め、
# 最後に全ファイルの整合性を機械的に検証するようにしている。
#
# 2026-09-18: Keyball+のAVR版（keyball-plus-firmware）はLED版のフラッシュ容量
# 超過（134バイト超過）のため、一旦このスクリプトから外し非公開にしていた。
# 2026-09-25: 原因が「LED27-29消灯調査用に残っていた診断用コード
# （CONSOLE_ENABLE=yes・dprintf・debug_enableのpre_init）」だったと判明し
# 削除（keyball-plus-firmware側で対応）。診断コード除去後は通常版26354/28672・
# LED版27766/28672でどちらも余裕を持って収まるため、ビルド対象に復帰させた。
#
# QMK_HOMEについて（2026-09-08〜、2026-09-18にRP2040分を追加、2026-09-25に
# Keyball+ AVR分を復帰）:
# AVR版（Keyball Link 39/44/61・Keyball+）とRP2040版は、それぞれ専用のworktree
# （qmk_firmware-keyball-link / qmk_firmware-keyball-plus / qmk_firmware-keyball-rp2040）
# を使う。~/qmk_firmware は対話的なRP2040開発セッション用の作業ディレクトリのため
# 共有しない。理由は、以前共有していた時期に「開発中のkeyboards/keyballをこの
# スクリプトが誤って上書きしてしまう」事故と紙一重の状況が実際に発生したため。
# デフォルト値を安易に ~/qmk_firmware に戻さないこと。
# RP2040用worktreeの初回セットアップ手順（submoduleは~/qmk_firmwareから直接
# コピーする方が、GitHubから毎回フルクローンするより大幅に速い）:
#   git -C ~/qmk_firmware worktree add ~/qmk_firmware-keyball-rp2040 <~/qmk_firmwareと同じコミット>
#   cd ~/qmk_firmware-keyball-rp2040
#   for p in ~/keyball-rp2040-firmware/patches/*.patch; do git apply "$p"; done
#   for m in chibios chibios-contrib pico-sdk printf lufa; do
#     rsync -a --exclude='.git' ~/qmk_firmware/lib/$m/ lib/$m/
#   done
#
# 使い方: npm run update-firmware
set -euo pipefail

DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/firmware"

LINK_SRC="${LINK_SRC:-$HOME/keyball-link-firmware}"
LINK_QMK="${LINK_QMK:-$HOME/qmk_firmware-keyball-link}"
LINK_KEYBOARDS=(keyball39 keyball44 keyball61)

PLUS_SRC="${PLUS_SRC:-$HOME/keyball-plus-firmware}"
PLUS_QMK="${PLUS_QMK:-$HOME/qmk_firmware-keyball-plus}"

RP2040_SRC="${RP2040_SRC:-$HOME/keyball-rp2040-firmware}"
RP2040_QMK="${RP2040_QMK:-$HOME/qmk_firmware-keyball-rp2040}"
RP2040_KEYBOARDS=(keyball39 keyballplus)

for d in "$LINK_QMK" "$PLUS_QMK" "$RP2040_QMK"; do
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
if [ ! -d "$RP2040_SRC/keyboards/keyball" ]; then
  echo "エラー: RP2040版のファームウェアソースが見つかりません: $RP2040_SRC/keyboards/keyball" >&2
  exit 1
fi

echo "== Keyballキーコード番号の衝突チェック =="
# 2026-09-09、AVR版で追加したAML_OFFのキーコード番号が、Web UI側で既に
# 「精密モード(RP2040版専用)」として登録済みの番号と衝突していた事故が
# あったため、ビルド前に必ず検証する。
node "$(dirname "${BASH_SOURCE[0]}")/check-keycodes.cjs"

echo "== Keyball Link: ソースをビルド環境に同期 =="
rsync -a --delete "$LINK_SRC/keyboards/keyball/" "$LINK_QMK/keyboards/keyball/" --exclude '.git'

cd "$LINK_QMK"
for kb in "${LINK_KEYBOARDS[@]}"; do
  echo "== $kb 通常版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator
  cp "keyball_${kb}_web_configurator.hex" "$DEST_DIR/keyball_${kb}_web_configurator.hex"

  echo "== $kb LED版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator -e LED_VERSION=yes
  cp "keyball_${kb}_web_configurator.hex" "$DEST_DIR/keyball_${kb}_web_configurator_led.hex"
done

echo "== Keyball+: ソースをビルド環境に同期 =="
rsync -a --delete "$PLUS_SRC/keyboards/keyball/" "$PLUS_QMK/keyboards/keyball/" --exclude '.git'

cd "$PLUS_QMK"
echo "== keyballplus 通常版 =="
qmk compile -kb keyball/keyballplus -km web_configurator
cp "keyball_keyballplus_web_configurator.hex" "$DEST_DIR/keyball_keyballplus_web_configurator.hex"

echo "== keyballplus LED版 =="
qmk compile -kb keyball/keyballplus -km web_configurator -e LED_VERSION=yes
cp "keyball_keyballplus_web_configurator.hex" "$DEST_DIR/keyball_keyballplus_web_configurator_led.hex"

echo "== RP2040版: ソースをビルド環境に同期 =="
rsync -a --delete "$RP2040_SRC/keyboards/keyball/" "$RP2040_QMK/keyboards/keyball/" --exclude '.git'

cd "$RP2040_QMK"
for kb in "${RP2040_KEYBOARDS[@]}"; do
  echo "== ${kb} RP2040版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator
  cp "keyball_${kb}_web_configurator.uf2" "$DEST_DIR/keyball_${kb}_web_configurator.uf2"
done

echo "== 整合性チェック =="
fail=0
ALL_AVR_KEYBOARDS=("${LINK_KEYBOARDS[@]}" keyballplus)
for kb in "${ALL_AVR_KEYBOARDS[@]}"; do
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

# RP2040版は通常版/LED版の分岐が無い（統一ビルド）ため、AVR版と同じ取り違え
# チェックは適用できない。代わりに「空でない」「異常に小さくない（ビルドが
# 途中で壊れて極端に小さいファイルができる事故を検出する目的）」だけ確認する。
RP2040_MIN_SIZE=100000
for kb in "${RP2040_KEYBOARDS[@]}"; do
  f="$DEST_DIR/keyball_${kb}_web_configurator.uf2"
  if [ ! -s "$f" ]; then
    echo "NG: ${kb} RP2040版のuf2ファイルが空、または存在しません" >&2
    fail=1
    continue
  fi
  size="$(wc -c < "$f" | tr -d ' ')"
  if [ "$size" -lt "$RP2040_MIN_SIZE" ]; then
    echo "NG: ${kb} RP2040版のuf2ファイルが異常に小さいです（${size}バイト）" >&2
    fail=1
  else
    echo "OK: ${kb} RP2040版 （${size}バイト）"
  fi
done

if [ "$fail" -ne 0 ]; then
  echo >&2
  echo "整合性チェックに失敗しました。public/firmware/ のファイルはコミットしないでください。" >&2
  exit 1
fi

echo
echo "全て正常にビルド・配置されました。"
