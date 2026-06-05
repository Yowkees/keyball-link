// QMK キーコード定義（よく使うキーのみ）

export interface KeycodeEntry {
  code:    number;
  label:   string;   // キーキャップ表示
  short:   string;   // 短い表示名
  group:   string;   // カテゴリ
}

export const KC_NO    = 0x0000;
export const KC_TRNS  = 0x0001;  // _______（透過）

const K = (code: number, label: string, short: string, group: string): KeycodeEntry =>
  ({ code, label, short, group });

export const KEYCODES: KeycodeEntry[] = [
  // 特殊
  K(0x0000, 'NONE',  'KC_NO',   '特殊'),
  K(0x0001, '▽',     'TRNS',    '特殊'),

  // 文字
  K(0x0004, 'A', 'A', '文字'), K(0x0005, 'B', 'B', '文字'), K(0x0006, 'C', 'C', '文字'),
  K(0x0007, 'D', 'D', '文字'), K(0x0008, 'E', 'E', '文字'), K(0x0009, 'F', 'F', '文字'),
  K(0x000A, 'G', 'G', '文字'), K(0x000B, 'H', 'H', '文字'), K(0x000C, 'I', 'I', '文字'),
  K(0x000D, 'J', 'J', '文字'), K(0x000E, 'K', 'K', '文字'), K(0x000F, 'L', 'L', '文字'),
  K(0x0010, 'M', 'M', '文字'), K(0x0011, 'N', 'N', '文字'), K(0x0012, 'O', 'O', '文字'),
  K(0x0013, 'P', 'P', '文字'), K(0x0014, 'Q', 'Q', '文字'), K(0x0015, 'R', 'R', '文字'),
  K(0x0016, 'S', 'S', '文字'), K(0x0017, 'T', 'T', '文字'), K(0x0018, 'U', 'U', '文字'),
  K(0x0019, 'V', 'V', '文字'), K(0x001A, 'W', 'W', '文字'), K(0x001B, 'X', 'X', '文字'),
  K(0x001C, 'Y', 'Y', '文字'), K(0x001D, 'Z', 'Z', '文字'),

  // 数字
  K(0x001E, '1', '1', '数字'), K(0x001F, '2', '2', '数字'), K(0x0020, '3', '3', '数字'),
  K(0x0021, '4', '4', '数字'), K(0x0022, '5', '5', '数字'), K(0x0023, '6', '6', '数字'),
  K(0x0024, '7', '7', '数字'), K(0x0025, '8', '8', '数字'), K(0x0026, '9', '9', '数字'),
  K(0x0027, '0', '0', '数字'),

  // 記号・句読点
  K(0x002C, 'Space',  'SPC',   '基本'),
  K(0x0028, 'Enter',  'ENT',   '基本'),
  K(0x002A, 'BS',     'BSPC',  '基本'),
  K(0x0029, 'Esc',    'ESC',   '基本'),
  K(0x002B, 'Tab',    'TAB',   '基本'),
  K(0x0039, 'CapsLk', 'CAPS',  '基本'),
  K(0x004C, 'Del',    'DEL',   '基本'),
  K(0x0049, 'Ins',    'INS',   '基本'),
  K(0x004A, 'Home',   'HOME',  '基本'),
  K(0x004D, 'End',    'END',   '基本'),
  K(0x004B, 'PgUp',   'PGUP',  '基本'),
  K(0x004E, 'PgDn',   'PGDN',  '基本'),

  // 矢印
  K(0x004F, '→', 'RIGHT', '矢印'),
  K(0x0050, '←', 'LEFT',  '矢印'),
  K(0x0051, '↓', 'DOWN',  '矢印'),
  K(0x0052, '↑', 'UP',    '矢印'),

  // ファンクション
  K(0x003A, 'F1',  'F1',  'F'),  K(0x003B, 'F2',  'F2',  'F'),
  K(0x003C, 'F3',  'F3',  'F'),  K(0x003D, 'F4',  'F4',  'F'),
  K(0x003E, 'F5',  'F5',  'F'),  K(0x003F, 'F6',  'F6',  'F'),
  K(0x0040, 'F7',  'F7',  'F'),  K(0x0041, 'F8',  'F8',  'F'),
  K(0x0042, 'F9',  'F9',  'F'),  K(0x0043, 'F10', 'F10', 'F'),
  K(0x0044, 'F11', 'F11', 'F'),  K(0x0045, 'F12', 'F12', 'F'),

  // 修飾キー
  K(0x00E0, 'LCtrl',  'LCTL', '修飾'),
  K(0x00E1, 'LShift', 'LSFT', '修飾'),
  K(0x00E2, 'LAlt',   'LALT', '修飾'),
  K(0x00E3, 'LWin(⌘)', 'LGUI', '修飾'),
  K(0x00E4, 'RCtrl',  'RCTL', '修飾'),
  K(0x00E5, 'RShift', 'RSFT', '修飾'),
  K(0x00E6, 'RAlt',   'RALT', '修飾'),
  K(0x00E7, 'RWin(⌘)', 'RGUI', '修飾'),

  // 記号
  K(0x002D, '-',  'MINS', '記号'), K(0x002E, '=',  'EQL',  '記号'),
  K(0x002F, '[',  'LBRC', '記号'), K(0x0030, ']',  'RBRC', '記号'),
  K(0x0031, '\\', 'BSLS', '記号'), K(0x0033, ';',  'SCLN', '記号'),
  K(0x0034, "'",  'QUOT', '記号'), K(0x0035, '`',  'GRV',  '記号'),
  K(0x0036, ',',  'COMM', '記号'), K(0x0037, '.',  'DOT',  '記号'),
  K(0x0038, '/',  'SLSH', '記号'),

  // マウスボタン（QMK 0.30: MS_BTN1〜5）
  K(0x00D1, 'MB1', 'MB1', 'マウス'), K(0x00D2, 'MB2', 'MB2', 'マウス'),
  K(0x00D3, 'MB3', 'MB3', 'マウス'), K(0x00D4, 'MB4', 'MB4', 'マウス'),
  K(0x00D5, 'MB5', 'MB5', 'マウス'),

  // 日本語キー
  K(0x0087, 'ろ',          'KC_RO',       '日本語'),
  K(0x0088, 'かな(JIS)',   'KANA(JIS)',   '日本語'),
  K(0x0089, '¥',           'JYEN',        '日本語'),
  K(0x008A, '変換',        'HENK',        '日本語'),
  K(0x008B, '無変換',      'MHEN',        '日本語'),
  K(0x0090, 'かな(Mac推奨)','LANG1(かな)', '日本語'),
  K(0x0091, '英数(Mac推奨)','LANG2(英数)', '日本語'),

  // レイヤー切替
  K(0x5221, 'MO(1)', 'MO1', 'レイヤー'),
  K(0x5222, 'MO(2)', 'MO2', 'レイヤー'),
  K(0x5223, 'MO(3)', 'MO3', 'レイヤー'),
  K(0x5200, 'TO(0)', 'TO0', 'レイヤー'),
  K(0x5201, 'TO(1)', 'TO1', 'レイヤー'),
  K(0x5202, 'TO(2)', 'TO2', 'レイヤー'),
  K(0x5203, 'TO(3)', 'TO3', 'レイヤー'),
  K(0x5261, 'TG(1)', 'TG1', 'レイヤー'),
  K(0x5262, 'TG(2)', 'TG2', 'レイヤー'),
  K(0x5263, 'TG(3)', 'TG3', 'レイヤー'),

  // Keyball 独自キー
  K(0x7E00, 'KB RST',  'KBC_RST',  'Keyball'),
  K(0x7E01, 'KB SAVE', 'KBC_SAVE', 'Keyball'),
  K(0x7E02, 'CPI+100', 'CPI+100',  'Keyball'),
  K(0x7E03, 'CPI-100', 'CPI-100',  'Keyball'),
  K(0x7E04, 'CPI+1K',  'CPI+1K',   'Keyball'),
  K(0x7E05, 'CPI-1K',  'CPI-1K',   'Keyball'),
  K(0x7E06, 'SCL_TO',  'SCRL_TO',  'Keyball'),
  K(0x7E07, 'SCL_MO',  'SCRL_MO',  'Keyball'),
  K(0x7E08, 'SCL_DVI', 'SCL_DVI',  'Keyball'),
  K(0x7E09, 'SCL_DVD', 'SCL_DVD',  'Keyball'),

  // QK_BOOT
  K(0x7C00, 'BOOT', 'BOOT', '特殊'),

  // Shift+記号（QK_LSFT = 0x0200, 例: S(KC_2) = 0x021F = @）
  K(0x021E, '!',  'EXLM', 'Shift記号'),
  K(0x021F, '@',  'AT',   'Shift記号'),
  K(0x0220, '#',  'HASH', 'Shift記号'),
  K(0x0221, '$',  'DLR',  'Shift記号'),
  K(0x0222, '%',  'PERC', 'Shift記号'),
  K(0x0223, '^',  'CIRC', 'Shift記号'),
  K(0x0224, '&',  'AMPR', 'Shift記号'),
  K(0x0225, '*',  'ASTR', 'Shift記号'),
  K(0x0226, '(',  'LPRN', 'Shift記号'),
  K(0x0227, ')',  'RPRN', 'Shift記号'),
  K(0x022D, '_',  'UNDS', 'Shift記号'),
  K(0x022E, '+',  'PLUS', 'Shift記号'),
  K(0x022F, '{',  'LCBR', 'Shift記号'),
  K(0x0230, '}',  'RCBR', 'Shift記号'),
  K(0x0231, '|',  'PIPE', 'Shift記号'),
  K(0x0233, ':',  'COLN', 'Shift記号'),
  K(0x0234, '"',  'DQUO', 'Shift記号'),
  K(0x0235, '~',  'TILD', 'Shift記号'),
  K(0x0236, '<',  'LABK', 'Shift記号'),
  K(0x0237, '>',  'RABK', 'Shift記号'),
  K(0x0238, '?',  'QUES', 'Shift記号'),

  // タップダンス (TD(0)〜TD(7): QK_TAP_DANCE = 0x5700)
  K(0x5700, 'TD(0)', 'TD0', 'タップダンス'),
  K(0x5701, 'TD(1)', 'TD1', 'タップダンス'),
  K(0x5702, 'TD(2)', 'TD2', 'タップダンス'),
  K(0x5703, 'TD(3)', 'TD3', 'タップダンス'),
  K(0x5704, 'TD(4)', 'TD4', 'タップダンス'),
  K(0x5705, 'TD(5)', 'TD5', 'タップダンス'),
  K(0x5706, 'TD(6)', 'TD6', 'タップダンス'),
  K(0x5707, 'TD(7)', 'TD7', 'タップダンス'),

  // システムキー
  K(0x0046, 'PrtSc',  'PSCR',  'システム'),
  K(0x0047, 'ScrLk',  'SCRL',  'システム'),
  K(0x0048, 'Pause',  'PAUS',  'システム'),
  K(0x0053, 'NumLk',  'NUM',   'システム'),
  K(0x0065, 'App',    'APP',   'システム'),

  // テンキー
  K(0x0054, 'KP /',   'KP_SL', 'テンキー'),
  K(0x0055, 'KP *',   'KP_AS', 'テンキー'),
  K(0x0056, 'KP -',   'KP_MN', 'テンキー'),
  K(0x0057, 'KP +',   'KP_PL', 'テンキー'),
  K(0x0058, 'KP Ent', 'KP_EN', 'テンキー'),
  K(0x0059, 'KP 1',   'KP1',   'テンキー'),
  K(0x005A, 'KP 2',   'KP2',   'テンキー'),
  K(0x005B, 'KP 3',   'KP3',   'テンキー'),
  K(0x005C, 'KP 4',   'KP4',   'テンキー'),
  K(0x005D, 'KP 5',   'KP5',   'テンキー'),
  K(0x005E, 'KP 6',   'KP6',   'テンキー'),
  K(0x005F, 'KP 7',   'KP7',   'テンキー'),
  K(0x0060, 'KP 8',   'KP8',   'テンキー'),
  K(0x0061, 'KP 9',   'KP9',   'テンキー'),
  K(0x0062, 'KP 0',   'KP0',   'テンキー'),
  K(0x0063, 'KP .',   'KP_DT', 'テンキー'),

  // メディア
  K(0x00A8, 'Mute',   'MUTE',  'メディア'),
  K(0x00A9, 'Vol+',   'VOLU',  'メディア'),
  K(0x00AA, 'Vol-',   'VOLD',  'メディア'),
  K(0x00AB, 'Next',   'MNXT',  'メディア'),
  K(0x00AC, 'Prev',   'MPRV',  'メディア'),
  K(0x00AD, 'Stop',   'MSTP',  'メディア'),
  K(0x00AE, 'Play',   'MPLY',  'メディア'),
  K(0x00AF, 'Select', 'MSEL',  'メディア'),

  // マウス移動・ホイール（既存 MB1〜MB5 に追加）
  K(0x00CD, 'M↑',    'MS_U',  'マウス'),
  K(0x00CE, 'M↓',    'MS_D',  'マウス'),
  K(0x00CF, 'M←',    'MS_L',  'マウス'),
  K(0x00D0, 'M→',    'MS_R',  'マウス'),
  K(0x00D9, 'WH↑',   'WH_U',  'マウス'),
  K(0x00DA, 'WH↓',   'WH_D',  'マウス'),
  K(0x00DB, 'WH←',   'WH_L',  'マウス'),
  K(0x00DC, 'WH→',   'WH_R',  'マウス'),
  K(0x00DD, 'ACL0',  'ACL0',  'マウス'),
  K(0x00DE, 'ACL1',  'ACL1',  'マウス'),
  K(0x00DF, 'ACL2',  'ACL2',  'マウス'),

  // RGB / LED（QK_UNDERGLOW = 0x5B00）
  K(0x5B00, 'UG Toggle',    'UG_TOG',  'RGB'),
  K(0x5B01, 'RGB Mod+',     'RGB_MOD', 'RGB'),
  K(0x5B02, 'RGB Mod-',     'RGB_RMD', 'RGB'),
  K(0x5B03, 'Hue+',         'RGB_HUI', 'RGB'),
  K(0x5B04, 'Hue-',         'RGB_HUD', 'RGB'),
  K(0x5B05, 'Sat+',         'RGB_SAI', 'RGB'),
  K(0x5B06, 'Sat-',         'RGB_SAD', 'RGB'),
  K(0x5B07, 'Val+',         'RGB_VAI', 'RGB'),
  K(0x5B08, 'Val-',         'RGB_VAD', 'RGB'),
  K(0x5B09, 'Speed+',       'RGB_SPI', 'RGB'),
  K(0x5B0A, 'Speed-',       'RGB_SPD', 'RGB'),
  K(0x5B0B, 'RGB Plain',    'RGB_M_P', 'RGB'),
  K(0x5B0C, 'RGB Breathe',  'RGB_M_B', 'RGB'),
  K(0x5B0D, 'RGB Rainbow',  'RGB_M_R', 'RGB'),
  K(0x5B0E, 'RGB Swirl',    'RGB_M_SW','RGB'),
  K(0x5B0F, 'RGB Snake',    'RGB_M_SN','RGB'),
  K(0x5B10, 'RGB Knight',   'RGB_M_K', 'RGB'),
  K(0x5B11, 'RGB Xmas',     'RGB_M_X', 'RGB'),
  K(0x5B12, 'RGB Gradient', 'RGB_M_G', 'RGB'),
  K(0x5B13, 'RGB Twinkle',  'RGB_M_T', 'RGB'),

  // Keyball 拡張（Kb10〜Kb12）
  K(0x7E0A, 'Kb 10', 'KB10', 'Keyball'),
  K(0x7E0B, 'Kb 11', 'KB11', 'Keyball'),
  K(0x7E0C, 'Kb 12', 'KB12', 'Keyball'),

  // レイヤー拡張（DF / OSL / TT）
  K(0x5240, 'DF(0)', 'DF0', 'レイヤー'),
  K(0x5241, 'DF(1)', 'DF1', 'レイヤー'),
  K(0x5242, 'DF(2)', 'DF2', 'レイヤー'),
  K(0x5243, 'DF(3)', 'DF3', 'レイヤー'),
  K(0x5281, 'OSL(1)', 'OSL1', 'レイヤー'),
  K(0x5282, 'OSL(2)', 'OSL2', 'レイヤー'),
  K(0x5283, 'OSL(3)', 'OSL3', 'レイヤー'),
  K(0x52C1, 'TT(1)', 'TT1', 'レイヤー'),
  K(0x52C2, 'TT(2)', 'TT2', 'レイヤー'),
  K(0x52C3, 'TT(3)', 'TT3', 'レイヤー'),

  // ワンショット修飾（OSM: QK_ONE_SHOT_MOD = 0x5500）
  K(0x5501, 'OSM(Ctrl)',  'OSM_C', 'ワンショット'),
  K(0x5502, 'OSM(Shift)', 'OSM_S', 'ワンショット'),
  K(0x5504, 'OSM(Alt)',   'OSM_A', 'ワンショット'),
  K(0x5508, 'OSM(GUI)',   'OSM_G', 'ワンショット'),

  // マクロ（QK_MACRO = 0x7700）
  K(0x7700, 'Macro 0', 'M0', 'マクロ'),
  K(0x7701, 'Macro 1', 'M1', 'マクロ'),
  K(0x7702, 'Macro 2', 'M2', 'マクロ'),
  K(0x7703, 'Macro 3', 'M3', 'マクロ'),
  K(0x7704, 'Macro 4', 'M4', 'マクロ'),
  K(0x7705, 'Macro 5', 'M5', 'マクロ'),
  K(0x7706, 'Macro 6', 'M6', 'マクロ'),
  K(0x7707, 'Macro 7', 'M7', 'マクロ'),
  K(0x7708, 'Macro 8', 'M8', 'マクロ'),
  K(0x7709, 'Macro 9', 'M9', 'マクロ'),
];

