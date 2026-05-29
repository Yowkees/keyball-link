import type { KeyLayout } from '../../layouts/types';
import { Key } from './Key';

const KEY_SIZE = 52;
const GAP = 4;
const SPLIT_GAP_PX = 56; // 左右ハーフの間の追加スペース

function isRightSide(k: KeyLayout): boolean {
  return k.id.startsWith('R');
}

interface KeyboardLayoutProps {
  layout: KeyLayout[];
  keycodes: number[];
  selectedIndex: number | null;
  ballSide: 'left' | 'right';
  onKeyClick: (index: number) => void;
  onKeyDrop: (index: number, keycode: number) => void;
}

export function KeyboardLayout({ layout, keycodes, selectedIndex, ballSide, onKeyClick, onKeyDrop }: KeyboardLayoutProps) {
  const maxX = Math.max(...layout.map(k => {
    const extra = isRightSide(k) ? SPLIT_GAP_PX : 0;
    return k.x * (KEY_SIZE + GAP) + (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP + extra;
  }));
  const maxY = Math.max(...layout.map(k => k.y + 1));
  const height = maxY * (KEY_SIZE + GAP);

  return (
    <div className="keyboard-layout" style={{ position: 'relative', width: maxX, height }}>
      {layout.map((k, i) => (
        <Key
          key={k.id}
          layout={k}
          keycode={keycodes[i] ?? 0}
          selected={selectedIndex === i}
          ballSide={ballSide}
          xExtra={isRightSide(k) ? SPLIT_GAP_PX : 0}
          onClick={() => onKeyClick(i)}
          onDrop={code => onKeyDrop(i, code)}
        />
      ))}
    </div>
  );
}
