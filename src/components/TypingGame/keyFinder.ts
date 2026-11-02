// その人のキー配列（接続したKeyballから読んだキーマップ）で、ある文字を打つには
// 「どのレイヤーのどのキーを、どのレイヤーキー・Shiftと一緒に押すか」を調べる（2026-10-29〜、
// 記号・数字の練習用）。
import type { KeyLayout as LayoutDef } from '../../layouts/types';
import { getKeyDisplayLabel, type KeyLayout } from '../../lib/keycodes';
import { charToKeycode } from '../../lib/textToMacro';

const KC_TRNS = 0x0001;
const SHIFTED = 0x0200;   // Shift付きのキーコード（QK_LSFT）

export interface Board {
  layout: LayoutDef[];
  keymap: number[][][];
  ballSide: 'left' | 'right';
  keyLayout: KeyLayout;
}

// レイヤーへの行き方。hold=押したまま / oneshot=1回押して離してから / toggle=押して切り替える
export type ReachMode = 'hold' | 'oneshot' | 'toggle';

export interface KeyWay {
  layer: number;          // 文字があるレイヤー
  key: number;            // 押すキー（layoutの番号）
  hold: number | null;    // そのレイヤーへ行くためのキー（レイヤー0のキー。レイヤー0の文字はnull）
  mode: ReachMode | null;
  shift: number | null;   // 一緒に押すShiftのキー（要らなければnull）
}

const isLT = (c: number) => c >= 0x4000 && c <= 0x4FFF;
const isMT = (c: number) => c >= 0x2000 && c <= 0x3FFF;
// 長押しで別の働きをするキー（LT/MT）は、短く押した時のキー
const tapOf = (c: number) => (isLT(c) || isMT(c) ? c & 0xFF : c);
const isShiftKey = (c: number) =>
  c === 0x00E1 || c === 0x00E5 || c === 0x52A2 || c === 0x52B2 ||   // Shift・ワンショットShift
  (isMT(c) && (((c >> 8) & 0x1F) & 0x0F) === 0x02);                 // 長押しでShift

export function makeFinder(b: Board) {
  const keys = b.layout.map((k, i) => ({ k, i })).filter(({ k }) => k.ball !== b.ballSide).map(({ i }) => i);
  const raw = (l: number, i: number) => b.keymap[l]?.[b.layout[i].row]?.[b.layout[i].col] ?? 0;
  // 透過（▽）のキーは、レイヤー0のキーとして働く
  const code = (l: number, i: number) => {
    const c = raw(l, i);
    return c === KC_TRNS && l > 0 ? raw(0, i) : c;
  };

  // レイヤー0から、レイヤーLへ行くキーを探す（押したままのキーを優先）
  const reachCache = new Map<number, { hold: number; mode: ReachMode } | null>();
  const reach = (L: number) => {
    if (reachCache.has(L)) return reachCache.get(L)!;
    let best: { hold: number; mode: ReachMode } | null = null;
    const rank = { hold: 0, oneshot: 1, toggle: 2 };
    for (const i of keys) {
      const c = raw(0, i);
      const mode: ReachMode | null =
        c === 0x5220 + L || c === 0x52C0 + L || (isLT(c) && ((c >> 8) & 0xF) === L) ? 'hold'
        : c === 0x5280 + L ? 'oneshot'
        : c === 0x5260 + L || c === 0x5200 + L ? 'toggle'
        : null;
      if (mode && (!best || rank[mode] < rank[best.mode])) best = { hold: i, mode };
    }
    reachCache.set(L, best);
    return best;
  };

  const shiftOn = (L: number, skip: (number | null)[]) =>
    keys.find(i => !skip.includes(i) && isShiftKey(code(L, i))) ?? null;

  const cache = new Map<string, KeyWay | null>();
  const find = (ch: string): KeyWay | null => {
    if (cache.has(ch)) return cache.get(ch)!;
    const target = charToKeycode(ch, b.keyLayout);
    let best: KeyWay | null = null, bestCost = Infinity;
    if (target !== null) {
      const needShift = (target >> 8) === (SHIFTED >> 8);
      for (let L = 0; L < b.keymap.length; L++) {
        const r = L === 0 ? null : reach(L);
        if (L > 0 && !r) continue;
        for (const i of keys) {
          if (r && i === r.hold) continue;
          const c = code(L, i);
          const tapKey = isLT(c) || isMT(c);
          let shift: number | null = null;
          if (c === target || (!needShift && tapOf(c) === target && c !== 0)) {
            // そのまま押せば出る
          } else if (needShift && tapOf(c) === (target & 0xFF) && (c < 0x0100 || tapKey)) {
            shift = shiftOn(L, [r?.hold ?? null, i]);
            if (shift === null) continue;
          } else continue;
          const cost = (r ? 1 : 0) + (r?.mode === 'toggle' ? 0.5 : 0) + (shift !== null ? 1 : 0) + (tapKey ? 0.2 : 0);
          if (cost < bestCost) {
            bestCost = cost;
            best = { layer: L, key: i, hold: r?.hold ?? null, mode: r?.mode ?? null, shift };
          }
        }
      }
    }
    cache.set(ch, best);
    return best;
  };

  // 文字にならないキー（かな・英数・Enter・Backspaceなど）を、キーコードで探す（2026-10-30〜、親指の試練用）。
  // 長押しで別の働きをするキー（LT/MT）は、短く押した時の働きで比べる
  const findCode = (match: (c: number) => boolean): KeyWay | null => {
    let best: KeyWay | null = null, bestCost = Infinity;
    for (let L = 0; L < b.keymap.length; L++) {
      const r = L === 0 ? null : reach(L);
      if (L > 0 && !r) continue;
      for (const i of keys) {
        if (r && i === r.hold) continue;
        const c = code(L, i);
        if (!c || !match(tapOf(c))) continue;
        const cost = (r ? 1 : 0) + (r?.mode === 'toggle' ? 0.5 : 0) + (isLT(c) || isMT(c) ? 0.2 : 0);
        if (cost < bestCost) {
          bestCost = cost;
          best = { layer: L, key: i, hold: r?.hold ?? null, mode: r?.mode ?? null, shift: null };
        }
      }
    }
    return best;
  };

  // キーに書いてある名前（長押しの働きがあるキーは「英数/L1」のように）
  const label = (l: number, i: number) => getKeyDisplayLabel(code(l, i), b.keyLayout).replace('\n', '/');

  // 押し方の説明文（例: 「L1/英数」を押したまま ＋ 「Shift」 ＋ 「2」）
  const describe = (w: KeyWay) => {
    const parts: string[] = [];
    if (w.hold !== null) {
      const name = `「${label(0, w.hold)}」`;
      parts.push(w.mode === 'hold' ? `${name}を押したまま` : w.mode === 'oneshot' ? `${name}を押して離してから` : `${name}でレイヤー${w.layer}に切り替えて`);
    }
    if (w.shift !== null) parts.push(`「${label(w.layer, w.shift)}」（Shift）を押したまま`);
    parts.push(`「${label(w.layer, w.key)}」`);
    return parts.join(' ＋ ');
  };

  return { find, findCode, label, describe };
}