const codeMap = new Map<number, KeycodeEntry>(KEYCODES.map(e => [e.code, e]));

// JIS配列で US配列と異なる文字を出力するキーコードのマッピング
const JIS_CHAR_MAP: Record<number, string> = {
  // 基本記号キー（unshifted）
  0x002E: '^',    // KC_EQL  → US:= / JIS:^
  0x002F: '@',    // KC_LBRC → US:[ / JIS:@
  0x0030: '[',    // KC_RBRC → US:] / JIS:[
  0x0031: ']',    // KC_BSLS → US:\\ / JIS:]
  0x0034: ':',    // KC_QUOT → US:' / JIS::
  0x0035: '半角', // KC_GRV  → US:` / JIS:半角/全角
  // Shiftキー組み合わせ
  0x021F: '"',    // S+2 → US:@ / JIS:"
  0x0223: '&',    // S+6 → US:^ / JIS:&
  0x0224: "'",    // S+7 → US:& / JIS:'
  0x0225: '(',    // S+8 → US:* / JIS:(
  0x0226: ')',    // S+9 → US:( / JIS:)
  0x022D: '=',    // S+MINS → US:_ / JIS:=
  0x022E: '~',    // S+EQL  → US:+ / JIS:~
  0x022F: '`',    // S+LBRC → US:{ / JIS:`
  0x0230: '{',    // S+RBRC → US:} / JIS:{
  0x0231: '}',    // S+BSLS → US:| / JIS:}
  0x0233: '+',    // S+SCLN → US:: / JIS:+
  0x0234: '*',    // S+QUOT → US:" / JIS:*
};

