import { useState } from 'react';
import type { KeyLayout } from '../../layouts/types';
import { findKeycode } from '../../lib/keycodes';

const KEY_SIZE = 52;
const GAP = 4;

interface KeyProps {
  layout: KeyLayout;
  keycode: number;
  selected: boolean;
  ballSide: 'left' | 'right';
  xExtra: number;
  onClick: () => void;
  onDrop: (keycode: number) => void;
}

export function Key({ layout, keycode, selected, ballSide, xExtra, onClick, onDrop }: KeyProps) {
  const [dragOver, setDragOver] = useState(false);

  const isBall = layout.ball === ballSide;
  const entry = findKeycode(keycode);
  const w = (layout.w ?? 1) * KEY_SIZE + ((layout.w ?? 1) - 1) * GAP;
  const h = KEY_SIZE;
  const x = layout.x * (KEY_SIZE + GAP) + xExtra;
  const y = layout.y * (KEY_SIZE + GAP);

  if (isBall) return null;

  return (
    <button
      onClick={onClick}
      title={entry.short}
      style={{ position: 'absolute', left: x, top: y, width: w, height: h }}
      className={`key ${selected ? 'key--selected' : ''} ${keycode === 0 ? 'key--none' : ''} ${dragOver ? 'key--dragover' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const code = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(code)) onDrop(code);
      }}
    >
      <span className="key__label">{entry.label}</span>
    </button>
  );
}
