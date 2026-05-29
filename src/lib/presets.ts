// Keyball39 プリセットキーマップ定義
// 画像チートシート（Layer 0〜3）をもとに作成
// row/col はファームウェアの物理マトリクス座標に対応
//   右半分: row 0〜3, 左半分: row 4〜7

type LayerMap = Record<number, Record<number, number>>;

export interface Preset {
  id: string;
  name: string;
  description: string;
  layers: LayerMap[];
}

// ── キーコード定数 ─────────────────────────────────────────
const TRNS = 0x0001;
const NO   = 0x0000;

const KC_A=0x04, KC_B=0x05, KC_C=0x06, KC_D=0x07, KC_E=0x08, KC_F=0x09;
const KC_G=0x0A, KC_H=0x0B, KC_I=0x0C, KC_J=0x0D, KC_K=0x0E, KC_L=0x0F;
const KC_M=0x10, KC_N=0x11, KC_O=0x12, KC_P=0x13, KC_Q=0x14, KC_R=0x15;
const KC_S=0x16, KC_T=0x17, KC_U=0x18, KC_V=0x19, KC_W=0x1A, KC_X=0x1B;
const KC_Y=0x1C, KC_Z=0x1D;

const KC_1=0x1E, KC_2=0x1F, KC_3=0x20, KC_4=0x21, KC_5=0x22;
const KC_6=0x23, KC_7=0x24, KC_8=0x25, KC_9=0x26, KC_0=0x27;

const KC_ENT=0x28, KC_ESC=0x29, KC_BSPC=0x2A, KC_TAB=0x2B, KC_SPC=0x2C;
const KC_MINS=0x2D, KC_EQL=0x2E, KC_LBRC=0x2F, KC_RBRC=0x30;
const KC_SCLN=0x33, KC_QUOT=0x34;
const KC_COMM=0x36, KC_DOT=0x37, KC_SLSH=0x38;

const KC_F1=0x3A,  KC_F2=0x3B,  KC_F3=0x3C,  KC_F4=0x3D,  KC_F5=0x3E;
const KC_F6=0x3F,  KC_F7=0x40,  KC_F8=0x41,  KC_F9=0x42,  KC_F10=0x43;
const KC_PSCR=0x46;
const KC_DEL=0x4C, KC_RIGHT=0x4F, KC_LEFT=0x50, KC_DOWN=0x51, KC_UP=0x52;

const KC_LSFT=0x00E1, KC_RSFT=0x00E5, KC_LALT=0x00E2, KC_LGUI=0x00E3;
const KC_LANG1=0x90, KC_LANG2=0x91;
const KC_JYEN=0x89;
const KC_MUTE=0x00A8;

const MB1=0x00D1, MB2=0x00D2, MB3=0x00D3;
const WH_U=0x00D9, WH_D=0x00DA;

const UG_TOG=0x5B00;
const RGB_M_P=0x5B0B, RGB_M_B=0x5B0C, RGB_M_R=0x5B0D;
const RGB_M_SW=0x5B0E, RGB_M_K=0x5B10;

const MO3=0x5103;
const TG1=0x5201, TG2=0x5202, TG3=0x5203;

const KB5=0x7E05, KB8=0x7E08, KB9=0x7E09;
const KB10=0x7E0A, KB11=0x7E0B, KB12=0x7E0C;
const M0=0x7700;

// Layer-Tap / Mod+Key ヘルパー
const LT         = (layer: number, kc: number) => 0x4000 | ((layer & 0xF) << 8) | (kc & 0xFF);
const LCTL       = (kc: number) => 0x0100 | (kc & 0xFF);
const LSFT_K     = (kc: number) => 0x0200 | (kc & 0xFF);
const LGUI_K     = (kc: number) => 0x0800 | (kc & 0xFF);
const LSFT_LGUI  = (kc: number) => 0x0A00 | (kc & 0xFF);

// ── Layer 0: 通常入力 ──────────────────────────────────────
const layer0: LayerMap = {
  // 右半分 (row 0〜3)
  // col 0 = 最右端, col が増えるほど左（内側）へ
  0: { 0: KC_P,            1: KC_O,    2: KC_I,    3: KC_U,   4: KC_Y   },
  1: { 0: KC_MINS,         1: KC_L,    2: KC_K,    3: KC_J,   4: KC_H   },
  2: { 0: LT(2,KC_SLSH),   1: KC_DOT,  2: KC_COMM, 3: KC_M,   4: KC_N   },
  3: {
    0: LT(3,KC_LBRC),  // @ / Layer3（JIS: LBRCポジションが@）
    1: NO,             // 右ボール占有
    2: NO,             // 右ボール占有
    3: LT(2,KC_BSPC), // BS / Layer2
    4: LT(1,KC_ENT),  // Enter / Layer1
    5: LT(2,KC_LANG1),// かな / Layer2
  },
  // 左半分 (row 4〜7)
  4: { 0: KC_Q,            1: KC_W,    2: KC_E,    3: KC_R,   4: KC_T   },
  5: { 0: KC_A,            1: KC_S,    2: KC_D,    3: KC_F,   4: KC_G   },
  6: { 0: LT(1,KC_Z),      1: KC_X,    2: KC_C,    3: KC_V,   4: KC_B   },
  7: {
    0: KC_LSFT,
    1: KC_LGUI,
    2: KC_LALT,
    3: TRNS,
    4: LT(3,KC_LANG2), // 英数 / Layer3
    5: KC_SPC,
  },
};