const MOD_NAMES: Record<number, string> = {
  0x01: 'Ctrl', 0x02: 'Sft', 0x04: 'Alt', 0x08: 'GUI',
  0x11: 'RCtrl', 0x12: 'RSft', 0x14: 'RAlt', 0x18: 'RGUI',
};

function baseLabel(kc: number): string {
  return codeMap.get(kc)?.short ?? `0x${kc.toString(16)}`;
}

export function findKeycode(code: number): KeycodeEntry {
  if (codeMap.has(code)) return codeMap.get(code)!;

  // MODS (mod+key): 0x0100–0x1FFF  例: LCTL(KC_A) = 0x0104
  if (code >= 0x0100 && code <= 0x1FFF) {
    const mod = (code >> 8) & 0x1F;
    const kc  = code & 0xFF;
    const right = (mod & 0x10) !== 0;
    const m = mod & 0x0F;
    const parts: string[] = [];
    if (m & 0x01) parts.push(right ? 'RCtrl' : 'Ctrl');
    if (m & 0x02) parts.push(right ? 'RSft'  : 'Sft');
    if (m & 0x04) parts.push(right ? 'RAlt'  : 'Alt');
    if (m & 0x08) parts.push(right ? 'RGUI'  : 'GUI');
    const modStr = parts.join('+');
    const kcName = baseLabel(kc);
    const label  = `${modStr}(${kcName})`;
    return { code, label, short: label, group: 'Mod+Key' };
  }

  // MT (Mod-Tap): 0x2000–0x3FFF  例: MT(LSFT, 英数) = 0x2291
  if (code >= 0x2000 && code <= 0x3FFF) {
    const mod = (code >> 8) & 0x1F;
    const kc  = code & 0xFF;
    const modName = MOD_NAMES[mod] ?? `M${mod}`;
    const kcName  = baseLabel(kc);
    const label = `${kcName}\n${modName}`;
    return { code, label, short: `${kcName}/${modName}`, group: 'Mod-Tap' };
  }

  // LT (Layer-Tap): 0x4000–0x4FFF  例: LT(1, SPC) = 0x412C
  if (code >= 0x4000 && code <= 0x4FFF) {
    const layer = (code >> 8) & 0xF;
    const kc    = code & 0xFF;
    const kcName = baseLabel(kc);
    const label = `${kcName}\nL${layer}`;
    return { code, label, short: `${kcName}/L${layer}`, group: 'Layer-Tap' };
  }

  return { code, label: `0x${code.toString(16).toUpperCase()}`, short: `0x${code.toString(16)}`, group: '不明' };
}

