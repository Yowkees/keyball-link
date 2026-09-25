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
  GET_PRECISION: 0x18,
  SET_PRECISION: 0x19,
  GET_LAYER_LED_ENABLE: 0x1A,
  SET_LAYER_LED_ENABLE: 0x1B,
  GET_LAYER_LED:        0x1C,
  SET_LAYER_LED:        0x1D,
  GET_SCROLL_INERTIA:   0x1E,
  SET_SCROLL_INERTIA:   0x1F,
  GET_GESTURE_MODE:      0x20,
  SET_GESTURE_MODE:      0x21,
  GET_GESTURE_THRESHOLD: 0x22,
  SET_GESTURE_THRESHOLD: 0x23,
  GET_GESTURE_WAVE_SPEED: 0x24,
  SET_GESTURE_WAVE_SPEED: 0x25,
  GET_GESTURE_WAVE_ENABLE: 0x26,
  SET_GESTURE_WAVE_ENABLE: 0x27,
  GET_SHAKE:  0x28,
  SET_SHAKE:  0x29,
  GET_DFLICK: 0x2A,
  SET_DFLICK: 0x2B,
  GET_COMBO: 0x2C,
  SET_COMBO: 0x2D,
  GET_OS: 0x2E,
  GET_DPI_CURVE: 0x2F,
  SET_DPI_CURVE: 0x30,
} as const;

// OS自動判別の種別（ファームウェア os_variant_t と一致させる）
export const OS_VARIANT_NAMES = ['判別中…', 'Linux', 'Windows', 'macOS', 'iOS'] as const;

// DPIカーブ（Photoshopのトーンカーブのように、トラックボールの「動きの速さ」を
// 好きな形の折れ線で「実際に送る速さ」に変換する機能。RP2040版限定）。
// X軸（入力の速さ）はファームウェア側で固定（KB_DPI_CURVE_Xと一致させる）。
// Y軸（出力の速さ）だけをユーザーが各点0-255で調整する。
// 2026-09-11、本人希望でより細かく調整できるよう5点→9点に増量。
export const DPI_CURVE_X = [0, 16, 32, 48, 64, 80, 96, 112, 127] as const;
export const DPI_CURVE_Y_MAX = 255;

export interface DpiCurveConfig {
  enable: boolean;
  points: number[];  // 長さDPI_CURVE_X.length、各0-255（出力の速さ）
}

// 既定値: Y=X の対角線（＝カーブ無効時と同じ、動きの速さを変えない）
export function defaultDpiCurvePoints(): number[] {
  return [...DPI_CURVE_X];
}

// 「加速度」設定(0=オフ,1-10)から、DPIカーブと同じ9点形式の実効的な速度カーブを
// 算出する（ボール動作の加速度スライダーとDPIカーブのグラフを連動表示するため）。
// ファームウェア側の実際の計算式(keymap.cのkeyball_on_apply_motion_to_mouse_move、
// scale=64/accel、out=dx*speed/scale)と一致させること。出力は実際のマウスレポート
// (int8_t)の範囲に合わせて127までにクランプする（DPIカーブのY軸最大255のうち
// 127までしか到達しないのは正しい挙動）。
export function computeAccelCurvePoints(accel: number): number[] {
  return DPI_CURVE_X.map(x => {
    if (accel === 0 || x === 0) return x;
    return Math.max(0, Math.min(127, Math.round((x * x * accel) / 64)));
  });
}

// ファームウェア(kb_settings.cのkb_dpi_curve_rebuild_lut)と全く同じ計算をJS側でも
// 行い、エディタの見た目と実機の動きを一致させる。単調3次エルミート曲線
// （Fritsch-Carlsonの簡略版。sqrtを使わず、各区間の接線比を[0,3]にクランプする
// 十分条件で、オーバーシュートせず滑らかにする）で5点を結び、入力の速さ0-127
// それぞれに対応する出力値（0-255）を127+1個並べて返す。
export function computeDpiCurveLut(points: number[]): number[] {
  const xs = DPI_CURVE_X;
  const n = xs.length;
  const ys = points;

  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }

  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = (d[i - 1] + d[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const alpha = m[i] / d[i];
    const beta = m[i + 1] / d[i];
    if (alpha < 0) m[i] = 0;
    else if (alpha > 3) m[i] = 3 * d[i];
    if (beta < 0) m[i + 1] = 0;
    else if (beta > 3) m[i + 1] = 3 * d[i];
  }

  const lut: number[] = [];
  for (let x = 0; x <= xs[n - 1]; x++) {
    let seg = n - 2;
    for (let i = 0; i < n - 1; i++) {
      if (x <= xs[i + 1]) { seg = i; break; }
    }
    const x0 = xs[seg], x1 = xs[seg + 1];
    const h = x1 - x0;
    const t = h > 0 ? (x - x0) / h : 0;
    const t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    const y = h00 * ys[seg] + h10 * h * m[seg] + h01 * ys[seg + 1] + h11 * h * m[seg + 1];
    lut.push(Math.max(0, Math.min(255, Math.round(y))));
  }
  return lut;
}

