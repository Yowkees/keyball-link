// 文字列をマクロのステップ（キー入力の並び）に変換する（2026-10-06、本人希望で
// 「マクロに一文を登録したい」に対応）。
// マクロは「キーを押す」ことしかできないため、英数字・記号はそのキーを、日本語（ひらがな・
// カタカナ）はローマ字に直してそのキーを送る。日本語は、送る側のPCで日本語入力がONに
// なっている時だけ日本語として入力され、漢字への変換はされない。漢字は送れない。
import type { MacroStep } from './protocol';
import type { KeyLayout } from './keycodes';

const S = 0x0200;  // Shift付き（QK_LSFT）

// 両配列共通: 英字・数字・Space・Enter・Tab・, . /
function baseKey(ch: string): number | null {
  const c = ch.charCodeAt(0);
  if (ch >= 'a' && ch <= 'z') return 0x04 + (c - 97);
  if (ch >= 'A' && ch <= 'Z') return S | (0x04 + (c - 65));
  if (ch >= '1' && ch <= '9') return 0x1E + (c - 49);
  if (ch === '0') return 0x27;
  if (ch === ' ') return 0x2C;
  if (ch === '\n') return 0x28;
  if (ch === '\t') return 0x2B;
  if (ch === ',') return 0x36;
  if (ch === '.') return 0x37;
  if (ch === '/') return 0x38;
  if (ch === '<') return S | 0x36;
  if (ch === '>') return S | 0x37;
  if (ch === '?') return S | 0x38;
  if (ch === '!') return S | 0x1E;
  if (ch === '#') return S | 0x20;
  if (ch === '$') return S | 0x21;
  if (ch === '%') return S | 0x22;
  return null;
}

// US配列の記号
const US_SYMBOLS: Record<string, number> = {
  '@': S | 0x1F, '^': S | 0x23, '&': S | 0x24, '*': S | 0x25, '(': S | 0x26, ')': S | 0x27,
  '-': 0x2D, '_': S | 0x2D, '=': 0x2E, '+': S | 0x2E,
  '[': 0x2F, '{': S | 0x2F, ']': 0x30, '}': S | 0x30, '\\': 0x31, '|': S | 0x31,
  ';': 0x33, ':': S | 0x33, "'": 0x34, '"': S | 0x34, '`': 0x35, '~': S | 0x35,
};

// JIS配列の記号（OS側のキーボード設定がJISの時に、その文字になるキー）
const JIS_SYMBOLS: Record<string, number> = {
  '"': S | 0x1F, '&': S | 0x23, "'": S | 0x24, '(': S | 0x25, ')': S | 0x26,
  '-': 0x2D, '=': S | 0x2D, '^': 0x2E, '~': S | 0x2E,
  '@': 0x2F, '`': S | 0x2F, '[': 0x30, '{': S | 0x30,
  ';': 0x33, '+': S | 0x33, ':': 0x34, '*': S | 0x34,
  ']': 0x32, '}': S | 0x32,             // KC_NUHS（「む」の右のキー）
  '\\': 0x87, '_': S | 0x87,           // KC_INT1（「ろ」キー）
  '¥': 0x89, '|': S | 0x89,            // KC_INT3（「¥」キー）
};

// ひらがな → ローマ字（カタカナはひらがなに直してから引く）
const KANA: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'si', す: 'su', せ: 'se', そ: 'so', ざ: 'za', じ: 'zi', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  た: 'ta', ち: 'ti', つ: 'tu', て: 'te', と: 'to', だ: 'da', ぢ: 'di', づ: 'du', で: 'de', ど: 'do',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'hu', へ: 'he', ほ: 'ho', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'nn', ゔ: 'vu',
  ぁ: 'xa', ぃ: 'xi', ぅ: 'xu', ぇ: 'xe', ぉ: 'xo', ゃ: 'xya', ゅ: 'xyu', ょ: 'xyo', っ: 'xtu', ゎ: 'xwa',
  ー: '-', '、': ',', '。': '.', '「': '[', '」': ']', '・': '/', '〜': '~',
};
// 拗音（きゃ等）は2文字まとめて変換する
const YOON: Record<string, string> = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo' };
const YOON_HEAD: Record<string, string> = {
  き: 'k', ぎ: 'g', し: 's', じ: 'z', ち: 't', ぢ: 'd', に: 'n', ひ: 'h', び: 'b', ぴ: 'p', み: 'm', り: 'r',
};

function toHiragana(ch: string): string {
  const c = ch.charCodeAt(0);
  return c >= 0x30A1 && c <= 0x30F6 ? String.fromCharCode(c - 0x60) : ch;
}

export interface TextToMacroResult {
  steps: MacroStep[];
  romaji: string;          // 実際に打つ文字列（日本語をローマ字に直した後）
  unsupported: string[];   // 送れない文字（漢字など）
  hasJapanese: boolean;
}

export function textToMacro(text: string, layout: KeyLayout): TextToMacroResult {
  const src = text.normalize('NFKC').replace(/\r\n?/g, '\n');
  const chars = [...src].map(toHiragana);
  let romaji = '';
  const unsupported: string[] = [];
  let hasJapanese = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (YOON_HEAD[ch] && next && YOON[next]) {
      romaji += YOON_HEAD[ch] + YOON[next];
      hasJapanese = true;
      i++;
      continue;
    }
    if (ch === 'っ' && next && KANA[next] && /^[bcdfghjkmpqrstvwxyz]/.test(KANA[next])) {
      romaji += KANA[next][0];  // 促音は次の子音を重ねる（例: っか → kka）
      hasJapanese = true;
      continue;
    }
    if (KANA[ch] !== undefined) {
      // 「ん」の直後が母音・な行・や行でなければ「n」1つで足りるが、確実さを優先して常に「nn」
      romaji += KANA[ch];
      hasJapanese = true;
      continue;
    }
    romaji += ch;
  }

  const symbols = layout === 'JIS' ? JIS_SYMBOLS : US_SYMBOLS;
  const steps: MacroStep[] = [];
  for (const ch of romaji) {
    const kc = baseKey(ch) ?? symbols[ch] ?? null;
    if (kc === null) {
      if (!unsupported.includes(ch)) unsupported.push(ch);
      continue;
    }
    steps.push({ keycode: kc, delayMs: 0, hold: false });
  }
  return { steps, romaji, unsupported, hasJapanese };
}