export const KEYCODE_GROUPS = [...new Set(KEYCODES.map(e => e.group))];

export type KeyLayout = 'JIS' | 'US';

// Shift押下時の文字を返す（数字・記号キーのみ。なければ null）
export function getShiftLabel(code: number, layout: KeyLayout): string | null {
  const isNumber = code >= 0x001E && code <= 0x0027;
  const isSymbol = code >= 0x002D && code <= 0x0038;
  if (!isNumber && !isSymbol) return null;

  const shiftCode = code + 0x0200;
  if (layout === 'JIS' && JIS_CHAR_MAP[shiftCode] !== undefined) {
    return JIS_CHAR_MAP[shiftCode];
  }
  return codeMap.get(shiftCode)?.label ?? null;
}

// キーコードを配列設定に応じた表示文字に変換する
export function getKeyDisplayLabel(code: number, layout: KeyLayout): string {
  // JIS配列オーバーライド（直接マップに存在するキー）
  if (layout === 'JIS' && JIS_CHAR_MAP[code] !== undefined) {
    return JIS_CHAR_MAP[code];
  }

  // LT (Layer-Tap): 0x4000–0x4FFF
  if (code >= 0x4000 && code <= 0x4FFF) {
    const layer = (code >> 8) & 0xF;
    const kc    = code & 0xFF;
    const tapCh = (layout === 'JIS' && JIS_CHAR_MAP[kc] !== undefined)
      ? JIS_CHAR_MAP[kc]
      : (codeMap.get(kc)?.label ?? `0x${kc.toString(16)}`);
    return `${tapCh}\nL${layer}`;
  }

  // MT (Mod-Tap): 0x2000–0x3FFF
  if (code >= 0x2000 && code <= 0x3FFF) {
    const mod    = (code >> 8) & 0x1F;
    const kc     = code & 0xFF;
    const tapCh  = (layout === 'JIS' && JIS_CHAR_MAP[kc] !== undefined)
      ? JIS_CHAR_MAP[kc]
      : (codeMap.get(kc)?.label ?? `0x${kc.toString(16)}`);
    const modName = MOD_NAMES[mod] ?? `M${mod}`;
    return `${tapCh}\n${modName}`;
  }

  return findKeycode(code).label;
}

