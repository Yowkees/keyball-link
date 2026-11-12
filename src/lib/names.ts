import { t, tk } from './i18n';
// レイヤー・ジェスチャーの名前（2026-11-04〜、RP2040版v0.6.0〜）。名前はキーボードの中に保存する。
// 1つUTF-8で24バイトまで（日本語なら8文字）。名前が無い時は番号で表示する。

export const NAME_MAX_BYTES = 24;
export const NAME_KIND_LAYER = 0;
export const NAME_KIND_GESTURE = 1;
export const LAYER_NAME_COUNT = 8;
export const GESTURE_NAME_COUNT = 6;

const enc = new TextEncoder();

// 24バイトに収まるところまでで切る（文字の途中では切らない）
export function clampName(s: string): string {
  let out = '';
  for (const ch of s.replace(/[\r\n]/g, '')) {
    if (enc.encode(out + ch).length > NAME_MAX_BYTES) break;
    out += ch;
  }
  return out;
}

export const nameBytes = (s: string) => enc.encode(clampName(s));

// キーボードから受け取ったバイト列を名前にする（0x00か0xFFで終わり）
export function decodeName(bytes: ArrayLike<number>): string {
  const b: number[] = [];
  for (let i = 0; i < Math.min(bytes.length, NAME_MAX_BYTES); i++) {
    if (bytes[i] === 0x00 || bytes[i] === 0xFF) break;
    b.push(bytes[i]);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(b)).replace(/\uFFFD/g, '');
}

// 画面に出す名前
// 名前はキーボードに保存された文字のまま出す。ただし、ファームが書き込む初期の名前（日本語）と
// 同じ時だけ、表示中の言語へ訳す（英語表示で「画面切り替え」などが日本語のまま出ないように）
export const displayName = (name: string) => (DEFAULT_GESTURE_NAMES.includes(name) ? t(name) : name);
const DEFAULT_GESTURE_NAMES: string[] = [tk('画面切り替え'), tk('音量・明るさ'), tk('矢印キー'), tk('文字入力'), tk('ブラウザ'), tk('音楽・動画')];
export const gestureLabel = (i: number, names?: string[] | null) => (names?.[i] ? displayName(names[i]) : t('ジェスチャー{0}', i + 1));
export const layerLabel = (i: number, names?: string[] | null) => (names?.[i] ? `L${i} ${names[i]}` : `L${i}`);
