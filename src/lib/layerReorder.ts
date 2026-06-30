// レイヤーの並べ替え（中身の移動＋レイヤー参照キーコードの番号付け替え）

// レイヤーを参照するキーコード（MO/TO/TG/DF/OSL/TT/LT）のレイヤー番号を付け替える。
// map: 元レイヤー番号 → 新しいレイヤー番号
export function remapLayerInKeycode(code: number, map: (oldLayer: number) => number): number {
  // TO/MO/DF/TG/OSL: 0x5200-0x529F, TT: 0x52C0-0x52DF — レイヤーは下位5bit
  // （0x52A0-0x52BF はワンショット修飾＝修飾子なので対象外）
  if ((code >= 0x5200 && code <= 0x529F) || (code >= 0x52C0 && code <= 0x52DF)) {
    const layer = code & 0x1F;
    return (code & ~0x1F) | (map(layer) & 0x1F);
  }
  // LT(layer, kc): 0x4000-0x43FF — レイヤーは bit8-11
  if (code >= 0x4000 && code <= 0x43FF) {
    const layer = (code >> 8) & 0xF;
    return 0x4000 | ((map(layer) & 0xF) << 8) | (code & 0xFF);
  }
  return code;
}

// order: 新しい位置 → 元のレイヤー番号（全レイヤーの並べ替え）。
// 中身を移動し、レイヤー参照キーコードの番号も新しい位置に合わせた新キーマップを返す。
export function reorderKeymap(keymap: number[][][], order: number[]): number[][][] {
  // 元レイヤー番号 → 新しい位置 の逆引き
  const oldToNew: number[] = [];
  order.forEach((oldLayer, newPos) => { oldToNew[oldLayer] = newPos; });
  const mapLayer = (oldLayer: number) => (oldToNew[oldLayer] ?? oldLayer);

  return order.map(oldLayer => {
    const src = keymap[oldLayer] ?? [];
    return src.map(row => row.map(code => remapLayerInKeycode(code, mapLayer)));
  });
}

// 配列が恒等（[0,1,2,...]）か
export function isIdentityOrder(order: number[]): boolean {
  return order.every((v, i) => v === i);
}