// JIS配列記号: macOS日本語キーボード設定で出力される文字 → 対応する基本キーコード
// いずれも 0xFF 以下の有効な基本キーコードなので MT/LT のタップキーに使用可能
export const JIS_TAP_KEYS: KeycodeEntry[] = [
  { code: 0x002E, label: '^ (JIS)', short: '^ (JIS)', group: 'JIS記号' },
  { code: 0x002F, label: '@ (JIS)', short: '@ (JIS)', group: 'JIS記号' },
  { code: 0x0030, label: '[ (JIS)', short: '[ (JIS)', group: 'JIS記号' },
  { code: 0x0031, label: '] (JIS)', short: '] (JIS)', group: 'JIS記号' },
  { code: 0x0034, label: ': (JIS)', short: ': (JIS)', group: 'JIS記号' },
];

// 修飾キーの日本語名（MODS/Mod-Tap説明用）
function modBitsToJa(mod: number): string {
  const right = (mod & 0x10) !== 0;
  const pre = right ? '右' : '';
  const parts: string[] = [];
  if (mod & 0x01) parts.push(pre + 'Ctrl');
  if (mod & 0x02) parts.push(pre + 'Shift');
  if (mod & 0x04) parts.push(pre + 'Alt');
  if (mod & 0x08) parts.push(pre + 'GUI(⌘)');
  return parts.join('+');
}

