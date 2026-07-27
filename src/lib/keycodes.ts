// QMK キーコード定義（よく使うキーのみ）

export interface KeycodeEntry {
  code:    number;
  label:   string;   // キーキャップ表示
  short:   string;   // 短い表示名
  group:   string;   // カテゴリ
  layout?: 'JIS' | 'US';  // 指定がある場合、その配列でのみパレットに表示
}

export const KC_NO    = 0x0000;
export const KC_TRNS  = 0x0001;  // _______（透過）

const K = (code: number, label: string, short: string, group: string): KeycodeEntry =>
  ({ code, label, short, group });
const KL = (code: number, label: string, short: string, group: string, layout: 'JIS' | 'US'): KeycodeEntry =>
  ({ code, label, short, group, layout });

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
  K(0x0090, 'かな (Mac)', 'LANG1(かな)/Mac推奨', '日本語'),
  K(0x0091, '英数 (Mac)', 'LANG2(英数)/Mac推奨', '日本語'),

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
  KL(0x0287, '_', 'S_INT1', 'Shift記号', 'JIS'),  // JIS: Shift+ろ
  KL(0x022D, '_', 'UNDS',  'Shift記号', 'US'),   // US: Shift+-
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

  // RGB / LED（QK_UNDERGLOW = 0x7820。旧番台0x5B00は現行ファームでは無効なため修正済み）
  K(0x7820, 'UG Toggle',    'UG_TOGG', 'RGB'),
  K(0x7821, 'RGB Mod+',     'UG_NEXT', 'RGB'),
  K(0x7822, 'RGB Mod-',     'UG_PREV', 'RGB'),
  K(0x7823, 'Hue+',         'UG_HUEU', 'RGB'),
  K(0x7824, 'Hue-',         'UG_HUED', 'RGB'),
  K(0x7825, 'Sat+',         'UG_SATU', 'RGB'),
  K(0x7826, 'Sat-',         'UG_SATD', 'RGB'),
  K(0x7827, 'Val+',         'UG_VALU', 'RGB'),
  K(0x7828, 'Val-',         'UG_VALD', 'RGB'),
  K(0x7829, 'Speed+',       'UG_SPDU', 'RGB'),
  K(0x782A, 'Speed-',       'UG_SPDD', 'RGB'),
  K(0x782B, 'RGB Plain',    'RGB_M_P', 'RGB'),
  K(0x782C, 'RGB Breathe',  'RGB_M_B', 'RGB'),
  K(0x782D, 'RGB Rainbow',  'RGB_M_R', 'RGB'),
  K(0x782E, 'RGB Swirl',    'RGB_M_SW','RGB'),
  K(0x782F, 'RGB Snake',    'RGB_M_SN','RGB'),
  K(0x7830, 'RGB Knight',   'RGB_M_K', 'RGB'),
  K(0x7831, 'RGB Xmas',     'RGB_M_X', 'RGB'),
  K(0x7832, 'RGB Gradient', 'RGB_M_G', 'RGB'),
  K(0x7833, 'RGB Test',     'RGB_M_T', 'RGB'),
  K(0x7834, 'RGB Twinkle',  'RGB_M_TW','RGB'),

  // Keyball 拡張（自動マウスレイヤー・スクロールスナップ）
  K(0x7E0A, 'AML ON/OFF', 'AML_TO',  'Keyball'),
  K(0x7E0B, 'AML +50ms',  'AML_I50', 'Keyball'),
  K(0x7E0C, 'AML -50ms',  'AML_D50', 'Keyball'),
  K(0x7E0D, 'Scroll 縦',  'SSNP_VRT','Keyball'),
  K(0x7E0E, 'Scroll 横',  'SSNP_HOR','Keyball'),
  K(0x7E0F, 'Scroll 自由','SSNP_FRE','Keyball'),
  K(0x7E10, 'ジェスチャー', 'GST_HOLD', 'Keyball'),  // 押しながらトラックボールを振るとジェスチャー

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

