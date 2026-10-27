// タイピングゲームの単語。日本語（表示＋読み）と英単語を混ぜて出す
export interface Word { text: string; kana: string; lang: 'ja' | 'en' }

const JA: [string, string][] = [
  ['天気', 'てんき'], ['新聞', 'しんぶん'], ['切手', 'きって'], ['お茶', 'おちゃ'], ['電車', 'でんしゃ'],
  ['自転車', 'じてんしゃ'], ['写真', 'しゃしん'], ['教室', 'きょうしつ'], ['宿題', 'しゅくだい'], ['旅行', 'りょこう'],
  ['図書館', 'としょかん'], ['音楽', 'おんがく'], ['映画', 'えいが'], ['料理', 'りょうり'], ['朝ごはん', 'あさごはん'],
  ['駅前', 'えきまえ'], ['散歩', 'さんぽ'], ['ちょっと', 'ちょっと'], ['キーボード', 'きーぼーど'], ['マウス', 'まうす'],
  ['画面', 'がめん'], ['会議', 'かいぎ'], ['メール', 'めーる'], ['休憩', 'きゅうけい'], ['コーヒー', 'こーひー'],
  ['ありがとう', 'ありがとう'], ['おはよう', 'おはよう'], ['よろしく', 'よろしく'], ['練習', 'れんしゅう'], ['時計', 'とけい'],
  ['花火', 'はなび'], ['海辺', 'うみべ'], ['夕焼け', 'ゆうやけ'], ['雪だるま', 'ゆきだるま'], ['紅茶', 'こうちゃ'],
  ['左手', 'ひだりて'], ['右手', 'みぎて'], ['親指', 'おやゆび'], ['手首', 'てくび'], ['姿勢', 'しせい'],
  // むずかしい用の長い言葉
  ['トラックボール', 'とらっくぼーる'], ['分割キーボード', 'ぶんかつきーぼーど'], ['打ち合わせ', 'うちあわせ'],
  ['新幹線', 'しんかんせん'], ['冷蔵庫', 'れいぞうこ'], ['誕生日', 'たんじょうび'], ['お疲れさまです', 'おつかれさまです'],
  ['郵便局', 'ゆうびんきょく'], ['天気予報', 'てんきよほう'], ['水族館', 'すいぞくかん'], ['遊園地', 'ゆうえんち'],
  ['ショートカット', 'しょーとかっと'], ['お待たせしました', 'おまたせしました'], ['動物園', 'どうぶつえん'],
];

const EN: string[] = [
  'keyboard', 'trackball', 'layer', 'thumb', 'split', 'cursor', 'scroll', 'click', 'window', 'browser',
  'coffee', 'music', 'travel', 'garden', 'planet', 'orange', 'yellow', 'simple', 'quick', 'light',
  'morning', 'friend', 'letter', 'number', 'switch', 'button', 'screen', 'record', 'little', 'happy',
  'river', 'forest', 'castle', 'pocket', 'rabbit', 'pencil', 'summer', 'winter', 'silver', 'circle',
  'cat', 'sun', 'blue', 'tree', 'fish', 'milk', 'book', 'rain',
  // むずかしい用の長い単語
  'keyboard', 'shortcut', 'question', 'computer', 'beautiful', 'adventure', 'chocolate', 'umbrella',
  'mountain', 'birthday', 'together', 'yesterday', 'important', 'different', 'calendar', 'elephant',
];

export const WORDS: Word[] = [
  ...JA.map(([text, kana]) => ({ text, kana, lang: 'ja' as const })),
  ...EN.map(w => ({ text: w, kana: w, lang: 'en' as const })),
];

// 難易度ごとに使う言葉の長さ（日本語は読みの文字数、英語は文字数）
const FITS: Record<'easy' | 'normal' | 'hard', (w: Word) => boolean> = {
  easy:   w => (w.lang === 'ja' ? w.kana.length <= 4 : w.text.length <= 5),
  normal: w => (w.lang === 'ja' ? w.kana.length <= 6 : w.text.length <= 8),
  hard:   w => (w.lang === 'ja' ? w.kana.length >= 5 : w.text.length >= 7),
};

// 日本語と英語が半分ずつになるよう、それぞれから選んで混ぜる
export function pickWords(n: number, level: 'easy' | 'normal' | 'hard'): Word[] {
  const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pool = [...new Map(WORDS.filter(FITS[level]).map(w => [w.text, w])).values()];  // 重複を除く
  const ja = shuffle(pool.filter(w => w.lang === 'ja')).slice(0, Math.ceil(n / 2));
  const en = shuffle(pool.filter(w => w.lang === 'en')).slice(0, Math.floor(n / 2));
  return shuffle([...ja, ...en]);
}
