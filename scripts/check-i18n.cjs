// 多言語表示の訳し漏れを調べるスクリプト（2026-11-12〜）
// 使い方: node scripts/check-i18n.cjs
// src の中の t('…') を全部集めて、英語の辞書（src/locales/en.ts）に無い文言を一覧にする。
// 辞書にあっても、もう使っていない文言も知らせる。
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !p.includes(`${path.sep}locales${path.sep}`)) out.push(p);
  }
  return out;
}

// t('…') の中の文字列（シングルクォート、\' のエスケープに対応）を集める
const callRe = /\bt\(\s*'((?:[^'\\]|\\.)*)'/g;
const used = new Map();   // 文言 → 使っているファイル
for (const file of walk(src)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(callRe)) {
    const key = m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n');
    if (!used.has(key)) used.set(key, path.relative(root, file));
  }
}

// 辞書のキー（行頭の '…': の形）を集める
const dictText = fs.readFileSync(path.join(src, 'locales', 'en.ts'), 'utf8');
const keyRe = /^\s*'((?:[^'\\]|\\.)*)'\s*:/gm;
const dict = new Set();
for (const m of dictText.matchAll(keyRe)) dict.add(m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));

const missing = [...used.keys()].filter(k => !dict.has(k));
const unused = [...dict].filter(k => !used.has(k));

if (missing.length) {
  console.log(`英訳が無い文言: ${missing.length}件`);
  for (const k of missing) console.log(`  ${used.get(k)}: ${JSON.stringify(k)}`);
}
if (unused.length) {
  console.log(`辞書にあるが使われていない文言: ${unused.length}件（t() に変数を渡している場合はここに出ることがある）`);
  for (const k of unused) console.log(`  ${JSON.stringify(k)}`);
}
console.log(`使用中の文言 ${used.size}件 / 辞書 ${dict.size}件`);
process.exit(missing.length ? 1 : 0);
