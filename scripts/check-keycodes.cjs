#!/usr/bin/env node
// Keyball独自キーコード（QK_KB_0〜63、0x7E00〜0x7E3F）の番号衝突を検出するチェッカー。
//
// 背景: keyball-link-firmware・keyball-plus-firmware・keyball-rp2040-firmwareは
// それぞれ別のgitリポジトリで、独自に enum keyball_keycodes に QK_KB_N を
// 割り当てている。さらにWeb UI（keyball-configurator）側もキー選択肢として
// 独自にキーコード表(keycodes.ts)を持っている。
// 2026-09-09、AVR版でAML_OFFにQK_KB_17を割り当てたところ、Web UI側では
// 既に同じ番号がRP2040版専用の「精密モード(PRC_MO)」として登録済みだった
// という衝突事故が発生した（このスクリプトはその再発防止のために作成）。
//
// 使い方: node scripts/check-keycodes.js
// 環境変数でリポジトリの場所を上書き可能（デフォルトは全て $HOME 直下）。
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir();

const SOURCES = [
  {
    name: 'keyball-link-firmware',
    file: path.join(process.env.LINK_SRC || path.join(HOME, 'keyball-link-firmware'), 'keyboards/keyball/lib/keyball/keyball.h'),
  },
  {
    name: 'keyball-plus-firmware',
    file: path.join(process.env.PLUS_SRC || path.join(HOME, 'keyball-plus-firmware'), 'keyboards/keyball/lib/keyball/keyball.h'),
  },
  {
    name: 'keyball-rp2040-firmware',
    file: path.join(process.env.RP2040_SRC || path.join(HOME, 'keyball-rp2040-firmware'), 'keyboards/keyball/lib/keyball/keyball.h'),
  },
];

const WEBUI_FILE = path.join(__dirname, '..', 'src/lib/keycodes.ts');

// Web UI側は表示上の省略名を使っていることがあり、ファームウェア側の識別子と
// 文字列としては一致しないが同じキーを指しているケースがある（例:
// CPI_I100(ファーム) と CPI+100(Web UI表示名)）。既知の対応だけ正規化する。
const ALIASES = {
  'CPI+100': 'CPI_I100',
  'CPI-100': 'CPI_D100',
  'CPI+1K':  'CPI_I1K',
  'CPI-1K':  'CPI_D1K',
  'SCL_DVI': 'SCRL_DVI',
  'SCL_DVD': 'SCRL_DVD',
};
function normalize(name) {
  return ALIASES[name] || name;
}

// number -> [{ source, name }]
const registry = new Map();

function record(num, name, source) {
  if (!registry.has(num)) registry.set(num, []);
  registry.get(num).push({ source, name: normalize(name) });
}

// --- ファームウェア側: `NAME = QK_KB_N,` を抽出 ---
for (const { name: source, file } of SOURCES) {
  if (!fs.existsSync(file)) {
    console.warn(`警告: ${source} が見つかりません（スキップ）: ${file}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  const re = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*QK_KB_(\d+)\s*,/gm;
  let m;
  while ((m = re.exec(text))) {
    record(Number(m[2]), m[1], source);
  }
}

// --- Web UI側: `K(0x7ENN, ..., 'NAME', ...)` を抽出（0x7E00〜0x7E3Fの範囲のみ） ---
if (fs.existsSync(WEBUI_FILE)) {
  const text = fs.readFileSync(WEBUI_FILE, 'utf8');
  const re = /K\(0x7E([0-9A-Fa-f]{2}),\s*'[^']*',\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(text))) {
    const num = parseInt(m[1], 16);
    if (num >= 0 && num <= 63) {
      record(num, m[2], 'keyball-configurator (Web UI)');
    }
  }
} else {
  console.warn(`警告: Web UIのkeycodes.tsが見つかりません: ${WEBUI_FILE}`);
}

// --- 衝突チェック ---
// 同じ番号に対して、名前が異なるエントリが1つでもあれば衝突とみなす。
let hasConflict = false;
const numbers = [...registry.keys()].sort((a, b) => a - b);

console.log('== Keyballキーコード番号 割り当て一覧 (QK_KB_0〜63) ==\n');
for (const num of numbers) {
  const entries = registry.get(num);
  const uniqueNames = [...new Set(entries.map(e => e.name))];
  const conflict = uniqueNames.length > 1;
  if (conflict) hasConflict = true;

  const label = `QK_KB_${num} (0x7E${num.toString(16).padStart(2, '0').toUpperCase()})`;
  console.log(`${conflict ? 'NG' : 'OK'}: ${label}`);
  for (const { source, name } of entries) {
    console.log(`       ${name.padEnd(12)} <- ${source}`);
  }
}

const used = new Set(numbers);
const free = [];
for (let n = 0; n <= 63; n++) if (!used.has(n)) free.push(n);
console.log(`\n次に使える空き番号: ${free.slice(0, 5).map(n => `QK_KB_${n}`).join(', ')}${free.length > 5 ? ' ...' : ''}`);

if (hasConflict) {
  console.error('\n衝突が見つかりました。同じ番号に異なる名前が割り当てられています。');
  console.error('新しいキーコードを追加する場合は、上の一覧にない空き番号を使ってください。');
  process.exit(1);
}

console.log('\n衝突なし。');
