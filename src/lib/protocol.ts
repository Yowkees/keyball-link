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
  GET_GESTURE:   0x15,
  SET_GESTURE:   0x16,
  GET_VERSION:   0x17,
} as const;

export const MACRO_SLOT_COUNT   = 10;
export const MACRO_BUFFER_SIZE  = 400;  // 全スロット共有バッファ（バイト）
export const MACRO_CHUNK_SIZE   = 28;   // 1HIDパケットあたりのデータ量

// バッファ内のアクションコード（VIA互換）
export const MACRO_ACTION_TAP   = 0x01;
export const MACRO_ACTION_DOWN  = 0x02;  // 押し続ける（マクロキー解放時に自動UP）
export const MACRO_ACTION_DELAY = 0x04;
export const MACRO_ACTION_END   = 0x00;

export interface MacroStep {
  keycode: number;   // QMKキーコード
  delayMs: number;   // このキーを押す前に待機するms（0=即座）
  hold:    boolean;  // true=押し続ける（ホールド）, false=タップ
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
      const action = step.hold ? MACRO_ACTION_DOWN : MACRO_ACTION_TAP;
      bytes.push(action, (step.keycode >> 8) & 0xFF, step.keycode & 0xFF);
    }
    bytes.push(MACRO_ACTION_END);
  }
  // 超過分を黙って切り捨てるとEEPROM上のデータが壊れるためエラーにする
  if (bytes.length > MACRO_BUFFER_SIZE) {
    throw new Error(`マクロの合計サイズ（${bytes.length}バイト）がバッファ容量（${MACRO_BUFFER_SIZE}バイト）を超えています。ステップを減らしてください。`);
  }
  // バッファ末尾をゼロパディング
  while (bytes.length < MACRO_BUFFER_SIZE) bytes.push(0);
  return new Uint8Array(bytes);
}

