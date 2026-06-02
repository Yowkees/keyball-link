// ファームウェアの kb_hid.h と対応するプロトコル定義

export const KEYBALL_VID = 0x5957;
export const KEYBALL_USAGE_PAGE = 0xFF60;
export const KEYBALL_USAGE_ID   = 0x61;
export const PACKET_SIZE = 32;

// コマンドID（kb_hid.h と一致させること）
export const CMD = {
  GET_INFO:      0x01,
  GET_KEYCODE:   0x02,
  SET_KEYCODE:   0x03,
  GET_TRACKBALL: 0x04,
  SET_TRACKBALL: 0x05,
  SAVE:          0x06,
  REBOOT:        0x07,
  RESET_KEYMAP:  0x08,
  GET_ACCEL:     0x09,
  SET_ACCEL:     0x0A,
  GET_LED:       0x0B,
  SET_LED:       0x0C,
  GET_TD:        0x0D,
  SET_TD:        0x0E,
  GET_SETTINGS:  0x0F,
  SET_SETTINGS:  0x10,
  TEST_LED:      0x11,
  GET_MATRIX:    0x12,
  GET_MACRO:     0x13,
  SET_MACRO:     0x14,
} as const;

export const MACRO_SLOT_COUNT   = 10;
export const MACRO_BUFFER_SIZE  = 400;  // 全スロット共有バッファ（バイト）
export const MACRO_CHUNK_SIZE   = 28;   // 1HIDパケットあたりのデータ量

// バッファ内のアクションコード（VIA互換）
export const MACRO_ACTION_TAP   = 0x01;
export const MACRO_ACTION_DELAY = 0x04;
export const MACRO_ACTION_END   = 0x00;

export interface MacroStep {
  keycode: number;   // タップするQMKキーコード
  delayMs: number;   // このキーを押す前に待機するms（0=即座）
}

export interface MacroSlot {
  steps: MacroStep[];  // 可変長（ステップ数に制限なし、バッファ容量のみ制約）
}

export function emptyMacroSlot(): MacroSlot {
  return { steps: [] };
}

/** MacroSlot配列 → EEPROMバッファ（Uint8Array） */
export function encodeMacroBuffer(slots: MacroSlot[]): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < MACRO_SLOT_COUNT; i++) {
    const slot = slots[i] ?? emptyMacroSlot();
    for (const step of slot.steps) {
      if (step.keycode === 0) continue;
      if (step.delayMs > 0) {
        bytes.push(MACRO_ACTION_DELAY, (step.delayMs >> 8) & 0xFF, step.delayMs & 0xFF);
      }
      bytes.push(MACRO_ACTION_TAP, (step.keycode >> 8) & 0xFF, step.keycode & 0xFF);
    }
    bytes.push(MACRO_ACTION_END);
    if (bytes.length >= MACRO_BUFFER_SIZE) break;
  }
  // バッファ末尾をゼロパディング
  while (bytes.length < MACRO_BUFFER_SIZE) bytes.push(0);
  return new Uint8Array(bytes.slice(0, MACRO_BUFFER_SIZE));
}

/** EEPROMバッファ → MacroSlot配列 */
export function decodeMacroBuffer(buf: Uint8Array): MacroSlot[] {
  const slots: MacroSlot[] = [];
  let pos = 0;
  // バッファ先頭が不正値なら未初期化として全スロットを空で返す
  const firstByte = buf[0] ?? 0;
  if (firstByte !== MACRO_ACTION_TAP && firstByte !== MACRO_ACTION_DELAY && firstByte !== MACRO_ACTION_END) {
    return Array.from({ length: MACRO_SLOT_COUNT }, emptyMacroSlot);
  }
  for (let m = 0; m < MACRO_SLOT_COUNT && pos < buf.length; m++) {
    const steps: MacroStep[] = [];
    let pendingDelay = 0;
    while (pos < buf.length) {
      const action = buf[pos++];
      if (action === MACRO_ACTION_END) break;
      if (action !== MACRO_ACTION_TAP && action !== MACRO_ACTION_DELAY) break;
      const hi = buf[pos++] ?? 0;
      const lo = buf[pos++] ?? 0;
      const val = (hi << 8) | lo;
      if (action === MACRO_ACTION_DELAY) {
        pendingDelay += val;
      } else {
        steps.push({ keycode: val, delayMs: pendingDelay });
        pendingDelay = 0;
      }
    }
    slots.push({ steps });
  }
  while (slots.length < MACRO_SLOT_COUNT) slots.push(emptyMacroSlot());
  return slots;
}

export const STATUS = {
  OK:    0x00,
  ERROR: 0x01,
} as const;

export type KeyballModel = 39 | 44 | 61;

export interface KeyboardInfo {
  model:     KeyballModel;
  layers:    number;
  rows:      number;
  cols:      number;
  protocol:  number;
}

