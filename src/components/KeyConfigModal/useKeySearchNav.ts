// キー検索の結果を、キーボード（矢印キー・Enter）で選べるようにする共通のしくみ。
// 「通常」パネルとタップキー選択（ホールド）で同じ動きにするため、ここにまとめている。
//
// ・検索語がある間だけ、選べる結果の先頭に枠を付ける（cursor）
// ・← → で前後、↑ ↓ で1行上下に動かす（1行の数は画面の並びから数える）
// ・Enter で枠の付いたキーを選ぶ
// ・このファームで使えないキーなど、選べないキーは飛ばす
// ・日本語入力の変換中は、矢印キーとEnterを横取りしない
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export function useKeySearchNav({ count, active, resetKey, isSelectable, onPick }: {
  count: number;                         // 表示している結果の数
  active: boolean;                       // true＝キーボードで選べる状態（検索語がある時）
  resetKey: string;                      // これが変わったら枠を先頭に戻す（検索語・カテゴリなど）
  isSelectable: (i: number) => boolean;  // i番目の結果を選べるか
  onPick: (i: number) => void;           // Enter で i番目を選んだ時
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  // 先頭から見て最初に選べる結果
  const firstSelectable = () => {
    for (let i = 0; i < count; i++) if (isSelectable(i)) return i;
    return null;
  };

  // 検索語や結果が変わったら、枠を先頭の選べる結果に戻す。
  // 枠の位置は「どの検索条件の時の位置か（sig）」と一緒に覚え、条件が変わったら先頭から数え直す
  const sig = `${active}|${resetKey}|${count}`;
  const [saved, setSaved] = useState<{ sig: string; cursor: number | null } | null>(null);
  const cursor = saved && saved.sig === sig ? saved.cursor : (active ? firstSelectable() : null);
  const setCursor = (c: number | null) => setSaved({ sig, cursor: c });

  // 枠が付いたキーが見えるように一覧をスクロールする（検索欄の入力はそのまま続けられる）
  useEffect(() => {
    if (cursor === null) return;
    // 一覧の中だけをスクロールする（scrollIntoView だとページ全体まで動くことがあるため使わない）
    const grid = gridRef.current;
    const el = grid?.querySelector<HTMLElement>(`[data-nav-idx="${cursor}"]`);
    if (!grid || !el) return;
    const g = grid.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < g.top) grid.scrollTop -= g.top - r.top + 4;
    else if (r.bottom > g.bottom) grid.scrollTop += r.bottom - g.bottom + 4;
  }, [cursor]);

  // 1行に並んでいる数を、実際の画面の並び（上端の位置が同じキーの数）から数える
  const columns = () => {
    const items = gridRef.current?.querySelectorAll<HTMLElement>('[data-nav-idx]');
    if (!items || items.length === 0) return 1;
    const top = items[0].offsetTop;
    let n = 0;
    for (const el of items) { if (el.offsetTop === top) n++; else break; }
    return Math.max(n, 1);
  };

  // from から step ずつ進んで、最初に選べる結果を探す（範囲外なら動かない）
  const move = (from: number, step: number) => {
    for (let i = from + step; i >= 0 && i < count; i += step) {
      if (isSelectable(i)) return i;
    }
    return from;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 日本語入力の変換中は何もしない（Enterで変換を確定できるように）
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (!active || cursor === null) return;
    let next: number;
    switch (e.key) {
      case 'ArrowRight': next = move(cursor, 1); break;
      case 'ArrowLeft':  next = move(cursor, -1); break;
      case 'ArrowDown':  next = move(cursor, columns()); break;
      case 'ArrowUp':    next = move(cursor, -columns()); break;
      case 'Enter':
        e.preventDefault();
        if (isSelectable(cursor)) onPick(cursor);
        return;
      default: return;
    }
    e.preventDefault();
    setCursor(next);
  };

  return { cursor, gridRef, onKeyDown };
}
