import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

// Shared by the normal key search and the tap-key search.
export function useKeySearchNavigation(
  search: string,
  codes: (number | null)[],
  onSelect: (code: number) => void,
) {
  const gridRef = useRef<HTMLDivElement>(null);
  const resultsKey = JSON.stringify([search, codes]);
  const [cursor, setCursor] = useState({ resultsKey: '', index: -1 });
  if (cursor.resultsKey !== resultsKey) {
    setCursor({ resultsKey, index: codes.findIndex(code => code !== null) });
  }
  const activeIndex = !search ? -1 : cursor.resultsKey === resultsKey
    ? cursor.index : codes.findIndex(code => code !== null);

  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>(`[data-picker-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex, resultsKey]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!search || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (!['Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (activeIndex < 0) return;
    if (event.key === 'Enter') {
      const code = codes[activeIndex];
      if (code !== null && code !== undefined) onSelect(code);
      return;
    }

    const grid = gridRef.current;
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 1;
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const step = event.key === 'ArrowUp' || event.key === 'ArrowDown' ? columns : 1;
    let next = Math.max(0, Math.min(codes.length - 1, activeIndex + direction * step));
    while (next >= 0 && next < codes.length && codes[next] === null) next += direction;
    if (next >= 0 && next < codes.length) setCursor({ resultsKey, index: next });
  };

  return { activeIndex, gridRef, onKeyDown };
}
