import type { GestureWaveColor } from './protocol';

// 色相スライダーの上に表示する虹色バー。現在の彩度・明度を反映した色で12段階に分けて描画する
// （LEDSettings.tsxのbuildGradientと同じ考え方）。どの色相がどの色になるか一目で分かるようにする。
export function buildHueGradient(c: GestureWaveColor): string {
  const sat = Math.round((c.sat / 255) * 100);
  const light = Math.max(6, Math.min(62, Math.round((c.val / 255) * 62)));
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const hDeg = Math.round((360 * i) / 12);
    stops.push(`hsl(${hDeg} ${sat}% ${light}%) ${(i * 100 / 12).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}