// ── Layer 1: 数字・ファンクション・記号 ───────────────────
const layer1: LayerMap = {
  // 右半分
  0: { 0: KC_0,            1: KC_9,    2: KC_8,    3: KC_7,   4: KC_6   },
  1: { 0: KC_F10,          1: KC_F9,   2: KC_F8,   3: KC_F7,  4: KC_F6  },
  2: {
    0: KC_JYEN,          // ¥
    1: KC_DOT,           // >
    2: KC_COMM,          // <
    3: LSFT_K(KC_MINS),  // =（JIS: Shift+Minus）
    4: KC_SCLN,          // +;（JIS）
  },
  3: {
    0: LT(3,KC_S),
    1: NO,
    2: NO,
    3: MB1,
    4: MB1,
    5: KC_LGUI,          // Win*
  },
  // 左半分
  4: { 0: KC_1,            1: KC_2,    2: KC_3,    3: KC_4,   4: KC_5   },
  5: { 0: KC_F1,           1: KC_F2,   2: KC_F3,   3: KC_F4,  4: KC_F5  },
  6: {
    0: KC_EQL,           // ^~（JIS: EQLポジションが^）
    1: KC_JYEN,          // ¥
    2: KC_LBRC,          // [{
    3: KC_RBRC,          // ]}
    4: KC_QUOT,          // :*（JIS: QUOTポジションが:）
  },
  7: {
    0: KC_LSFT,
    1: KC_LGUI,
    2: KC_LALT,
    3: TRNS,
    4: KC_TAB,
    5: KC_ESC,
  },
};

// ── Layer 2: マウス・ナビゲーション ──────────────────────
const layer2: LayerMap = {
  // 右半分
  0: {
    0: KC_RBRC,           // }
    1: KC_LBRC,           // {
    2: LSFT_LGUI(KC_S),   // Win+Shift+S
    3: LGUI_K(KC_PSCR),   // Win+PrintScreen
    4: KC_MUTE,
  },
  1: { 0: MB3,    1: MB2,       2: KC_UP,    3: MB1,      4: WH_U   },
  2: { 0: TG2,    1: KC_RIGHT,  2: KC_DOWN,  3: KC_LEFT,  4: WH_D   },
  3: {
    0: MO3,
    1: NO,
    2: NO,
    3: KC_BSPC,
    4: KC_ENT,
    5: KC_LGUI,           // Win*
  },
  // 左半分
  4: { 0: KC_0,   1: KC_1,  2: KC_2,  3: KC_3,  4: KC_MINS         },
  5: { 0: KC_QUOT,1: KC_4,  2: KC_5,  3: KC_6,  4: KC_SCLN         },
  6: { 0: KC_SLSH,1: KC_7,  2: KC_8,  3: KC_9,  4: LSFT_K(KC_MINS) },
  7: {
    0: KC_LSFT,
    1: KC_LGUI,
    2: KC_LALT,
    3: TRNS,
    4: KC_DEL,
    5: KC_ESC,
  },
};

// ── Layer 3: RGB・Ctrl系・Keyball設定 ────────────────────
const layer3: LayerMap = {
  // 右半分
  0: {
    0: KB9,
    1: RGB_M_SW,
    2: RGB_M_R,
    3: RGB_M_B,
    4: RGB_M_P,
  },
  1: { 0: MB3,   1: MB2,      2: KC_UP,    3: MB1,      4: RGB_M_K },
  2: { 0: KB8,   1: KC_RIGHT, 2: KC_DOWN,  3: KC_LEFT,  4: KB5     },
  3: {
    0: MO3,
    1: NO,
    2: NO,
    3: MB2,
    4: MB1,
    5: TG1,
  },
  // 左半分
  4: { 0: UG_TOG,      1: KB10,        2: KB11,        3: KB12,        4: M0   },
  5: { 0: LCTL(KC_A),  1: LCTL(KC_S),  2: LCTL(KC_D),  3: LCTL(KC_F),  4: LCTL(KC_G) },
  6: { 0: LCTL(KC_Z),  1: LCTL(KC_X),  2: LCTL(KC_C),  3: LCTL(KC_V),  4: LCTL(KC_B) },
  7: {
    0: KC_RSFT,
    1: KC_LGUI,
    2: KC_PSCR,
    3: TG3,
    4: TG2,
    5: TG1,
  },
};

// ── エクスポート ───────────────────────────────────────────
export const PRESETS: Preset[] = [
  {
    id: 'keyball39-default',
    name: 'Keyball39 デフォルト',
    description: '公式チートシート準拠の4レイヤーキーマップ（JIS配列向け）',
    layers: [layer0, layer1, layer2, layer3],
  },
];