// キーが「何をするか」の説明文を返す（ホバー時のツールチップ用）
export function getKeyDescription(code: number, layout: KeyLayout): string {
  const disp = getKeyDisplayLabel(code, layout).replace('\n', ' / ');
  const J = layout === 'JIS';

  if (code === KC_NO)   return '何も割り当てられていません';
  if (code === KC_TRNS) return '透過：下のレイヤーのキーがそのまま使われます';

  // ── 個別キーの具体的な説明 ──────────────────────────────
  // 基本操作
  if (code === 0x002C) return 'スペースを入力します';
  if (code === 0x0028) return '改行・確定します（Enter）';
  if (code === 0x002A) return 'カーソルの左の文字を1つ削除します（Backspace）';
  if (code === 0x0029) return '操作をキャンセルします（Esc）';
  if (code === 0x002B) return 'タブを入力・次の入力欄に移動します（Tab）';
  if (code === 0x0039) return '大文字/小文字のロックを切り替えます（CapsLock）';
  if (code === 0x004C) return 'カーソルの右の文字を1つ削除します（Delete）';
  if (code === 0x0049) return '上書き入力モードを切り替えます（Insert）';
  if (code === 0x004A) return '行の先頭に移動します（Home）';
  if (code === 0x004D) return '行の末尾に移動します（End）';
  if (code === 0x004B) return '1画面分上にスクロールします（PageUp）';
  if (code === 0x004E) return '1画面分下にスクロールします（PageDown）';

  // 矢印
  if (code === 0x004F) return 'カーソルを右に1文字移動します';
  if (code === 0x0050) return 'カーソルを左に1文字移動します';
  if (code === 0x0051) return 'カーソルを下に1行移動します';
  if (code === 0x0052) return 'カーソルを上に1行移動します';

  // ファンクション
  if (code === 0x003A) return 'F1：ヘルプ表示など（アプリによって異なります）';
  if (code === 0x003B) return 'F2：ファイル名変更など（アプリによって異なります）';
  if (code === 0x003C) return 'F3：検索など（アプリによって異なります）';
  if (code === 0x003D) return 'F4：アドレスバーなど（アプリによって異なります）';
  if (code === 0x003E) return 'F5：ページ更新（ブラウザ）など（アプリによって異なります）';
  if (code >= 0x003F && code <= 0x0045) return `F${code - 0x003A + 1}：ファンクションキーです（アプリによって動作が異なります）`;

  // 修飾キー
  if (code === 0x00E0) return '押している間 Ctrl（コントロール）として動作します（例: Ctrl+C でコピー）';
  if (code === 0x00E1) return '押している間 Shift として動作します（大文字入力・記号入力）';
  if (code === 0x00E2) return '押している間 Alt（macOS: Option）として動作します';
  if (code === 0x00E3) return '押している間 ⌘ Command（Windows: Windowsキー）として動作します';
  if (code === 0x00E4) return '押している間 右Ctrl として動作します（左Ctrlと同じ効果）';
  if (code === 0x00E5) return '押している間 右Shift として動作します';
  if (code === 0x00E6) return '押している間 右Alt（macOS: 右Option）として動作します';
  if (code === 0x00E7) return '押している間 右⌘ Command として動作します';

  // 記号（JIS/USで出力が異なるキー）
  if (code === 0x002D) return J ? 'ハイフン(-)・長音符(ー)を入力します' : 'マイナス・ハイフン(-)を入力します';
  if (code === 0x002E) return J ? 'キャレット(^)を入力します' : 'イコール(=)を入力します';
  if (code === 0x002F) return J ? 'アットマーク(@)を入力します' : '左角括弧([)を入力します';
  if (code === 0x0030) return J ? '左角括弧([)を入力します' : '右角括弧(])を入力します';
  if (code === 0x0031) return J ? '右角括弧(])を入力します' : 'バックスラッシュ(\\)・円記号(¥)を入力します';
  if (code === 0x0033) return 'セミコロン(;)を入力します';
  if (code === 0x0034) return J ? 'コロン(:)を入力します' : "シングルクォート(')を入力します";
  if (code === 0x0035) return J ? '半角/全角を切り替えます（日本語入力のオン/オフ）' : 'バッククォート(`)を入力します';
  if (code === 0x0036) return 'カンマ(,)を入力します';
  if (code === 0x0037) return 'ピリオド(.)を入力します';
  if (code === 0x0038) return 'スラッシュ(/)を入力します';

  // Shift記号（0x0200番台はMODS範囲だが個別に明示）
  if (code === 0x021E) return '感嘆符(!)を入力します';
  if (code === 0x021F) return J ? 'ダブルクォート(")を入力します' : 'アットマーク(@)を入力します';
  if (code === 0x0220) return 'ハッシュ・シャープ(#)を入力します';
  if (code === 0x0221) return 'ドル記号($)を入力します';
  if (code === 0x0222) return 'パーセント(%)を入力します';
  if (code === 0x0223) return J ? 'アンパサンド(&)を入力します' : 'キャレット(^)を入力します';
  if (code === 0x0224) return J ? "シングルクォート(')を入力します" : 'アンパサンド(&)を入力します';
  if (code === 0x0225) return J ? '左丸括弧(()を入力します' : 'アスタリスク(*)を入力します';
  if (code === 0x0226) return J ? '右丸括弧())を入力します' : '左丸括弧(()を入力します';
  if (code === 0x0227) return J ? 'イコール(=)を入力します' : '右丸括弧())を入力します';
  if (code === 0x0287) return 'アンダースコア(_)を入力します（JIS: Shift+ろ）';
  if (code === 0x022D) return J ? 'イコール(=)を入力します（JIS: Shift+-）' : 'アンダースコア(_)を入力します';
  if (code === 0x022E) return J ? 'チルダ(~)を入力します' : 'プラス(+)を入力します';
  if (code === 0x022F) return J ? 'バッククォート(`)を入力します' : '左波括弧({)を入力します';
  if (code === 0x0230) return J ? '左波括弧({)を入力します' : '右波括弧(})を入力します';
  if (code === 0x0231) return J ? '右波括弧(})を入力します' : 'パイプ(|)を入力します';
  if (code === 0x0233) return J ? 'プラス(+)を入力します' : 'コロン(:)を入力します';
  if (code === 0x0234) return J ? 'アスタリスク(*)を入力します' : 'ダブルクォート(")を入力します';
  if (code === 0x0235) return J ? 'チルダ(~)はキャレット(^)のShiftです（JIS）' : 'チルダ(~)を入力します';
  if (code === 0x0236) return '左山括弧・小なり(<)を入力します';
  if (code === 0x0237) return '右山括弧・大なり(>)を入力します';
  if (code === 0x0238) return '疑問符(?)を入力します';

  // マウスボタン
  if (code === 0x00D1) return '左クリックします（MB1）';
  if (code === 0x00D2) return '右クリックします（MB2）';
  if (code === 0x00D3) return '中クリック（ホイールボタン）します（MB3）';
  if (code === 0x00D4) return 'ブラウザの「戻る」ボタンを押します（MB4）';
  if (code === 0x00D5) return 'ブラウザの「進む」ボタンを押します（MB5）';
  if (code === 0x00CD) return 'マウスカーソルを上に移動します';
  if (code === 0x00CE) return 'マウスカーソルを下に移動します';
  if (code === 0x00CF) return 'マウスカーソルを左に移動します';
  if (code === 0x00D0) return 'マウスカーソルを右に移動します';
  if (code === 0x00D9) return 'ホイールを上にスクロールします';
  if (code === 0x00DA) return 'ホイールを下にスクロールします';
  if (code === 0x00DB) return 'ホイールを左にスクロールします（横スクロール）';
  if (code === 0x00DC) return 'ホイールを右にスクロールします（横スクロール）';
  if (code === 0x00DD) return 'マウス移動速度を低速（精密操作）にします（ACL0）';
  if (code === 0x00DE) return 'マウス移動速度を中速にします（ACL1）';
  if (code === 0x00DF) return 'マウス移動速度を高速にします（ACL2）';

  // 日本語
  if (code === 0x0087) return 'ろキーを入力します（JIS配列専用）';
  if (code === 0x0088) return 'かな入力モードに切り替えます（JIS配列専用）';
  if (code === 0x0089) return '円記号(¥)を入力します（JIS配列専用）';
  if (code === 0x008A) return '変換キー：日本語入力を変換します（JIS配列専用）';
  if (code === 0x008B) return '無変換キー：日本語入力をキャンセルします（JIS配列専用）';
  if (code === 0x0090) return 'かな入力モードに切り替えます（macOS推奨: LANG1）';
  if (code === 0x0091) return '英数入力モードに切り替えます（macOS推奨: LANG2）';

  // メディア
  if (code === 0x00A8) return '音声をミュート/解除します（Mute）';
  if (code === 0x00A9) return '音量を上げます（Volume Up）';
  if (code === 0x00AA) return '音量を下げます（Volume Down）';
  if (code === 0x00AB) return '次のトラックへ進みます（Next Track）';
  if (code === 0x00AC) return '前のトラックへ戻ります（Previous Track）';
  if (code === 0x00AD) return '再生を停止します（Stop）';
  if (code === 0x00AE) return '再生・一時停止を切り替えます（Play/Pause）';
  if (code === 0x00AF) return 'メディア選択ダイアログを開きます（Select）';

  // システム
  if (code === 0x0046) return 'スクリーンショット（画面キャプチャ）を撮ります（Print Screen）';
  if (code === 0x0047) return 'スクロールロックを切り替えます（Scroll Lock）';
  if (code === 0x0048) return '一時停止します（Pause）';
  if (code === 0x0053) return 'テンキーのロックを切り替えます（Num Lock）';
  if (code === 0x0065) return 'コンテキストメニューを開きます（右クリックと同じ）';

  // テンキー
  if (code === 0x0054) return 'テンキーの ÷（割り算）を入力します';
  if (code === 0x0055) return 'テンキーの ×（掛け算）を入力します';
  if (code === 0x0056) return 'テンキーの −（引き算）を入力します';
  if (code === 0x0057) return 'テンキーの +（足し算）を入力します';
  if (code === 0x0058) return 'テンキーの Enter を入力します';
  if (code >= 0x0059 && code <= 0x0062) return `テンキーの ${code - 0x0059} を入力します`;
  if (code === 0x0063) return 'テンキーの .(小数点) を入力します';

  // RGB / LED
  if (code === 0x7820) return 'LEDのオン/オフを切り替えます';
  if (code === 0x7821) return 'LEDの光り方パターンを次に進めます';
  if (code === 0x7822) return 'LEDの光り方パターンを前に戻します';
  if (code === 0x7823) return 'LEDの色相（色）を変えます（Hue+）';
  if (code === 0x7824) return 'LEDの色相（色）を戻します（Hue-）';
  if (code === 0x7825) return 'LEDの彩度（色の濃さ）を上げます';
  if (code === 0x7826) return 'LEDの彩度（色の濃さ）を下げます';
  if (code === 0x7827) return 'LEDの明るさを上げます';
  if (code === 0x7828) return 'LEDの明るさを下げます';
  if (code === 0x7829) return 'LEDアニメーションの速度を上げます';
  if (code === 0x782A) return 'LEDアニメーションの速度を下げます';
  if (code === 0x782B) return 'LED: 常時点灯（Plain）モードにします';
  if (code === 0x782C) return 'LED: 呼吸するように点滅します（Breathe）';
  if (code === 0x782D) return 'LED: 虹色に流れるように光ります（Rainbow）';
  if (code === 0x782E) return 'LED: 渦巻き状に光ります（Swirl）';
  if (code === 0x782F) return 'LED: ヘビが動くように光ります（Snake）';
  if (code === 0x7830) return 'LED: 騎士のように往復して光ります（Knight）';
  if (code === 0x7831) return 'LED: クリスマス風に光ります（Xmas）';
  if (code === 0x7832) return 'LED: グラデーションで光ります（Gradient）';
  if (code === 0x7833) return 'LED: 診断用のテストパターンを表示します（Test）';
  if (code === 0x7834) return 'LED: きらめくように光ります（Twinkle）';

  // Keyball 独自
  if (code === 0x7E00) return 'Keyballの全設定をリセットします（要再起動）';
  if (code === 0x7E01) return '現在の設定をEEPROMに保存します';
  if (code === 0x7E02) return 'トラックボールの速度(CPI)を100上げます';
  if (code === 0x7E03) return 'トラックボールの速度(CPI)を100下げます';
  if (code === 0x7E04) return 'トラックボールの速度(CPI)を1000上げます';
  if (code === 0x7E05) return 'トラックボールの速度(CPI)を1000下げます';
  if (code === 0x7E06) return 'スクロールモードをON/OFFします（トラックボールがスクロール操作になります）';
  if (code === 0x7E07) return '押している間だけスクロールモードになります';
  if (code === 0x7E08) return 'スクロール速度を上げます（分周値を大きく）';
  if (code === 0x7E09) return 'スクロール速度を下げます（分周値を小さく）';
  if (code === 0x7E0A) return '自動マウスレイヤー（トラックボールを触ると自動でレイヤー切替）のON/OFFを切り替えます';
  if (code === 0x7E0B) return '自動マウスレイヤーが切れるまでの時間を50ms延ばします';
  if (code === 0x7E0C) return '自動マウスレイヤーが切れるまでの時間を50ms縮めます';
  if (code === 0x7E0D) return 'スクロール方向を縦のみに固定します';
  if (code === 0x7E0E) return 'スクロール方向を横のみに固定します';
  if (code === 0x7E0F) return 'スクロール方向の固定を解除します（自由に縦横スクロール）';
  if (code === 0x7E10) return '押しながらトラックボールを上下左右に振るとジェスチャーが発動します（設定タブで各方向の操作を変更できます）';

  // ワンショット修飾
  if (code === 0x5501) return '次の1キーだけ Ctrl として動作します（ワンショット）';
  if (code === 0x5502) return '次の1キーだけ Shift として動作します（ワンショット）';
  if (code === 0x5504) return '次の1キーだけ Alt として動作します（ワンショット）';
  if (code === 0x5508) return '次の1キーだけ ⌘ Command として動作します（ワンショット）';

  // ブートローダー
  if (code === 0x7C00) return 'ファームウェア書き込みモード（ブートローダー）に移行します。長押し推奨。';

  // タップダンス
  if (code >= 0x5700 && code <= 0x5707) return `タップダンス ${code - 0x5700}：連打回数や長押しで動作が変わります（タップダンスタブで設定）`;

  // マクロ
  if (code >= 0x7700 && code <= 0x770F) return `マクロ ${code - 0x7700} を実行します（マクロタブで内容を設定・確認できます）`;

  // ── 組み合わせキーコードの範囲 ──────────────────────────
  // MODS（修飾＋キー同時送信）
  if (code >= 0x0100 && code <= 0x1FFF) {
    const mod = (code >> 8) & 0x1F;
    const kc  = code & 0xFF;
    const kcCh = (J && JIS_CHAR_MAP[kc] !== undefined) ? JIS_CHAR_MAP[kc] : (codeMap.get(kc)?.label ?? '');
    return `${modBitsToJa(mod)} を押しながら ${kcCh} を入力します`;
  }
  // Mod-Tap
  if (code >= 0x2000 && code <= 0x3FFF) {
    const mod = (code >> 8) & 0x1F;
    const kc  = code & 0xFF;
    const kcCh = (J && JIS_CHAR_MAP[kc] !== undefined) ? JIS_CHAR_MAP[kc] : (codeMap.get(kc)?.label ?? '');
    return `タップ：${kcCh} を入力 ／ 長押し：${modBitsToJa(mod)} として動作します`;
  }
  // Layer-Tap
  if (code >= 0x4000 && code <= 0x4FFF) {
    const layer = (code >> 8) & 0xF;
    const kc    = code & 0xFF;
    const kcCh = (J && JIS_CHAR_MAP[kc] !== undefined) ? JIS_CHAR_MAP[kc] : (codeMap.get(kc)?.label ?? '');
    return `タップ：${kcCh} を入力 ／ 長押し：レイヤー${layer} に切り替えます`;
  }
  // レイヤー操作（MO/TO/TG/DF/OSL/TT）
  if (code >= 0x5220 && code <= 0x523F) return `押している間だけレイヤー${code & 0x1F}に切り替えます（MO）`;
  if (code >= 0x5200 && code <= 0x521F) return `レイヤー${code & 0x1F}のみ有効にします（他のレイヤーを解除・TO）`;
  if (code >= 0x5260 && code <= 0x527F) return `レイヤー${code & 0x1F}のオン/オフを切り替えます（TG）`;
  if (code >= 0x5240 && code <= 0x525F) return `標準（ベース）レイヤーをレイヤー${code & 0x1F}に変更します（DF）`;
  if (code >= 0x5280 && code <= 0x529F) return `次の1キーだけレイヤー${code & 0x1F}を使います（OSL）`;
  if (code >= 0x52A0 && code <= 0x52BF) return `次の1キーだけ効く修飾キーです（ワンショット）`;
  if (code >= 0x52C0 && code <= 0x52DF) return `タップでレイヤー切替、${code & 0x1F}回連打で固定します（TT）`;

  return disp;
}

// 接続中ファームで各機能が使えるか（未接続なら不明＝true扱いでグレーアウトしない）
export interface FirmwareAvail {
  media:   boolean;  // メディアキー（EXTRAKEY）。v1.1.0〜通常版・LED版共通で利用可
  gesture: boolean;  // ジェスチャーキー（GST_HOLD）。非LED版のみ
  rgb:     boolean;  // RGB系キー。LED版のみ
  macro:   boolean;  // マクロキー。v1.1.0〜非LED版のみ（LED版はメディアキーと引き換えに廃止）
}

export const FW_ALL_AVAILABLE: FirmwareAvail = { media: true, gesture: true, rgb: true, macro: true };

// このキーコードが接続中ファームで機能しない（グレーアウトすべき）なら true
export function isKeycodeUnavailable(
  entry: { group: string; short: string },
  avail: FirmwareAvail,
): boolean {
  if (entry.group === 'メディア' && !avail.media)   return true;
  if (entry.group === 'RGB'      && !avail.rgb)     return true;
  if (entry.group === 'マクロ'   && !avail.macro)   return true;
  if (entry.short === 'GST_HOLD' && !avail.gesture) return true;
  return false;
}
