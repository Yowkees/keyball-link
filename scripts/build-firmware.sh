#!/usr/bin/env bash
# ファームウェア（3機種 × 通常版/LED版 = 6パターン）をビルドし、
# public/firmware/ に配置するための唯一の正規手順。
#
# 過去に「ビルド直後にコピーせず、後から別のスクリプトが
# “最後にビルドされた方”を無条件でコピーしてしまい、
# 通常版とLED版を取り違える」事故が2度発生したため、
# 「ビルドしたら即その場でコピー」を1本のスクリプトに閉じ込め、
# 最後に全ファイルの整合性を機械的に検証するようにしている。
#
# 使い方: npm run update-firmware
set -euo pipefail

QMK_HOME="${QMK_HOME:-$HOME/qmk_firmware}"
FW_SRC="${FW_SRC:-$HOME/keyball-link-firmware}"
DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/firmware"

KEYBOARDS=(keyball39 keyball44 keyball61)

if [ ! -d "$QMK_HOME" ]; then
  echo "エラー: QMK_HOME が見つかりません: $QMK_HOME" >&2
  exit 1
fi
if [ ! -d "$FW_SRC/keyboards/keyball" ]; then
  echo "エラー: ファームウェアのソースが見つかりません: $FW_SRC/keyboards/keyball" >&2
  exit 1
fi

echo "== ソースをビルド環境に同期 =="
rsync -a --delete "$FW_SRC/keyboards/keyball/" "$QMK_HOME/keyboards/keyball/" --exclude '.git'

cd "$QMK_HOME"

for kb in "${KEYBOARDS[@]}"; do
  echo "== $kb 通常版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator
  cp "keyball_${kb}_web_configurator.hex" "$DEST_DIR/keyball_${kb}_web_configurator.hex"

  echo "== $kb LED版 =="
  qmk compile -kb "keyball/$kb" -km web_configurator -e LED_VERSION=yes
  cp "keyball_${kb}_web_configurator.hex" "$DEST_DIR/keyball_${kb}_web_configurator_led.hex"
done

echo "== 整合性チェック =="
fail=0
for kb in "${KEYBOARDS[@]}"; do
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
