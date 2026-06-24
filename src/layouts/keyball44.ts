import type { KeyLayout } from './types';

// keyball44: 6列 × 8行（左4行 + 右4行）
// 実機テストにより: row0-3=物理右半分(R**), row4-7=物理左半分(L**)
export const keyball44Layout: KeyLayout[] = [
  // Row 0 right / Row 4 left
  { id: 'L00', row: 4, col: 0, x:  0, y: 0 },
  { id: 'L01', row: 4, col: 1, x:  1, y: 0 },
  { id: 'L02', row: 4, col: 2, x:  2, y: 0 },
  { id: 'L03', row: 4, col: 3, x:  3, y: 0 },
  { id: 'L04', row: 4, col: 4, x:  4, y: 0 },
  { id: 'L05', row: 4, col: 5, x:  5, y: 0 },
  { id: 'R05', row: 0, col: 5, x:  7, y: 0 },
  { id: 'R04', row: 0, col: 4, x:  8, y: 0 },
  { id: 'R03', row: 0, col: 3, x:  9, y: 0 },
  { id: 'R02', row: 0, col: 2, x: 10, y: 0 },
  { id: 'R01', row: 0, col: 1, x: 11, y: 0 },
  { id: 'R00', row: 0, col: 0, x: 12, y: 0 },

  // Row 1 right / Row 5 left
  { id: 'L10', row: 5, col: 0, x:  0, y: 1 },
  { id: 'L11', row: 5, col: 1, x:  1, y: 1 },
  { id: 'L12', row: 5, col: 2, x:  2, y: 1 },
  { id: 'L13', row: 5, col: 3, x:  3, y: 1 },
  { id: 'L14', row: 5, col: 4, x:  4, y: 1 },
  { id: 'L15', row: 5, col: 5, x:  5, y: 1 },
  { id: 'R15', row: 1, col: 5, x:  7, y: 1 },
  { id: 'R14', row: 1, col: 4, x:  8, y: 1 },
  { id: 'R13', row: 1, col: 3, x:  9, y: 1 },
  { id: 'R12', row: 1, col: 2, x: 10, y: 1 },
  { id: 'R11', row: 1, col: 1, x: 11, y: 1 },
  { id: 'R10', row: 1, col: 0, x: 12, y: 1 },

  // Row 2 right / Row 6 left
  { id: 'L20', row: 6, col: 0, x:  0, y: 2 },
  { id: 'L21', row: 6, col: 1, x:  1, y: 2 },
  { id: 'L22', row: 6, col: 2, x:  2, y: 2 },
  { id: 'L23', row: 6, col: 3, x:  3, y: 2 },
  { id: 'L24', row: 6, col: 4, x:  4, y: 2 },
  { id: 'L25', row: 6, col: 5, x:  5, y: 2 },
  { id: 'R25', row: 2, col: 5, x:  7, y: 2 },
  { id: 'R24', row: 2, col: 4, x:  8, y: 2 },
  { id: 'R23', row: 2, col: 3, x:  9, y: 2 },
  { id: 'R22', row: 2, col: 2, x: 10, y: 2 },
  { id: 'R21', row: 2, col: 1, x: 11, y: 2 },
  { id: 'R20', row: 2, col: 0, x: 12, y: 2 },

  // Row 3 right / Row 7 left — サムクラスター（col 0 = KC_NO のためスキップ）
  // R33/R32・L32/L33 は ball 属性付き（ballSide 設定で左右どちらのボールにも対応）
  // 右半分は SPLIT_GAP_PX(=1キー分) 右にずれるため、R35(x6) は L35(x6) の1キー右隣に表示される
  { id: 'L31', row: 7, col: 1, x:  2, y: 3 },
  { id: 'L32', row: 7, col: 2, x:  3, y: 3, ball: 'left' },
  { id: 'L33', row: 7, col: 3, x:  4, y: 3, ball: 'left' },
  { id: 'L34', row: 7, col: 4, x:  5, y: 3 },
  { id: 'L35', row: 7, col: 5, x:  6, y: 3 },
  { id: 'R35', row: 3, col: 5, x:  6, y: 3 },
  { id: 'R34', row: 3, col: 4, x:  7, y: 3 },
  { id: 'R33', row: 3, col: 3, x:  9, y: 3, ball: 'right' },
  { id: 'R32', row: 3, col: 2, x: 10, y: 3, ball: 'right' },
  { id: 'R31', row: 3, col: 1, x: 11, y: 3 },
];
