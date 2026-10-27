// Remapと同じキー配置で表示するため、各機種のvia.json（Remap/VIAが使うKLE形式のキー配置）から
// キーの位置・幅・傾きを読み取り、src/layouts/kleGeometry.ts を生成する（2026-10-27、本人希望）。
//
// 使い方: node scripts/gen-kle-geometry.cjs   （via.jsonを変えた時だけ実行し直す）
//
// 注意: via.jsonは正規Yowkeesファーム（旧QMK）基準で「行0〜(半分-1)＝物理的な左手」。Keyball Linkの中
// （src/layouts/*.ts）は「行0〜(半分-1)＝物理的な右手」なので、行を半分ずらして対応させる。
const fs = require('fs');
const path = require('path');
const HOME = require('os').homedir();
const SOURCES = {
  keyball39: path.join(HOME, 'keyball-link-firmware/keyboards/keyball/keyball39/via.json'),
  keyball44: path.join(HOME, 'keyball-link-firmware/keyboards/keyball/keyball44/via.json'),
  keyball61: path.join(HOME, 'keyball-link-firmware/keyboards/keyball/keyball61/via.json'),
  keyballplus: path.join(HOME, 'keyball-plus-firmware/keyboards/keyball/keyballplus/via.json'),
};
// via.jsonの「Ball availability」の選択肢: 0=None 1=Right 2=Left 3=Dual
const CHOICE = { right: 1, left: 2 };

// KLE（keyboard-layout-editor）の並びを、キーごとの絶対位置に直す（kle-serialと同じ規則）
function parseKle(rows) {
  const keys = [];
  const cur = { x: 0, y: 0, r: 0, rx: 0, ry: 0, w: 1, h: 1 };
  const cluster = { x: 0, y: 0 };
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (const item of row) {
      if (typeof item === 'object') {
        if (item.r != null) cur.r = item.r;
        if (item.rx != null) { cur.rx = cluster.x = item.rx; cur.x = cluster.x; cur.y = cluster.y; }
        if (item.ry != null) { cur.ry = cluster.y = item.ry; cur.x = cluster.x; cur.y = cluster.y; }
        if (item.x != null) cur.x += item.x;
        if (item.y != null) cur.y += item.y;
        if (item.w != null) cur.w = item.w;
        if (item.h != null) cur.h = item.h;
      } else {
        const lines = String(item).split('\n');
        const m = /^(\d+),(\d+)$/.exec(lines[0] || '');
        const o = /^(\d+),(\d+)$/.exec(lines[3] || '');
        keys.push({
          row: m ? +m[1] : null, col: m ? +m[2] : null,
          choice: o ? +o[2] : null,
          x: cur.x, y: cur.y, w: cur.w, h: cur.h, r: cur.r, rx: cur.rx, ry: cur.ry,
        });
        cur.x += cur.w;
        cur.w = 1; cur.h = 1;
      }
    }
    cur.y += 1;
    cur.x = cur.rx;
  }
  return keys;
}

const round = v => Math.round(v * 1000) / 1000;
const out = {};
for (const [model, file] of Object.entries(SOURCES)) {
  const via = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = via.matrix.rows, half = rows / 2;
  const keys = parseKle(via.layouts.keymap);
  // VIA（Remap）と同じく、選択肢ごとのキーのまとまりを、選択肢0（ボール無し）のまとまりの左上に
  // そろえて表示する。via.jsonでは選択肢ごとのキーが横に並べて書かれているため（行列の無い飾りの
  // キーも、まとまりの範囲には含める）。
  const groupMin = {};
  for (const k of keys) {
    if (k.choice == null) continue;
    const m = groupMin[k.choice] || (groupMin[k.choice] = { x: Infinity, y: Infinity });
    m.x = Math.min(m.x, k.x); m.y = Math.min(m.y, k.y);
  }
  for (const k of keys) {
    if (k.choice == null || k.choice === 0 || !groupMin[0]) continue;
    k.x += groupMin[0].x - groupMin[k.choice].x;
    k.y += groupMin[0].y - groupMin[k.choice].y;
  }
  out[model] = {};
  for (const [side, choice] of Object.entries(CHOICE)) {
    const map = {};
    for (const k of keys) {
      if (k.row == null) continue;  // 行列の無いキー（飾り）は使わない
      if (k.choice != null && k.choice !== choice) continue;
      const row = (k.row + half) % rows;  // via.json（行0〜=左手）→ Keyball Linkの中（行0〜=右手）
      const g = { x: round(k.x), y: round(k.y) };
      if (k.w !== 1) g.w = k.w;
      if (k.h !== 1) g.h = k.h;
      if (k.r) { g.r = k.r; g.rx = round(k.rx); g.ry = round(k.ry); }
      map[`${row},${k.col}`] = g;
    }
    out[model][side] = map;
  }
}
const ts = `// scripts/gen-kle-geometry.cjs が各機種のvia.json（Remapと同じキー配置）から生成したファイル。手で編集しないこと。
// キー（Keyball Linkの中の"行,列"）ごとの位置・幅・傾き（KLE単位。1=キー1個分）。ボールの位置ごとに別。
export interface KleKeyGeometry { x: number; y: number; w?: number; h?: number; r?: number; rx?: number; ry?: number }
export type KleGeometry = Record<'left' | 'right', Record<string, KleKeyGeometry>>;
export const KLE_GEOMETRY: Record<string, KleGeometry> = ${JSON.stringify(out, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'src/layouts/kleGeometry.ts'), ts);
console.log('wrote src/layouts/kleGeometry.ts');
