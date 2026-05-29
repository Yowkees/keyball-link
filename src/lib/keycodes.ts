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
  K(0x00E3, 'LGui',   'LGUI', '修飾'),
  K(0x00E4, 'RCtrl',  'RCTL', '修飾'),
  K(0x00E5, 'RShift', 'RSFT', '修飾'),
  K(0x00E6, 'RAlt',   'RALT', '修飾'),
  K(0x00E7, 'RGui',   'RGUI', '修飾'),

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
  K(0x5101, 'MO(1)', 'MO1', 'レイヤー'),
  K(0x5102, 'MO(2)', 'MO2', 'レイヤー'),
  K(0x5103, 'MO(3)', 'MO3', 'レイヤー'),
  K(0x5001, 'TO(1)', 'TO1', 'レイヤー'),
  K(0x5002, 'TO(2)', 'TO2', 'レイヤー'),
  K(0x5003, 'TO(3)', 'TO3', 'レイヤー'),
  K(0x5201, 'TG(1)', 'TG1', 'レイヤー'),
  K(0x5202, 'TG(2)', 'TG2', 'レイヤー'),
  K(0x5203, 'TG(3)', 'TG3', 'レイヤー'),

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
];

const codeMap = new Map<number, KeycodeEntry>(KEYCODES.map(e => [e.code, e]));

const MOD_NAMES: Record<number, string> = {
  0x01: 'Ctrl', 0x02: 'Sft', 0x04: 'Alt', 0x08: 'GUI',
  0x11: 'RCtrl', 0x12: 'RSft', 0x14: 'RAlt', 0x18: 'RGUI',
};

function baseLabel(kc: number): string {
  return codeMap.get(kc)?.short ?? `0x${kc.toString(16)}`;
}

export function findKeycode(code: number): KeycodeEntry {
  if (codeMap.has(code)) return codeMap.get(code)!;

  // MT (Mod-Tap): 0x2000–0x2FFF  例: MT(LSFT, 英数) = 0x2291
  if (code >= 0x2000 && code <= 0x2FFF) {
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

// JIS配列記号: macOS日本語キーボード設定で出力される文字 → 対応する基本キーコード
// いずれも 0xFF 以下の有効な基本キーコードなので MT/LT のタップキーに使用可能
export const JIS_TAP_KEYS: KeycodeEntry[] = [
  { code: 0x002E, label: '^ (JIS)', short: '^ (JIS)', group: 'JIS記号' },
  { code: 0x002F, label: '@ (JIS)', short: '@ (JIS)', group: 'JIS記号' },
  { code: 0x0030, label: '[ (JIS)', short: '[ (JIS)', group: 'JIS記号' },
  { code: 0x0031, label: '] (JIS)', short: '] (JIS)', group: 'JIS記号' },
  { code: 0x0034, label: ': (JIS)', short: ': (JIS)', group: 'JIS記号' },
];
