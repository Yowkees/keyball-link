import { useState } from 'react';
import type { KeyLayout as LayoutDef } from '../../layouts/types';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDescription } from '../../lib/keycodes';
import { Key } from './Key';

const KEY_SIZE = 52;
const GAP = 4;
const SPLIT_GAP_PX = 56;

function isRightSide(k: LayoutDef): boolean {
  return k.id.startsWith('R');
}

interface KeyboardLayoutProps {
  layout: LayoutDef[];
  keycodes: number[];
  selectedIndex: number | null;
  ballSide: 'left' | 'right';
  keyLayout: KeyLayout;
  onKeyClick: (index: number) => void;
  onKeyDrop: (index: number, keycode: number) => void;
  showDescBar?: boolean;
}

export function KeyboardLayout({ layout, keycodes, selectedIndex, ballSide, keyLayout, onKeyClick, onKeyDrop, showDescBar = true }: KeyboardLayoutProps) {
  const [hoverDesc, setHoverDesc] = useState<string | null>(null);

  const maxX = Math.max(...layout.map(k => {
    const extra = isRightSide(k) ? SPLIT_GAP_PX : 0;
    return k.x * (KEY_SIZE + GAP) + (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP + extra;
  }));
  const maxY = Math.max(...layout.map(k => k.y + 1));
  const height = maxY * (KEY_SIZE + GAP);

  return (
    <div className="keyboard-layout-wrap">
      <div className="keyboard-layout" style={{ position: 'relative', width: maxX, height }}>
        {layout.map((k, i) => (
          <Key
            key={k.id}
            layout={k}
            keycode={keycodes[i] ?? 0}
            selected={selectedIndex === i}
            ballSide={ballSide}
            keyLayout={keyLayout}
            xExtra={isRightSide(k) ? SPLIT_GAP_PX : 0}
            onClick={() => onKeyClick(i)}
            onDrop={code => onKeyDrop(i, code)}
            onHover={() => setHoverDesc(getKeyDescription(keycodes[i] ?? 0, keyLayout))}
            onHoverEnd={() => setHoverDesc(null)}
          />
        ))}
      </div>
      {showDescBar && (
        <div className="key-desc-bar">
          {hoverDesc ?? 'キーにマウスを乗せると説明が表示されます'}
        </div>
      )}
    </div>
  );
}