// 精密モードのCPI分周値の範囲（ファームウェア側と合わせる）
// 上限は5: 実CPIは100刻みが下限のため、デフォルトCPI(500)ではこれ以上大きくしても
// 100CPIに張り付くだけで差が出ない（本人判断で5を上限に固定）。
export const PRECISION_DIV_MIN     = 2;
export const PRECISION_DIV_MAX     = 5;
export const PRECISION_DIV_DEFAULT = 4;

// 精密モード設定
export interface PrecisionConfig {
  div:   number;  // CPI分周値（実CPI ÷ この値）。範囲2-20、既定4
  layer: number;  // このレイヤーにいる間は自動的に精密モード（0-7 / LAYER_NONE=なし）
}

// 慣性スクロール（ボールを弾いた後、しばらく減衰しながらスクロールが続く）の範囲。
// 上限を254にしているのはファーム側の未初期化EEPROM値(0xFF=255)と衝突させないため
// （kb_settings.h参照）。
export const SCROLL_INERTIA_STRENGTH_MIN     = 0;
export const SCROLL_INERTIA_STRENGTH_MAX     = 15;  // 2026-09-17: 254→15（最大設定が強すぎるとの指摘で縮小）
export const SCROLL_INERTIA_STRENGTH_DEFAULT = 8;

// 発動しきい値の倍率×10（例:30なら3.0倍）。ゆっくり動かした時は発動させず、
// 速く弾いた時だけ発動させるためのしきい値。大きいほど「よほど速く弾かないと
// 発動しない」、小さいほど「そこそこの速さでも発動する」。
export const SCROLL_INERTIA_FLICK_MULT_MIN     = 1;   // 0.1倍
export const SCROLL_INERTIA_FLICK_MULT_MAX     = 30;  // 3.0倍
export const SCROLL_INERTIA_FLICK_MULT_DEFAULT = 25;  // 2.5倍

export interface ScrollInertiaConfig {
  enable:    boolean;
  strength:  number;  // 0-15。大きいほど長く・遠くまで滑る
  flickMult: number;  // 5-100（×10した整数、例:30=3.0倍）。発動に必要な速さのしきい値
}

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
  effectId: number;  // LED_EFFECTS参照
  hue:      number;  // 0-255
  sat:      number;  // 0-255
  val:      number;  // 0-255
  speed:    number;  // 0-255
}

