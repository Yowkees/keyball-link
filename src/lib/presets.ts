// プリセットキーマップ定義
// row/col はファームウェアの物理マトリクス座標に対応
//   右半分: row 0〜3（Keyball61は0〜4）, 左半分: row 4〜7（Keyball61は5〜9）

import type { ModelKey } from '../layouts';

type LayerMap = Record<number, Record<number, number>>;

export interface Preset {
  id: string;
  name: string;
  description: string;
  model: ModelKey;
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

const UG_TOG=0x7820;
const RGB_M_P=0x782B, RGB_M_B=0x782C, RGB_M_R=0x782D;
const RGB_M_SW=0x782E, RGB_M_K=0x7830;

const MO3=0x5223;
const TG1=0x5261, TG2=0x5262, TG3=0x5263;

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

// ── 標準ファームウェア（Remap対応版）互換プリセット ─────────
// 本家 https://github.com/yowkees/keyball の各機種「via」キーマップを
// このアプリのrow/col形式に変換したもの（内容は変更せず機械的に変換）。
// Keyball61のみ、EEPROM全消去キー（EE_CLR）が標準搭載されているが、
// 誤操作でのデータ消失を避けるため、このプリセットからは除外している
// （Keyball Linkの「初期化」ボタンで同等の操作ができる）。
const via39_layer0: LayerMap = {
  0: { 0: 0x0013, 1: 0x0012, 2: 0x000C, 3: 0x0018, 4: 0x001C },
  1: { 0: 0x002D, 1: 0x000F, 2: 0x000E, 3: 0x000D, 4: 0x000B },
  2: { 0: 0x0038, 1: 0x0037, 2: 0x0036, 3: 0x0010, 4: 0x0011 },
  3: { 0: 0x00E5, 1: 0x00E7, 2: 0x00E6, 3: 0x2291, 4: 0x4228, 5: 0x002A },
  4: { 0: 0x0014, 1: 0x001A, 2: 0x0008, 3: 0x0015, 4: 0x0017 },
  5: { 0: 0x0004, 1: 0x0016, 2: 0x0007, 3: 0x0009, 4: 0x000A },
  6: { 0: 0x001D, 1: 0x001B, 2: 0x0006, 3: 0x0019, 4: 0x0005 },
  7: { 0: 0x00E0, 1: 0x00E3, 2: 0x00E2, 3: 0x2291, 4: 0x412C, 5: 0x4390 },
};

const via39_layer1: LayerMap = {
  0: { 0: 0x0043, 1: 0x0042, 2: 0x0041, 3: 0x0040, 4: 0x003F },
  1: { 0: 0x0033, 1: 0x00D2, 2: 0x004B, 3: 0x00D1, 4: 0x0287 },
  2: { 0: 0x0044, 1: 0x00D3, 2: 0x004E, 3: 0x0221, 4: 0x002F },
  3: { 0: 0x0045, 1: 0x00E7, 2: 0x00E6, 3: TRNS, 4: 0x5200, 5: 0x5202 },
  4: { 0: 0x003A, 1: 0x003B, 2: 0x003C, 3: 0x003D, 4: 0x0030 },
  5: { 0: 0x003E, 1: 0x021E, 2: 0x0223, 3: 0x0289, 4: 0x0225 },
  6: { 0: 0x022E, 1: 0x022F, 2: 0x0224, 3: 0x021F, 4: 0x0230 },
  7: { 0: 0x0087, 1: 0x002E, 2: 0x0220, 3: TRNS, 4: TRNS, 5: TRNS },
};

const via39_layer2: LayerMap = {
  0: { 0: 0x002A, 1: TRNS, 2: 0x00D3, 3: TRNS, 4: 0x0032 },
  1: { 0: 0x0034, 1: 0x00D2, 2: 0x0052, 3: 0x00D1, 4: 0x0226 },
  2: { 0: TRNS, 1: 0x004F, 2: 0x0051, 3: 0x0050, 4: 0x0232 },
  3: { 0: TRNS, 1: TRNS, 2: TRNS, 3: TRNS, 4: TRNS, 5: TRNS },
  4: { 0: 0x002B, 1: 0x0024, 2: 0x0025, 3: 0x0026, 4: 0x002D },
  5: { 0: 0x0234, 1: 0x0021, 2: 0x0022, 3: 0x0023, 4: 0x0233 },
  6: { 0: 0x0038, 1: 0x001E, 2: 0x001F, 3: 0x0020, 4: 0x022D },
  7: { 0: 0x0029, 1: 0x0027, 2: 0x0037, 3: 0x004C, 4: 0x0028, 5: 0x002A },
};

const via39_layer3: LayerMap = {
  0: { 0: 0x7E0F, 1: 0x7E0D, 2: 0x7E0E, 3: TRNS, 4: TRNS },
  1: { 0: TRNS, 1: TRNS, 2: TRNS, 3: TRNS, 4: TRNS },
  2: { 0: 0x7E01, 1: 0x7E04, 2: 0x7E02, 3: 0x7E03, 4: 0x7E05 },
  3: { 0: 0x7C00, 1: 0x7E00, 2: TRNS, 3: TRNS, 4: TRNS, 5: TRNS },
  4: { 0: 0x7820, 1: 0x7E0A, 2: 0x7E0B, 3: 0x7E0C, 4: TRNS },
  5: { 0: 0x7821, 1: 0x7823, 2: 0x7825, 3: 0x7827, 4: 0x7E08 },
  6: { 0: 0x7822, 1: 0x7824, 2: 0x7826, 3: 0x7828, 4: 0x7E09 },
  7: { 0: 0x7C00, 1: 0x7E00, 2: TRNS, 3: TRNS, 4: TRNS, 5: TRNS },
};

const via44_layer0: LayerMap = {
  0: { 0: 0x004C, 1: 0x0013, 2: 0x0012, 3: 0x000C, 4: 0x0018, 5: 0x001C },
  1: { 0: 0x0224, 1: 0x0033, 2: 0x000F, 3: 0x000E, 4: 0x000D, 5: 0x000B },
  2: { 0: 0x0087, 1: 0x0038, 2: 0x0037, 3: 0x0036, 4: 0x0010, 5: 0x0011 },
  3: { 0: NO, 1: 0x0046, 2: 0x00E6, 3: 0x3191, 4: 0x4228, 5: 0x002A },
  4: { 0: 0x0029, 1: 0x0014, 2: 0x001A, 3: 0x0008, 4: 0x0015, 5: 0x0017 },
  5: { 0: 0x002B, 1: 0x0004, 2: 0x0016, 3: 0x0007, 4: 0x0009, 5: 0x000A },
  6: { 0: 0x00E1, 1: 0x001D, 2: 0x001B, 3: 0x0006, 4: 0x0019, 5: 0x0005 },
  7: { 0: NO, 1: 0x00E2, 2: 0x00E3, 3: 0x2191, 4: 0x412C, 5: 0x4390 },
};

const via44_layer1: LayerMap = {
  0: { 0: 0x0044, 1: 0x0043, 2: 0x0042, 3: 0x0041, 4: 0x0040, 5: 0x003F },
  1: { 0: 0x0045, 1: 0x00D3, 2: 0x00D2, 3: 0x0052, 4: 0x00D1, 5: 0x004B },
  2: { 0: TRNS, 1: TRNS, 2: 0x004F, 3: 0x0051, 4: 0x0050, 5: 0x004E },
  3: { 0: NO, 1: TRNS, 2: TRNS, 3: TRNS, 4: TRNS, 5: TRNS },
  4: { 0: 0x7E0F, 1: 0x003A, 2: 0x003B, 3: 0x003C, 4: 0x003D, 5: 0x003E },
  5: { 0: 0x7E0D, 1: TRNS, 2: TRNS, 3: 0x0052, 4: 0x0028, 5: 0x004C },
  6: { 0: 0x7E0E, 1: TRNS, 2: 0x0050, 3: 0x0051, 4: 0x004F, 5: 0x002A },
  7: { 0: NO, 1: TRNS, 2: TRNS, 3: TRNS, 4: TRNS, 5: TRNS },
};

const via44_layer2: LayerMap = {
  0: { 0: TRNS, 1: 0x0221, 2: 0x002F, 3: 0x0223, 4: 0x021E, 5: 0x0226 },
  1: { 0: 0x021F, 1: 0x0034, 2: 0x0220, 3: 0x022E, 4: 0x002D, 5: 0x0032 },
  2: { 0: 0x0289, 1: 0x0238, 2: 0x022F, 3: 0x002E, 4: 0x0287, 5: 0x0232 },
  3: { 0: NO, 1: TRNS, 2: TRNS, 3: TRNS, 4: TRNS, 5: 0x004C },
  4: { 0: TRNS, 1: 0x0234, 2: 0x0024, 3: 0x0025, 4: 0x0026, 5: 0x0225 },
  5: { 0: TRNS, 1: 0x0233, 2: 0x0021, 3: 0x0022, 4: 0x0023, 5: 0x0030 },
  6: { 0: TRNS, 1: 0x022D, 2: 0x001E, 3: 0x001F, 4: 0x0020, 5: 0x0230 },
  7: { 0: NO, 1: 0x0027, 2: 0x0037, 3: TRNS, 4: TRNS, 5: TRNS },
};

const via44_layer3: LayerMap = {
  0: { 0: 0x7830, 1: 0x782F, 2: 0x782E, 3: 0x782D, 4: 0x782C, 5: 0x782B },
  1: { 0: TRNS, 1: TRNS, 2: 0x7834, 3: 0x7833, 4: 0x7832, 5: 0x7831 },
  2: { 0: 0x7E01, 1: TRNS, 2: 0x7E04, 3: 0x7E02, 4: 0x7E03, 5: 0x7E05 },
  3: { 0: NO, 1: 0x7C00, 2: 0x7E00, 3: TRNS, 4: TRNS, 5: TRNS },
  4: { 0: 0x7820, 1: 0x7E0A, 2: 0x7E0B, 3: 0x7E0C, 4: TRNS, 5: TRNS },
  5: { 0: 0x7821, 1: 0x7823, 2: 0x7825, 3: 0x7827, 4: TRNS, 5: 0x7E08 },
  6: { 0: 0x7822, 1: 0x7824, 2: 0x7826, 3: 0x7828, 4: TRNS, 5: 0x7E09 },
  7: { 0: NO, 1: 0x7C00, 2: 0x7E00, 3: TRNS, 4: TRNS, 5: TRNS },
};

const via61_layer0: LayerMap = {
  0: { 0: 0x002D, 1: 0x0027, 2: 0x0026, 3: NO, 4: 0x0025, 5: 0x0024, 6: 0x0023, 7: NO },
  1: { 0: 0x0089, 1: 0x0013, 2: 0x0012, 3: NO, 4: 0x000C, 5: 0x0018, 6: 0x001C, 7: NO },
  2: { 0: 0x0224, 1: 0x0033, 2: 0x000F, 3: NO, 4: 0x000E, 5: 0x000D, 6: 0x000B, 7: NO },
  3: { 0: 0x00E5, 1: 0x0038, 2: 0x0037, 3: NO, 4: 0x0036, 5: 0x0010, 6: 0x0011, 7: 0x0032 },
  4: { 0: 0x0046, 1: 0x00E6, 2: TRNS, 3: NO, 4: 0x00E7, 5: 0x4191, 6: 0x4228, 7: 0x002A },
  5: { 0: 0x0029, 1: 0x001E, 2: 0x001F, 3: NO, 4: 0x0020, 5: 0x0021, 6: 0x0022, 7: NO },
  6: { 0: 0x004C, 1: 0x0014, 2: 0x001A, 3: NO, 4: 0x0008, 5: 0x0015, 6: 0x0017, 7: NO },
  7: { 0: 0x002B, 1: 0x0004, 2: 0x0016, 3: NO, 4: 0x0007, 5: 0x0009, 6: 0x000A, 7: NO },
  8: { 0: 0x5221, 1: 0x001D, 2: 0x001B, 3: NO, 4: 0x0006, 5: 0x0019, 6: 0x0005, 7: 0x0030 },
  9: { 0: TRNS, 1: 0x00E0, 2: 0x00E2, 3: NO, 4: 0x00E3, 5: 0x4191, 6: 0x422C, 7: 0x4390 },
};

const via61_layer1: LayerMap = {
  0: { 0: 0x0287, 1: 0x0226, 2: 0x0225, 3: NO, 4: 0x0234, 5: 0x0223, 6: 0x002E, 7: NO },
  1: { 0: 0x0289, 1: 0x0213, 2: 0x0212, 3: NO, 4: 0x020C, 5: 0x0218, 6: 0x021C, 7: NO },
  2: { 0: 0x021F, 1: 0x0034, 2: 0x020F, 3: NO, 4: 0x020E, 5: 0x020D, 6: 0x020B, 7: NO },
  3: { 0: 0x02E5, 1: 0x0238, 2: 0x0237, 3: NO, 4: 0x0236, 5: 0x0210, 6: 0x0211, 7: 0x0232 },
  4: { 0: TRNS, 1: 0x02E6, 2: TRNS, 3: NO, 4: 0x02E7, 5: TRNS, 6: TRNS, 7: TRNS },
  5: { 0: 0x0229, 1: 0x021E, 2: 0x002F, 3: NO, 4: 0x0220, 5: 0x0221, 6: 0x0222, 7: NO },
  6: { 0: 0x024C, 1: 0x0214, 2: 0x021A, 3: NO, 4: 0x0208, 5: 0x0215, 6: 0x0217, 7: NO },
  7: { 0: 0x022B, 1: 0x0204, 2: 0x0216, 3: NO, 4: 0x0207, 5: 0x0209, 6: 0x020A, 7: NO },
  8: { 0: TRNS, 1: 0x021D, 2: 0x021B, 3: NO, 4: 0x0206, 5: 0x0219, 6: 0x0205, 7: 0x0230 },
  9: { 0: TRNS, 1: 0x02E0, 2: 0x02E2, 3: NO, 4: 0x02E3, 5: TRNS, 6: TRNS, 7: TRNS },
};

const via61_layer2: LayerMap = {
  0: { 0: 0x0044, 1: 0x0043, 2: 0x0042, 3: NO, 4: 0x0041, 5: 0x0040, 6: 0x003F, 7: NO },
  1: { 0: 0x0045, 1: TRNS, 2: 0x004F, 3: NO, 4: 0x0052, 5: 0x0050, 6: TRNS, 7: NO },
  2: { 0: TRNS, 1: 0x00D3, 2: 0x00D2, 3: NO, 4: 0x0051, 5: 0x00D1, 6: 0x004B, 7: NO },
  3: { 0: TRNS, 1: TRNS, 2: TRNS, 3: NO, 4: TRNS, 5: TRNS, 6: 0x004E, 7: 0x0226 },
  4: { 0: TRNS, 1: TRNS, 2: TRNS, 3: NO, 4: TRNS, 5: TRNS, 6: TRNS, 7: 0x004C },
  5: { 0: 0x7E0F, 1: 0x003A, 2: 0x003B, 3: NO, 4: 0x003C, 5: 0x003D, 6: 0x003E, 7: NO },
  6: { 0: 0x7E0D, 1: TRNS, 2: 0x0024, 3: NO, 4: 0x0025, 5: 0x0026, 6: TRNS, 7: NO },
  7: { 0: 0x7E0E, 1: TRNS, 2: 0x0021, 3: NO, 4: 0x0022, 5: 0x0023, 6: 0x0233, 7: NO },
  8: { 0: TRNS, 1: TRNS, 2: 0x001E, 3: NO, 4: 0x001F, 5: 0x0020, 6: 0x022D, 7: 0x0225 },
  9: { 0: TRNS, 1: TRNS, 2: 0x0027, 3: NO, 4: 0x0037, 5: TRNS, 6: TRNS, 7: TRNS },
};

const via61_layer3: LayerMap = {
  0: { 0: 0x7830, 1: 0x782F, 2: 0x782E, 3: NO, 4: 0x782D, 5: 0x782C, 6: 0x782B, 7: NO },
  1: { 0: TRNS, 1: TRNS, 2: 0x7834, 3: NO, 4: 0x7833, 5: 0x7832, 6: 0x7831, 7: NO },
  2: { 0: 0x7E00, 1: 0x7E01, 2: 0x7E04, 3: NO, 4: 0x7E02, 5: 0x7E03, 6: 0x7E05, 7: NO },
  3: { 0: TRNS, 1: TRNS, 2: 0x004D, 3: NO, 4: 0x004B, 5: 0x004E, 6: 0x004A, 7: NO },
  4: { 0: 0x7C00, 1: TRNS, 2: TRNS, 3: NO, 4: TRNS, 5: TRNS, 6: 0x002A, 7: TRNS },
  5: { 0: 0x7820, 1: 0x7E0A, 2: 0x7E0B, 3: NO, 4: 0x7E0C, 5: TRNS, 6: TRNS, 7: NO },
  6: { 0: 0x7821, 1: 0x7823, 2: 0x7825, 3: NO, 4: 0x7827, 5: TRNS, 6: TRNS, 7: NO },
  7: { 0: 0x7822, 1: 0x7824, 2: 0x7826, 3: NO, 4: 0x7828, 5: TRNS, 6: TRNS, 7: NO },
  8: { 0: TRNS, 1: TRNS, 2: 0x7E09, 3: NO, 4: 0x7E08, 5: 0x7E07, 6: 0x7E06, 7: NO },
  9: { 0: 0x7C00, 1: TRNS, 2: 0x0050, 3: NO, 4: 0x0051, 5: 0x0052, 6: 0x004F, 7: TRNS },
};

// ── エクスポート ───────────────────────────────────────────
export const PRESETS: Preset[] = [
  {
    id: 'keyball39-default',
    name: 'Keyball39 デフォルト',
    description: '公式チートシート準拠の4レイヤーキーマップ（JIS配列向け）',
    model: 'keyball39',
    layers: [layer0, layer1, layer2, layer3],
  },
  {
    id: 'keyball39-via',
    name: 'Keyball39 Remap版',
    description: 'Remap対応の標準ファームウェアの初期キーマップを再現したもの',
    model: 'keyball39',
    layers: [via39_layer0, via39_layer1, via39_layer2, via39_layer3],
  },
  {
    id: 'keyball44-via',
    name: 'Keyball44 Remap版',
    description: 'Remap対応の標準ファームウェアの初期キーマップを再現したもの',
    model: 'keyball44',
    layers: [via44_layer0, via44_layer1, via44_layer2, via44_layer3],
  },
  {
    id: 'keyball61-via',
    name: 'Keyball61 Remap版',
    description: 'Remap対応の標準ファームウェアの初期キーマップを再現したもの（EEPROM全消去キーは安全のため未搭載）',
    model: 'keyball61',
    layers: [via61_layer0, via61_layer1, via61_layer2, via61_layer3],
  },
];
