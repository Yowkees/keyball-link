import type { ModelKey } from '../layouts';

// Keyball全機種共通のVendorID
export const KEYBALL_VID = 22871;

export type Chip = 'avr' | 'rp2040';

// AVR版（Pro Micro等）のProductID
export const MODEL_PIDS_AVR: Record<ModelKey, number> = {
  keyball39: 512,
  keyball44: 1024,
  keyball61: 256,
  keyballplus: 1280,
};

// RP2040版（SparkFun Pro Micro RP2040）のProductID。移植済みの機種のみ。
export const MODEL_PIDS_RP2040: Partial<Record<ModelKey, number>> = {
  keyball39: 1536,
  keyballplus: 1792,
};

// KeyLayoutCards.tsx の既存呼び出し用エイリアス（AVR版の表を指す）
export const MODEL_PIDS = MODEL_PIDS_AVR;

// 接続中デバイスの生のproductIdからチップ種別を判定する。
// KEYBALL_MODEL値（機種名）だけではAVR/RP2040を区別できない機種があるため
// （例: KeyballplusはAVR/RP2040どちらも同じ139）、判定には生PIDを使う。
export function chipForProductId(productId: number): Chip | undefined {
  if (Object.values(MODEL_PIDS_AVR).includes(productId)) return 'avr';
  if (Object.values(MODEL_PIDS_RP2040).includes(productId)) return 'rp2040';
  return undefined;
}