// エフェクト一覧。ファームウェアのLED_EFFECT_MAP/RGB_MATRIX_LED_EFFECT_MAP(kb_hid.c)
// と対応させること。id自体はファーム側の対応表の都合上とびとびだが（12は削除済みで
// 欠番）、表示順は「基本の光り方→リアクティブ→色が移り変わる系→動きのある系→
// 季節限定」の順に整頓している。
// - スネーク(5)は動きの調整中のため一旦非表示（本家RGBLIGHT版のIDとしては存在する）。
// - ナイトライダー(6)は旧RGBLIGHT版からの欠番のまま、こちらも復活時は要調整。
// - 交互点灯(10)はRGB_MATRIX移行版で片側ハーフ内完結の実装に直り復活可能になったが、
//   本家RGBLIGHT版と共有のリストのため一旦保留。
// 11・13は季節限定エフェクト（クリスマスと同じ市松模様の交互点灯。色相固定なので
// 色相スライダーは無効）。
// 14・15・16・17はRGB_MATRIX版限定の追加エフェクト。AVR版（RGBLIGHT版）のファーム
// ではこれらのIDに対応が無いため、選択するとLEDが消灯する（kb_hid.cのRGBLIGHT分岐は
// off/ソリッド/ブリージング/レインボームードの4種のみで、範囲外のIDはoff扱いになる
// ため）。2026-09-25判明、Web UI側は`LED_EFFECT_IDS_AVR`でAVR接続時にこの4種のみに
// 絞り込むようにした（下記参照）。
// 18(ジェスチャーウェーブ)は選択式エフェクトではないためここには含めない。複数
// ジェスチャーモード機能と連動する常時有効なオーバーレイで、ジェスチャーで実際に
// キーが送出された瞬間だけファーム側(keyball_gesture_wave_task)が現在のLED表示を
// 自動的に一時上書きする（通常LED・レイヤー連動LEDのどちらが選ばれていても発動する）。
// 速度はgestureWaveSpeed（GET/SET_GESTURE_WAVE_SPEED）で別途設定する。
export const LED_EFFECTS = [
  { id: 0,  label: 'オフ' },
  { id: 1,  label: 'ソリッド' },
  { id: 2,  label: 'ブリージング' },
  { id: 14, label: 'リアクティブ' },
  { id: 17, label: 'リップル' },
  { id: 15, label: 'タイピングヒートマップ' },
  { id: 16, label: 'トラックボールリアクティブ' },
  { id: 8,  label: 'グラデーション' },
  { id: 3,  label: 'レインボー' },
  { id: 4,  label: 'スワール' },
  { id: 9,  label: 'トゥインクル' },
  { id: 7,  label: 'クリスマス' },
  { id: 11, label: 'ハロウィン' },
  { id: 13, label: 'イースター' },
] as const;

// AVR版（RGBLIGHT版）ファームが実際に対応しているエフェクトID。
// kb_hid.c の RGBLIGHT分岐（keyball-link-firmware/keyball-plus-firmware共通）は
// off(0)/ソリッド(1)/ブリージング(2)/レインボームード(3)の4種のみを実装しており、
// それ以外のIDをSET_LEDで送るとLEDが消灯する。AVR接続時はLED_EFFECTSをこの4種のみに
// 絞り込んで、選択しても実際には効かないエフェクトを選べないようにする。
export const LED_EFFECT_IDS_AVR = [0, 1, 2, 3] as const;

// 季節限定エフェクト（色相固定・2〜3色クロスフェード動作。色相スライダーは無効にする）
export const LED_SEASONAL_EFFECT_IDS = [11, 13] as const;

// 色相を固定パレットで決め打ちしていて色相スライダーが効かないエフェクト。
// クリスマス(7)・ハロウィン(11)・イースター(13)はrender_checkerboard()
// （rgb_matrix_user.inc）で固定色相の配列を使っている。タイピングヒートマップ(15)は
// 自作HEATMAP実装（rgb_matrix_user.inc）で、押した回数（蓄熱量）に応じて色相を
// 寒色→暖色へ内部計算するため色相スライダーは効かない（彩度・明るさは設定値を使う）。
export const LED_FIXED_HUE_EFFECT_IDS = [7, 11, 13, 15] as const;

// 速度パラメータを使わないエフェクト（速度スライダーを無効にする）。
// グラデーション(8)は静止した配色で時間変化が無く、リアクティブ(14)はフェード時間が
// 固定（ファーム側でFADE_MS定数）で速度設定を参照していない。
// タイピングヒートマップ(15)は2026-09-18に「赤くなる早さを調整したい」との要望を受け、
// 速度スライダーを「1打鍵あたりの熱量増加（＝何回打つと赤くなるか）」に転用したため、
// ここでは対象外にしている（減衰間隔自体は引き続きファーム側の固定値）。
export const LED_NO_SPEED_EFFECT_IDS = [8, 14] as const;

// レイヤー連動LED: 指定レイヤーにいる間だけ適用する専用のLED設定
export interface LayerLedConfig {
  enabled:  boolean;  // このレイヤーで専用の光り方を使うか
  effectId: number;
  hue:      number;
  sat:      number;
  val:      number;
  speed:    number;
}

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

