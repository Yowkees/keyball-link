// 多言語表示のしくみ（2026-11-12〜、本人希望。今は日本語と英語）
//
// 使い方: 画面に出す日本語を t("日本語の文言") で囲む。英語表示の時は src/locales/en.ts の
// 辞書から訳を引く。辞書に無い文言は日本語のまま表示する（訳し忘れても画面は壊れない）。
// 文の中に値を入れる時は {0} {1} … を使う: t("保存に失敗しました: {0}", message)
//
// 言語は、最初はブラウザの言語で決め（日本語以外なら英語）、画面の切り替えボタンで変えられる。
// 選んだ言語はブラウザに保存する。
import { useSyncExternalStore } from 'react';
import { EN } from '../locales/en';

export type Lang = 'ja' | 'en';

const STORAGE_KEY = 'lang';

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ja' || saved === 'en') return saved;
  } catch { /* 保存領域が使えないブラウザ */ }
  const nav = typeof navigator !== 'undefined' ? (navigator.languages?.[0] ?? navigator.language ?? '') : '';
  return nav.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

let current: Lang = detectLang();
const listeners = new Set<() => void>();

function applyHtmlLang() {
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}
applyHtmlLang();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* 保存できなくても表示は切り替える */ }
  applyHtmlLang();
  listeners.forEach(l => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// 言語が変わったら画面を描き直すためのフック。App で呼ぶと、その下の画面全体が描き直される
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

// 開発中に、辞書に無い文言をコンソールへ1回ずつ知らせる（訳し漏れを見つけるため）
const reported = new Set<string>();
const isDev = typeof location !== 'undefined'
  && (location.hostname.startsWith('rp2040.') || location.hostname === 'localhost');

function fill(text: string, args: (string | number)[]): string {
  return args.length ? text.replace(/\{(\d+)\}/g, (m, i) => (args[+i] !== undefined ? String(args[+i]) : m)) : text;
}

export function t(ja: string, ...args: (string | number)[]): string {
  if (current === 'ja') return fill(ja, args);
  const en = EN[ja];
  if (en === undefined) {
    if (isDev && !reported.has(ja)) { reported.add(ja); console.info('[i18n] 英訳なし:', ja); }
    return fill(ja, args);
  }
  return fill(en, args);
}

// 訳す文言の「印」だけを付ける（そのままの日本語を返す）。ファイルの読み込み時に作る一覧データなど、
// その場で訳すと言語を切り替えた時に古い言語のまま残るものに使う。表示する所で t(値) を通して訳す。
// 訳し漏れ確認スクリプトは tk("…") も辞書に必要な文言として数える。
export function tk(ja: string): string {
  return ja;
}

// エラーの中身を文字列にする（よく使うので共通化）
export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
