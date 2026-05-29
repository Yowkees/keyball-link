import type { KeyLayout } from './types';

// keyball44: 6列 × 8行（左4行 + 右4行）
// サムクラスターは左右各5キー（col 0 は KC_NO でスキップ）
// 物理座標は info.json / LAYOUT_no_ball 準拠
// ball: 'right' → LAYOUT_right_ball で R32/R33 がトラックボール占有
// ball: 'left'  → LAYOUT_left_ball  で L32/L33 がトラックボール占有
export const keyball44Layout: KeyLayout[] = [
  // Row 0（左）matrix row 0 / （右）matrix row 4
  { id: 'L00', row: 0, col: 0, x:  0, y: 0 },
  { id: 'L01', row: 0, col: 1, x:  1, y: 0 },
  { id: 'L02', row: 0, col: 2, x:  2, y: 0 },
  { id: 'L03', row: 0, col: 3, x:  3, y: 0 },
  { id: 'L04', row: 0, col: 4, x:  4, y: 0 },
  { id: 'L05', row: 0, col: 5, x:  5, y: 0 },
  { id: 'R05', row: 4, col: 5, x:  7, y: 0 },
  { id: 'R04', row: 4, col: 4, x:  8, y: 0 },
  { id: 'R03', row: 4, col: 3, x:  9, y: 0 },
  { id: 'R02', row: 4, col: 2, x: 10, y: 0 },
  { id: 'R01', row: 4, col: 1, x: 11, y: 0 },
  { id: 'R00', row: 4, col: 0, x: 12, y: 0 },

  // Row 1（左）matrix row 1 / （右）matrix row 5
  { id: 'L10', row: 1, col: 0, x:  0, y: 1 },
  { id: 'L11', row: 1, col: 1, x:  1, y: 1 },
  { id: 'L12', row: 1, col: 2, x:  2, y: 1 },
  { id: 'L13', row: 1, col: 3, x:  3, y: 1 },
  { id: 'L14', row: 1, col: 4, x:  4, y: 1 },
  { id: 'L15', row: 1, col: 5, x:  5, y: 1 },
  { id: 'R15', row: 5, col: 5, x:  7, y: 1 },
  { id: 'R14', row: 5, col: 4, x:  8, y: 1 },
  { id: 'R13', row: 5, col: 3, x:  9, y: 1 },
  { id: 'R12', row: 5, col: 2, x: 10, y: 1 },
  { id: 'R11', row: 5, col: 1, x: 11, y: 1 },
  { id: 'R10', row: 5, col: 0, x: 12, y: 1 },

  // Row 2（左）matrix row 2 / （右）matrix row 6
  { id: 'L20', row: 2, col: 0, x:  0, y: 2 },
  { id: 'L21', row: 2, col: 1, x:  1, y: 2 },
  { id: 'L22', row: 2, col: 2, x:  2, y: 2 },
  { id: 'L23', row: 2, col: 3, x:  3, y: 2 },
  { id: 'L24', row: 2, col: 4, x:  4, y: 2 },
  { id: 'L25', row: 2, col: 5, x:  5, y: 2 },
  { id: 'R25', row: 6, col: 5, x:  7, y: 2 },
  { id: 'R24', row: 6, col: 4, x:  8, y: 2 },
  { id: 'R23', row: 6, col: 3, x:  9, y: 2 },
  { id: 'R22', row: 6, col: 2, x: 10, y: 2 },
  { id: 'R21', row: 6, col: 1, x: 11, y: 2 },
  { id: 'R20', row: 6, col: 0, x: 12, y: 2 },

  // Row 3 サムクラスター（col 0 = KC_NO のためスキップ）
  // matrix row 3（左）/ matrix row 7（右）
  // 左: 全キーを1キー分内側（右方向）にオフセット
  // 右: 内側2キー（R35/R34）を1キー分内側（左方向）にオフセット
  { id: 'L31', row: 3, col: 1, x:  2, y: 3 },
  { id: 'L32', row: 3, col: 2, x:  3, y: 3, ball: 'left' },
  { id: 'L33', row: 3, col: 3, x:  4, y: 3, ball: 'left' },
  { id: 'L34', row: 3, col: 4, x:  5, y: 3 },
  { id: 'L35', row: 3, col: 5, x:  6, y: 3 },
  { id: 'R35', row: 7, col: 5, x:  6, y: 3 },
  { id: 'R34', row: 7, col: 4, x:  7, y: 3 },
  { id: 'R33', row: 7, col: 3, x:  9, y: 3, ball: 'right' },
  { id: 'R32', row: 7, col: 2, x: 10, y: 3, ball: 'right' },
  { id: 'R31', row: 7, col: 1, x: 11, y: 3 },
];