/** EEPROMバッファ → MacroSlot配列 */
export function decodeMacroBuffer(buf: Uint8Array): MacroSlot[] {
  const slots: MacroSlot[] = [];
  let pos = 0;
  // バッファ先頭が不正値なら未初期化として全スロットを空で返す
  const firstByte = buf[0] ?? 0;
  if (firstByte !== MACRO_ACTION_TAP && firstByte !== MACRO_ACTION_DOWN && firstByte !== MACRO_ACTION_DELAY && firstByte !== MACRO_ACTION_END) {
    return Array.from({ length: MACRO_SLOT_COUNT }, emptyMacroSlot);
  }
  for (let m = 0; m < MACRO_SLOT_COUNT && pos < buf.length; m++) {
    const steps: MacroStep[] = [];
    let pendingDelay = 0;
    while (pos < buf.length) {
      const action = buf[pos++];
      if (action === MACRO_ACTION_END) break;
      if (action !== MACRO_ACTION_TAP && action !== MACRO_ACTION_DOWN && action !== MACRO_ACTION_DELAY) break;
      const hi = buf[pos++] ?? 0;
      const lo = buf[pos++] ?? 0;
      const val = (hi << 8) | lo;
      if (action === MACRO_ACTION_DELAY) {
        pendingDelay += val;
      } else {
        steps.push({ keycode: val, delayMs: pendingDelay, hold: action === MACRO_ACTION_DOWN });
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

// MODS（修飾＋キー同時送信）キーコード: 0x0100 | (mod5 << 8) | kc
// 例: Ctrl+C = makeModsKeycode(0x01, KC_C)
// mod5 ビット: bit0=Ctrl, bit1=Shift, bit2=Alt, bit3=GUI, bit4=右側
export function makeModsKeycode(mods: number, kc: number): number {
  // mod各ビットを8bitシフトするとQMKのQK_MODS表現になる
  // （Ctrl=0x0100, Shift=0x0200, Alt=0x0400, GUI=0x0800, 右=0x1000）
  return ((mods & 0x1F) << 8) | (kc & 0xFF);
}

// 通常キーに付加できる修飾キー（左右はトグルで切替）
export const MODIFIER_BITS = [
  { bit: 0x01, label: 'Ctrl' },
  { bit: 0x02, label: 'Shift' },
  { bit: 0x04, label: 'Alt' },
  { bit: 0x08, label: 'GUI' },
] as const;
export const MOD_RIGHT_BIT = 0x10;

// トラックボール動作レイヤーの「なし」を表す値（ファームの KB_LAYER_NONE と一致）
export const LAYER_NONE = 0xFE;

// キーボード詳細設定
export interface KbSettings {
  tappingTerm:    number;   // 50-1000ms
  autoShift:      boolean;
  permissiveHold: boolean;
  retroTapping:   boolean;
  scrollInvertV:  boolean;  // 縦スクロール反転
  scrollInvertH:  boolean;  // 横スクロール反転
  autoMouseEnable:   boolean;  // 自動マウスレイヤー有効
  autoMouseLayer:    number;   // 切り替わる対象レイヤー（0-3）
  autoMouseTimeout:  number;   // 戻るまでの時間(ms)
  autoMouseThreshold: number;  // 発動しきい値（移動量。小さいほど敏感）
  scrollLayer:    number;   // スクロールになるレイヤー（0-7 / LAYER_NONE=なし）
}

// ジェスチャー設定（GST_HOLD押下中のトラックボール方向に割り当てるキーコード）
export interface GestureConfig {
  up:    number;
  down:  number;
  left:  number;
  right: number;
  tap:   number;  // タップ（短押し）時に送る基本キーコード（0=なし＝長押し専用）
  layer: number;  // このレイヤーにいる間ジェスチャー（0-7 / LAYER_NONE=なし）
  thresholdH: number;  // 発動しきい値・横方向（左右）。小さいほど敏感。既定50、範囲10-200
  thresholdV: number;  // 発動しきい値・縦方向（上下）。小さいほど敏感。既定50、範囲10-200
}

export const GESTURE_TH_DEFAULT = 50;
export const GESTURE_TH_MIN     = 10;
export const GESTURE_TH_MAX     = 200;

// 接続中のファームウェアのバージョン（GET_VERSION未対応の旧ファームは null）
export interface FirmwareVersion {
  major: number;
  minor: number;
  patch: number;
}

// a が b より古ければ true（セマンティックバージョニング比較）
export function isOlderVersion(a: FirmwareVersion, b: FirmwareVersion): boolean {
  if (a.major !== b.major) return a.major < b.major;
  if (a.minor !== b.minor) return a.minor < b.minor;
  return a.patch < b.patch;
}

export function formatVersion(v: FirmwareVersion): string {
  return `v${v.major}.${v.minor}.${v.patch}`;
}

export const KB_FLAG_AUTO_SHIFT      = 1 << 0;
export const KB_FLAG_PERMISSIVE_HOLD = 1 << 2;
export const KB_FLAG_RETRO_TAPPING   = 1 << 3;
export const KB_FLAG_SCROLL_INV_V    = 1 << 4;
export const KB_FLAG_SCROLL_INV_H    = 1 << 5;
export const KB_FLAG_AML_DISABLE     = 1 << 6;  // セットでAML無効（0=有効）

export const KB_SETTINGS_DEFAULT: KbSettings = {
  tappingTerm:    200,
  autoShift:      false,
  permissiveHold: false,
  retroTapping:   false,
  scrollInvertV:  false,
  scrollInvertH:  false,
  autoMouseEnable:   true,
  autoMouseLayer:    1,
  autoMouseTimeout:  650,
  autoMouseThreshold: 10,
  scrollLayer:    3,
};

// 32バイトのパケットを作成するヘルパー
export function makePacket(cmd: number, ...args: number[]): Uint8Array {
  const buf = new Uint8Array(PACKET_SIZE);
  buf[0] = cmd;
  args.forEach((v, i) => { buf[i + 1] = v; });
  return buf;
}
