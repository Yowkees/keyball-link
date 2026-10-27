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
];

const EN: string[] = [
  'keyboard', 'trackball', 'layer', 'thumb', 'split', 'cursor', 'scroll', 'click', 'window', 'browser',
  'coffee', 'music', 'travel', 'garden', 'planet', 'orange', 'yellow', 'simple', 'quick', 'light',
  'morning', 'friend', 'letter', 'number', 'switch', 'button', 'screen', 'record', 'little', 'happy',
  'river', 'forest', 'castle', 'pocket', 'rabbit', 'pencil', 'summer', 'winter', 'silver', 'circle',
];

export const WORDS: Word[] = [
  ...JA.map(([text, kana]) => ({ text, kana, lang: 'ja' as const })),
  ...EN.map(w => ({ text: w, kana: w, lang: 'en' as const })),
];

// 日本語と英語が交互に近い割合で出るよう、それぞれから半分ずつ選んで混ぜる
export function pickWords(n: number): Word[] {
  const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const ja = shuffle(WORDS.filter(w => w.lang === 'ja')).slice(0, Math.ceil(n / 2));
  const en = shuffle(WORDS.filter(w => w.lang === 'en')).slice(0, Math.floor(n / 2));
  return shuffle([...ja, ...en]);
}
