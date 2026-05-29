export interface KeyLayout {
  id:  string;   // キー識別子 ("L00" など)
  row: number;   // マトリクス行（ファームウェアと一致）
  col: number;   // マトリクス列（ファームウェアと一致）
  x:   number;   // 視覚的X位置（キー幅単位）
  y:   number;   // 視覚的Y位置（キー高さ単位）
  w?:  number;   // キー幅（省略時=1）
  ball?: 'left' | 'right'; // トラックボール占有位置（どちら側に搭載するか）
}
