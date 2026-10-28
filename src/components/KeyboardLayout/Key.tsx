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
  // Remapと同じ配置（via.jsonのKLE座標）で描く時の位置・大きさ・傾き（px）。無ければ従来の格子状の配置
  rect?: KeyRect;
  onClick: () => void;
  onDrop: (keycode: number) => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export interface KeyRect { left: number; top: number; width: number; height: number; rotate: number; originX: number; originY: number }

export function Key({ layout, keycode, selected, ballSide, keyLayout, xExtra, rect, onClick, onDrop, onHover, onHoverEnd }: KeyProps) {
  const [dragOver, setDragOver] = useState(false);

  const isBall     = layout.ball === ballSide;
  const entry      = findKeycode(keycode);
  const label      = getKeyDisplayLabel(keycode, keyLayout);
  const shiftLabel = getShiftLabel(keycode, keyLayout);
  const w = rect ? rect.width : (layout.w ?? 1) * KEY_SIZE + ((layout.w ?? 1) - 1) * GAP;
  const h = rect ? rect.height : KEY_SIZE;
  const x = rect ? rect.left : layout.x * (KEY_SIZE + GAP) + xExtra;
  const y = rect ? rect.top : layout.y * (KEY_SIZE + GAP);
  // 傾いたキー（親指キー）はCSS変数で角度を渡す（ドラッグ中の拡大表示と両立させるため。index.cssの.key参照）
  const rot = rect && rect.rotate ? { '--key-rot': `${rect.rotate}deg`, transformOrigin: `${rect.originX}px ${rect.originY}px` } as React.CSSProperties : {};

  if (isBall) return null;

  return (
    <button
      onClick={onClick}
      title={entry.short}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...rot }}
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