export interface LedConfig {
  effectId: number;  // 0=オフ 1=単色 2=呼吸 3=レインボー 4=スプラッシュ 5=マルチスプラッシュ
  hue:      number;  // 0-255
  sat:      number;  // 0-255
  val:      number;  // 0-255
  speed:    number;  // 0-255
}

export const LED_EFFECTS = [
  { id: 0, label: 'オフ' },
  { id: 1, label: '単色' },
  { id: 2, label: '呼吸' },
  { id: 3, label: 'レインボー' },
] as const;

export interface TrackballConfig {
  cpiIndex:  number;  // 0〜127（ファームウェア内部インデックス）
  scrollDiv: number;  // スクロール分割値（1〜7）
  accel:     number;  // ポインターアクセラレーション（0=オフ、1〜10）
  scrollMode: number; // スクロール方向: 0=縦のみ 1=横のみ 2=自由（縦横両方）
}

// スクロールスナップモード
export const SCROLL_MODE = {
  VERTICAL:   0,  // 縦のみ
  HORIZONTAL: 1,  // 横のみ
  FREE:       2,  // 自由（縦横両方）
} as const;

// CPI インデックス → 実際の CPI 値（QMK の keyball_set_cpi に対応）
export function cpiIndexToValue(index: number): number {
  return (index + 1) * 100;
}

export function cpiValueToIndex(cpi: number): number {
  return Math.max(0, Math.min(127, Math.round(cpi / 100) - 1));
}

// スクロール分割値の表示用ラベル
export function scrollDivLabel(div: number): string {
  const labels: Record<number, string> = {
    1: '1/2',
    2: '1/4',
    3: '1/8',
    4: '1/16',
    5: '1/32',
    6: '1/64',
    7: '1/128',
  };
  return labels[div] ?? `1/${Math.pow(2, div)}`;
}

// タップダンス
export const TD_SLOT_COUNT = 8;

export interface TdSlot {
  tap:   number;  // シングルタップ時のキーコード
  hold:  number;  // ホールド時のキーコード
  dtap:  number;  // ダブルタップ時のキーコード（0 = シングルタップと同じ）
  flags: number;  // bit0: スロット有効
}

// TD(n) キーコード: QK_TAP_DANCE = 0x5700
export function makeTdKeycode(slot: number): number {
  return 0x5700 | (slot & 0xFF);
}

export function parseTdKeycode(code: number): number | null {
  if (code >= 0x5700 && code <= 0x5707) return code & 0xFF;
  return null;
}

// Layer-Tap キーコード: 0x4000 | (layer << 8) | kc
export function makeLtKeycode(layer: number, kc: number): number {
  return 0x4000 | ((layer & 0x0F) << 8) | (kc & 0xFF);
}

export const LAYER_TAP_LAYERS = [
  { value: 0, label: 'レイヤー 0' },
  { value: 1, label: 'レイヤー 1' },
  { value: 2, label: 'レイヤー 2' },
  { value: 3, label: 'レイヤー 3' },
] as const;

// Mod-Tap キーコード: 0x2000 | (mod << 8) | kc
export function makeModTapKeycode(mod: number, kc: number): number {
  return 0x2000 | ((mod & 0x1F) << 8) | (kc & 0xFF);
}

// 利用可能な Mod-Tap 修飾キー一覧
export const MOD_TAP_MODS = [
  { value: 0x02, label: 'Shift (左)' },
  { value: 0x01, label: 'Ctrl (左)' },
  { value: 0x04, label: 'Alt (左)' },
  { value: 0x08, label: 'GUI (左)' },
  { value: 0x12, label: 'Shift (右)' },
  { value: 0x11, label: 'Ctrl (右)' },
  { value: 0x14, label: 'Alt (右)' },
  { value: 0x18, label: 'GUI (右)' },
] as const;

// キーボード詳細設定
export interface KbSettings {
  tappingTerm:    number;   // 50-1000ms
  autoShift:      boolean;
  permissiveHold: boolean;
  retroTapping:   boolean;
  scrollInvertV:  boolean;  // 縦スクロール反転
  scrollInvertH:  boolean;  // 横スクロール反転
}

export const KB_FLAG_AUTO_SHIFT      = 1 << 0;
export const KB_FLAG_PERMISSIVE_HOLD = 1 << 2;
export const KB_FLAG_RETRO_TAPPING   = 1 << 3;
export const KB_FLAG_SCROLL_INV_V    = 1 << 4;
export const KB_FLAG_SCROLL_INV_H    = 1 << 5;

export const KB_SETTINGS_DEFAULT: KbSettings = {
  tappingTerm:    200,
  autoShift:      false,
  permissiveHold: false,
  retroTapping:   false,
  scrollInvertV:  false,
  scrollInvertH:  false,
};

// 32バイトのパケットを作成するヘルパー
export function makePacket(cmd: number, ...args: number[]): Uint8Array {
  const buf = new Uint8Array(PACKET_SIZE);
  buf[0] = cmd;
  args.forEach((v, i) => { buf[i + 1] = v; });
  return buf;
}
