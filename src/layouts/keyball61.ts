// Keyball61 のキーレイアウト定義
// ファームウェアでは row0-4=物理右半分, row5-9=物理左半分（keyball39と同じ構造）
// LAYOUT_no_ball は L**→row5-9(物理左), R**→row0-4(物理右) に配置する
// ウェブ表示は左側に L**、右側に R** を表示するため行番号はこの実装に合わせる

import type { KeyLayout } from './types';

export const keyball61Layout: KeyLayout[] = [
  // Row 0（左）: matrix row 5, col 3=KC_NO
  { id: 'L00', row: 5, col: 0, x: 0,    y: 0 },
  { id: 'L01', row: 5, col: 1, x: 1,    y: 0 },
  { id: 'L02', row: 5, col: 2, x: 2,    y: 0 },
  { id: 'L03', row: 5, col: 4, x: 3,    y: 0 },
  { id: 'L04', row: 5, col: 5, x: 4,    y: 0 },
  { id: 'L05', row: 5, col: 6, x: 5,    y: 0 },
  // Row 0（右）: matrix row 0, col 3=KC_NO
  { id: 'R05', row: 0, col: 6, x: 7.5,  y: 0 },
  { id: 'R04', row: 0, col: 5, x: 8.5,  y: 0 },
  { id: 'R03', row: 0, col: 4, x: 9.5,  y: 0 },
  { id: 'R02', row: 0, col: 2, x: 10.5, y: 0 },
  { id: 'R01', row: 0, col: 1, x: 11.5, y: 0 },
  { id: 'R00', row: 0, col: 0, x: 12.5, y: 0 },

  // Row 1（左）: matrix row 6, col 3=KC_NO
  { id: 'L10', row: 6, col: 0, x: 0,    y: 1 },
  { id: 'L11', row: 6, col: 1, x: 1,    y: 1 },
  { id: 'L12', row: 6, col: 2, x: 2,    y: 1 },
  { id: 'L13', row: 6, col: 4, x: 3,    y: 1 },
  { id: 'L14', row: 6, col: 5, x: 4,    y: 1 },
  { id: 'L15', row: 6, col: 6, x: 5,    y: 1 },
  // Row 1（右）: matrix row 1
  { id: 'R15', row: 1, col: 6, x: 7.5,  y: 1 },
  { id: 'R14', row: 1, col: 5, x: 8.5,  y: 1 },
  { id: 'R13', row: 1, col: 4, x: 9.5,  y: 1 },
  { id: 'R12', row: 1, col: 2, x: 10.5, y: 1 },
  { id: 'R11', row: 1, col: 1, x: 11.5, y: 1 },
  { id: 'R10', row: 1, col: 0, x: 12.5, y: 1 },

  // Row 2（左）: matrix row 7, col 3=KC_NO
  { id: 'L20', row: 7, col: 0, x: 0,    y: 2 },
  { id: 'L21', row: 7, col: 1, x: 1,    y: 2 },
  { id: 'L22', row: 7, col: 2, x: 2,    y: 2 },
  { id: 'L23', row: 7, col: 4, x: 3,    y: 2 },
  { id: 'L24', row: 7, col: 5, x: 4,    y: 2 },
  { id: 'L25', row: 7, col: 6, x: 5,    y: 2 },
  // Row 2（右）: matrix row 2
  { id: 'R25', row: 2, col: 6, x: 7.5,  y: 2 },
  { id: 'R24', row: 2, col: 5, x: 8.5,  y: 2 },
  { id: 'R23', row: 2, col: 4, x: 9.5,  y: 2 },
  { id: 'R22', row: 2, col: 2, x: 10.5, y: 2 },
  { id: 'R21', row: 2, col: 1, x: 11.5, y: 2 },
  { id: 'R20', row: 2, col: 0, x: 12.5, y: 2 },

  // Row 3（左）: matrix row 8, col 7 あり（col 3=KC_NO）
  { id: 'L30', row: 8, col: 0, x: 0,    y: 3 },
  { id: 'L31', row: 8, col: 1, x: 1,    y: 3 },
  { id: 'L32', row: 8, col: 2, x: 2,    y: 3 },
  { id: 'L33', row: 8, col: 4, x: 3,    y: 3 },
  { id: 'L34', row: 8, col: 5, x: 4,    y: 3 },
  { id: 'L35', row: 8, col: 6, x: 5,    y: 3 },
  { id: 'L36', row: 8, col: 7, x: 6,    y: 3 },
  // Row 3（右）: matrix row 3
  { id: 'R36', row: 3, col: 7, x: 6.5,  y: 3 },
  { id: 'R35', row: 3, col: 6, x: 7.5,  y: 3 },
  { id: 'R34', row: 3, col: 5, x: 8.5,  y: 3 },
  { id: 'R33', row: 3, col: 4, x: 9.5,  y: 3 },
  { id: 'R32', row: 3, col: 2, x: 10.5, y: 3 },
  { id: 'R31', row: 3, col: 1, x: 11.5, y: 3 },
  { id: 'R30', row: 3, col: 0, x: 12.5, y: 3 },

  // Row 4（左）: matrix row 9, col 7 あり（col 3=KC_NO）
  // L42/L43/L44 は左ボール搭載時にトラックボールが占有する位置
  { id: 'L40', row: 9, col: 0, x: 0,    y: 4 },
  { id: 'L41', row: 9, col: 1, x: 1,    y: 4 },
  { id: 'L42', row: 9, col: 2, x: 2,    y: 4, ball: 'left' },
  { id: 'L43', row: 9, col: 4, x: 3,    y: 4, ball: 'left' },
  { id: 'L44', row: 9, col: 5, x: 4,    y: 4, ball: 'left' },
  { id: 'L45', row: 9, col: 6, x: 5,    y: 4 },
  { id: 'L46', row: 9, col: 7, x: 6,    y: 4 },
  // Row 4（右）: matrix row 4
  // R44/R43/R42 は右ボール搭載時にトラックボールが占有する位置
  { id: 'R46', row: 4, col: 7, x: 6.5,  y: 4 },
  { id: 'R45', row: 4, col: 6, x: 7.5,  y: 4 },
  { id: 'R44', row: 4, col: 5, x: 8.5,  y: 4, ball: 'right' },
  { id: 'R43', row: 4, col: 4, x: 9.5,  y: 4, ball: 'right' },
  { id: 'R42', row: 4, col: 2, x: 10.5, y: 4, ball: 'right' },
  { id: 'R41', row: 4, col: 1, x: 11.5, y: 4 },
  { id: 'R40', row: 4, col: 0, x: 12.5, y: 4 },
];