// レイヤー数は機種・ファームウェアにより異なる（AVR版は4、RP2040版は8など）ため、
// 接続中の実際のレイヤー数を渡して選択肢を生成する。未接続時などは4件を既定値とする。
export function getLayerTapLayers(layerCount: number = 4) {
  return Array.from({ length: layerCount }, (_, i) => ({ value: i, label: `レイヤー ${i}` }));
}

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
  combo:          boolean;
  permissiveHold: boolean;
  retroTapping:   boolean;
  scrollInvertV:  boolean;  // 縦スクロール反転
  scrollInvertH:  boolean;  // 横スクロール反転
  autoMouseEnable:   boolean;  // 自動マウスレイヤー有効
  autoMouseLayer:    number;   // 切り替わる対象レイヤー（0-3）
  autoMouseTimeout:  number;   // 戻るまでの時間(ms)
  autoMouseThreshold: number;  // 発動しきい値（移動量。小さいほど敏感）
  scrollLayer:    number;   // スクロールになるレイヤー（0-7 / LAYER_NONE=なし）
  osAutoSwap:     boolean;   // OS自動判別: Mac/iOS接続時にCmd(⌘)とCtrlを自動入れ替え
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

// 複数ジェスチャーモード（RP2040版限定。GST_HOLD〜4キーまたはレイヤー連動で
// 4つのモードを切り替えて使う）。旧・単一モードのGestureConfigとは互換性がなく、
// 対応ファームでは併用せずこちらだけを使う。
export const GESTURE_MODE_COUNT = 4;

// ジェスチャーモード1件分の設定。continuous*がtrueの方向は、割当キーを
// 回転速度に応じた間隔で連続タップする（音量調整・フォントサイズ変更など向け）。
// falseの方向は従来のジェスチャーと同様に1回だけ送出する。
export interface GestureModeConfig {
  up: number; down: number; left: number; right: number;  // 割当キーコード（0=未設定）
  continuousUp: boolean;
  continuousDown: boolean;
  continuousLeft: boolean;
  continuousRight: boolean;
  layer: number;  // 連動レイヤー（0-7 / LAYER_NONE=なし）
}

// 発動しきい値（全モード共通）
export interface GestureThreshold {
  h: number;  // 横方向（左右）
  v: number;  // 縦方向（上下）
}

// ジェスチャー連動LEDウェーブの速さ（大きいほど速く流れて早く消える）。通常LED・
// レイヤー連動LEDの速度設定とは独立（ウェーブは選択式のエフェクトではなく、それらの
// 表示をジェスチャー発火時だけ自動的に一時上書きする演出のため）。
export const GESTURE_WAVE_SPEED_DEFAULT = 200;
export const GESTURE_WAVE_SPEED_MIN     = 1;
export const GESTURE_WAVE_SPEED_MAX     = 255;

// シェイク機能（トラックボールを振ると設定したキーを発動）。ジェスチャーモードの
// 選択状態に関わらず常時判定する。keyが0の間は機能そのものが無効（キー未設定）。
// enableはキー設定を消さずに機能ごとON/OFFするための独立したフラグ（シェイクと
// ダブルフリックのどちらが原因か切り分けたい、という要望で追加）。
export interface ShakeConfig {
  key:        number;  // 発動キーコード（0=未設定・無効）
  threshold:  number;  // 感度（小さいほど敏感）
  reversals:  number;  // 発動に必要な反転回数（多いほど厳しい）
  runMaxMs:   number;  // 反転が全て収まるべき時間の上限(ms)（短いほど厳しい）
  enable:     boolean;
}
export const SHAKE_THRESHOLD_DEFAULT = 60;
export const SHAKE_THRESHOLD_MIN     = 10;
export const SHAKE_THRESHOLD_MAX     = 200;

// 現状の既定値（反転6回・700ms）を中心に、緩める方向・厳しくする方向の
// 両方に余白を持たせている（2026-09-10）。
export const SHAKE_REVERSALS_DEFAULT = 6;
export const SHAKE_REVERSALS_MIN     = 2;
export const SHAKE_REVERSALS_MAX     = 12;

export const SHAKE_RUN_MAX_MS_DEFAULT = 700;
export const SHAKE_RUN_MAX_MS_MIN     = 100;
export const SHAKE_RUN_MAX_MS_MAX     = 2000;
export const SHAKE_RUN_MAX_MS_STEP    = 10;  // ファーム側は10ms単位でしか保存できない