// グループごとの大まかな説明
const GROUP_DESC: Record<string, string> = {
  '文字': '文字を入力します',
  '数字': '数字を入力します',
  '記号': '記号を入力します',
  'Shift記号': 'Shift＋キーの記号を入力します',
  '基本': '基本的な操作キーです',
  '修飾': '押している間だけ効く修飾キーです',
  '矢印': 'カーソルを移動します',
  'F': 'ファンクションキーです',
  'システム': 'システム操作キーです',
  'テンキー': 'テンキーの入力です',
  'メディア': '音量・再生などのメディア操作です',
  '日本語': '日本語入力の切り替えなどに使います',
};

// キーが「何をするか」の説明文を返す（ホバー時のツールチップ用）
export function getKeyDescription(code: number, layout: KeyLayout): string {
  const disp = getKeyDisplayLabel(code, layout).replace('\n', ' / ');

  if (code === KC_NO)   return '何も割り当てられていません';
  if (code === KC_TRNS) return '透過：下のレイヤーのキーがそのまま使われます';

  // MODS（修飾＋キー同時送信）
  if (code >= 0x0100 && code <= 0x1FFF) {
    const mod = (code >> 8) & 0x1F;
    const kc  = code & 0xFF;
    const kcCh = (layout === 'JIS' && JIS_CHAR_MAP[kc] !== undefined) ? JIS_CHAR_MAP[kc] : (codeMap.get(kc)?.label ?? '');
    return `${modBitsToJa(mod)} を押しながら ${kcCh} を入力します`;
  }
  // Mod-Tap
  if (code >= 0x2000 && code <= 0x3FFF) {
    const mod = (code >> 8) & 0x1F;
    const kc  = code & 0xFF;
    const kcCh = (layout === 'JIS' && JIS_CHAR_MAP[kc] !== undefined) ? JIS_CHAR_MAP[kc] : (codeMap.get(kc)?.label ?? '');
    return `タップ：${kcCh} を入力 ／ 長押し：${modBitsToJa(mod)} として動作します`;
  }
  // Layer-Tap
  if (code >= 0x4000 && code <= 0x4FFF) {
    const layer = (code >> 8) & 0xF;
    const kc    = code & 0xFF;
    const kcCh = (layout === 'JIS' && JIS_CHAR_MAP[kc] !== undefined) ? JIS_CHAR_MAP[kc] : (codeMap.get(kc)?.label ?? '');
    return `タップ：${kcCh} を入力 ／ 長押し：レイヤー${layer} に切り替えます`;
  }
  // レイヤー操作（MO/TO/TG/DF/OSL/TT）
  if (code >= 0x5220 && code <= 0x523F) return `押している間だけレイヤー${code & 0x1F}に切り替えます（MO）`;
  if (code >= 0x5200 && code <= 0x521F) return `レイヤー${code & 0x1F}に切り替えます（他のレイヤーは自動で解除・TO）`;
  if (code >= 0x5260 && code <= 0x527F) return `レイヤー${code & 0x1F}のオン/オフを切り替えます（TG）`;
  if (code >= 0x5240 && code <= 0x525F) return `標準レイヤーをレイヤー${code & 0x1F}に変更します（DF）`;
  if (code >= 0x5280 && code <= 0x529F) return `次の1キーだけレイヤー${code & 0x1F}を使います（OSL）`;
  if (code >= 0x52A0 && code <= 0x52BF) return `次の1キーだけ効く修飾キーです（ワンショット）`;
  if (code >= 0x52C0 && code <= 0x52DF) return `タップでレイヤー切替、連打で固定します（TT）`;
  // マクロ
  if (code >= 0x7700 && code <= 0x770F) return `マクロ ${code - 0x7700} を実行します（マクロタブで内容を設定）`;
  // タップダンス
  if (code >= 0x5700 && code <= 0x5707) return `タップダンス ${code - 0x5700}：連打回数で動作が変わります`;

  // グループ説明
  const entry = findKeycode(code);
  if (GROUP_DESC[entry.group]) {
    return `${disp}：${GROUP_DESC[entry.group]}`;
  }
  if (entry.group === 'マウス')   return `${disp}：マウス操作（クリック・移動・ホイール）`;
  if (entry.group === 'Keyball')  return `${disp}：Keyball独自機能（CPI・スクロール等の調整）`;
  if (entry.group === 'RGB')      return `${disp}：LED（RGB）の操作`;
  if (entry.group === '特殊')     return `${disp}：特殊キー`;

  return disp;
}
