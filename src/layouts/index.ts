export type { KeyLayout } from './types';
export { keyball39Layout } from './keyball39';
export { keyball44Layout } from './keyball44';
export { keyball61Layout } from './keyball61';

export type ModelKey = 'keyball39' | 'keyball44' | 'keyball61' | 'keyballplus';

import { keyball39Layout } from './keyball39';
import { keyball44Layout } from './keyball44';
import { keyball61Layout } from './keyball61';
import type { KeyLayout } from './types';

// Keyball+ はKeyball39とキー配置が完全に同一のため、レイアウト定義を共用する
export const LAYOUTS: Record<ModelKey, KeyLayout[]> = {
  keyball39: keyball39Layout,
  keyball44: keyball44Layout,
  keyball61: keyball61Layout,
  keyballplus: keyball39Layout,
};

// ボールの位置に合わせたレイアウトを返す。左手ボールの時はxLeftBallがあるキーのX位置を
// 差し替える（2026-10-08、Keyball44でボールを左にした時のキー位置がずれていたため）。
export function layoutForBallSide(layout: KeyLayout[], ballSide: 'left' | 'right'): KeyLayout[] {
  if (ballSide !== 'left' || !layout.some(k => k.xLeftBall !== undefined)) return layout;
  return layout.map(k => (k.xLeftBall !== undefined ? { ...k, x: k.xLeftBall } : k));
}
