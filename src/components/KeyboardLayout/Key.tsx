import { useState } from 'react';
import type { KeyLayout as LayoutDef } from '../../layouts/types';
import { findKeycode, getKeyDisplayLabel, getShiftLabel } from '../../lib/keycodes';
import type { KeyLayout } from '../../lib/keycodes';

const KEY_SIZE = 52;
const GAP = 4;

interface KeyProps {
  layout: LayoutDef;
  keycode: number;
  selected: boolean;
  ballSide: 'left' | 'right';
  keyLayout: KeyLayout;
  xExtra: number;
  onClick: () => void;
  onDrop: (keycode: number) => void;
}

export function Key({ layout, keycode, selected, ballSide, keyLayout, xExtra, onClick, onDrop }: KeyProps) {
  const [dragOver, setDragOver] = useState(false);

  const isBall     = layout.ball === ballSide;
  const entry      = findKeycode(keycode);
  const label      = getKeyDisplayLabel(keycode, keyLayout);
  const shiftLabel = getShiftLabel(keycode, keyLayout);
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
      className={`key ${selected ? 'key--selected' : ''} ${keycode === 0 ? 'key--none' : ''} ${dragOver ? 'key--dragover' : ''} ${shiftLabel ? 'key--dual' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const code = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(code)) onDrop(code);
      }}
    >
      {shiftLabel ? (
        <div className="key__dual-wrapper">
          <span className="key__shift">{shiftLabel}</span>
          <span className="key__main">{label}</span>
        </div>
      ) : (
        <span className="key__label">{label}</span>
      )}
    </button>
  );
}