// ダブルフリック（同じ方向へ短時間で2回フリックすると発火）。ジェスチャーモード
// （GST_HOLD〜4キーやジェスチャーレイヤー）とは独立しており、通常のトラックボール
// 操作（カーソル移動）中に動作する。
export interface DFlickConfig {
  up: number; down: number; left: number; right: number;  // 割当キーコード（0=未設定）
  windowMs: number;  // 2回目のフリックを同じダブルフリックとして認識する時間の上限(ms)
  flickThreshold: number;  // フリック判定のしきい値（動き始めから止まるまでの移動量合計。小さいほど敏感）
  maxDurationMs: number;  // 「フリック」とみなす動き続けている時間の上限(ms)。長いほど緩い
  enable: boolean;
}
// 2026-09-11、本人が実機で詰めた値（感度30・時間窓500ms・動作時間上限420ms）を
// 新しい既定値にし、その値を中心に調整範囲を組み直した。
export const DFLICK_WINDOW_MS_DEFAULT = 500;
export const DFLICK_WINDOW_MS_MIN     = 200;
export const DFLICK_WINDOW_MS_MAX     = 800;
export const DFLICK_WINDOW_MS_STEP    = 10;  // ファーム側は10ms単位でしか保存できない

export const DFLICK_FLICK_THRESHOLD_DEFAULT = 30;
export const DFLICK_FLICK_THRESHOLD_MIN     = 5;
export const DFLICK_FLICK_THRESHOLD_MAX     = 60;

// トラックボールは指で弾いた後も慣性で転がり続けるため、実際のフリックの
// 継続時間が短すぎる既定値だと「感度・時間窓をどれだけ緩めても発動しない」
// 事態になりうる（2026-09-10発覚）。ここを緩めれば、多少長く動き続けても
// 「フリック」として認識されやすくなる。
export const DFLICK_MAX_DURATION_MS_DEFAULT = 420;
export const DFLICK_MAX_DURATION_MS_MIN     = 150;
export const DFLICK_MAX_DURATION_MS_MAX     = 700;
export const DFLICK_MAX_DURATION_MS_STEP    = 10;  // ファーム側は10ms単位でしか保存できない

// コンボ（複数キーを同時押しすると別のキーを発動する。RP2040版限定）
export const COMBO_SLOT_COUNT = 8;
export const COMBO_MAX_KEYS   = 4;  // 1コンボあたりの同時押しキー数の上限

export interface ComboSlot {
  keys: number[];    // 同時押しするキー（長さCOMBO_MAX_KEYS。0=未使用。先頭から詰めて設定する）
  keycode: number;   // 発動するキー（0=このスロットは無効）
}

export function emptyComboSlot(): ComboSlot {
  return { keys: Array(COMBO_MAX_KEYS).fill(0), keycode: 0 };
}

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
export const KB_FLAG_COMBO           = 1 << 1;
export const KB_FLAG_PERMISSIVE_HOLD = 1 << 2;
export const KB_FLAG_RETRO_TAPPING   = 1 << 3;
export const KB_FLAG_SCROLL_INV_V    = 1 << 4;
export const KB_FLAG_SCROLL_INV_H    = 1 << 5;
export const KB_FLAG_AML_DISABLE     = 1 << 6;  // セットでAML無効（0=有効）
export const KB_FLAG_OS_AUTO_SWAP    = 1 << 7;  // セットでMac/iOS接続時にCmd/Ctrl自動入れ替え

export const KB_SETTINGS_DEFAULT: KbSettings = {
  tappingTerm:    200,
  autoShift:      false,
  combo:          false,
  permissiveHold: true,  // 2026-09-11、本人希望により既定ON
  retroTapping:   false,
  scrollInvertV:  false,
  scrollInvertH:  false,
  autoMouseEnable:   true,
  autoMouseLayer:    1,
  autoMouseTimeout:  650,
  autoMouseThreshold: 10,
  scrollLayer:    3,
  osAutoSwap:     false,
};

// 32バイトのパケットを作成するヘルパー
export function makePacket(cmd: number, ...args: number[]): Uint8Array {
  const buf = new Uint8Array(PACKET_SIZE);
  buf[0] = cmd;
  args.forEach((v, i) => { buf[i + 1] = v; });
  return buf;
}
