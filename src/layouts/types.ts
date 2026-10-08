export interface KeyLayout {
  id:  string;   // キー識別子 ("L00" など)
  row: number;   // マトリクス行（ファームウェアと一致）
  col: number;   // マトリクス列（ファームウェアと一致）
  x:   number;   // 視覚的X位置（キー幅単位）
  y:   number;   // 視覚的Y位置（キー高さ単位）
  w?:  number;   // キー幅（省略時=1）
  ball?: 'left' | 'right'; // トラックボール占有位置（どちら側に搭載するか）
  // 左手ボール時のX位置（省略時=x）。親指キーの並びが左右非対称な機種（Keyball44）で、
  // ボールを左手にした時に右手ボール時の配置を正確に左右反転させるために使う
  xLeftBall?: number;
}
