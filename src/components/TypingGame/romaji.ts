// タイピングゲーム用のローマ字判定。
// ひらがなを1文字（または「きゃ」などの2文字）ずつの区切りに分け、それぞれに打ち方の候補
// （し＝shi/si/ci など）を持たせる。どの打ち方でも正解にする。

const V = 'aiueo';

// 1文字の打ち方（最初の候補を画面のお手本に使う）
const BASE: Record<string, string[]> = {
  あ: ['a'], い: ['i', 'yi'], う: ['u', 'wu', 'whu'], え: ['e'], お: ['o'],
  か: ['ka', 'ca'], き: ['ki'], く: ['ku', 'cu', 'qu'], け: ['ke'], こ: ['ko', 'co'],
  さ: ['sa'], し: ['shi', 'si', 'ci'], す: ['su'], せ: ['se', 'ce'], そ: ['so'],
  た: ['ta'], ち: ['chi', 'ti'], つ: ['tsu', 'tu'], て: ['te'], と: ['to'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha'], ひ: ['hi'], ふ: ['fu', 'hu'], へ: ['he'], ほ: ['ho'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], を: ['wo'], ん: ['nn', 'xn', 'n'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  ざ: ['za'], じ: ['ji', 'zi'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  だ: ['da'], ぢ: ['di'], づ: ['du'], で: ['de'], ど: ['do'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ぁ: ['xa', 'la'], ぃ: ['xi', 'li'], ぅ: ['xu', 'lu'], ぇ: ['xe', 'le'], ぉ: ['xo', 'lo'],
  ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'], っ: ['xtu', 'ltu', 'xtsu', 'ltsu'],
  ー: ['-'], '、': [','], '。': ['.'], ' ': [' '],
};

// 「きゃ」のように2文字で1つの音になるもの
const COMBO: Record<string, string[]> = {
  きゃ: ['kya'], きゅ: ['kyu'], きょ: ['kyo'],
  しゃ: ['sha', 'sya'], しゅ: ['shu', 'syu'], しょ: ['sho', 'syo'], しぇ: ['she', 'sye'],
  ちゃ: ['cha', 'tya', 'cya'], ちゅ: ['chu', 'tyu', 'cyu'], ちょ: ['cho', 'tyo', 'cyo'], ちぇ: ['che', 'tye', 'cye'],
  にゃ: ['nya'], にゅ: ['nyu'], にょ: ['nyo'],
  ひゃ: ['hya'], ひゅ: ['hyu'], ひょ: ['hyo'],
  みゃ: ['mya'], みゅ: ['myu'], みょ: ['myo'],
  りゃ: ['rya'], りゅ: ['ryu'], りょ: ['ryo'],
  ぎゃ: ['gya'], ぎゅ: ['gyu'], ぎょ: ['gyo'],
  じゃ: ['ja', 'zya', 'jya'], じゅ: ['ju', 'zyu', 'jyu'], じょ: ['jo', 'zyo', 'jyo'], じぇ: ['je', 'zye', 'jye'],
  びゃ: ['bya'], びゅ: ['byu'], びょ: ['byo'],
  ぴゃ: ['pya'], ぴゅ: ['pyu'], ぴょ: ['pyo'],
  ふぁ: ['fa'], ふぃ: ['fi'], ふぇ: ['fe'], ふぉ: ['fo'],
  てぃ: ['thi'], でぃ: ['dhi'], うぃ: ['wi'], うぇ: ['we'], ゔぁ: ['va'],
};

// 文字の区切りごとの打ち方の候補。2文字の音は、1文字ずつ打つ方法（き＋ゃ＝kixya）も候補に入れる
function unitsOf(kana: string): string[][] {
  const units: string[][] = [];
  for (let i = 0; i < kana.length; i++) {
    const pair = kana.slice(i, i + 2);
    if (COMBO[pair]) {
      const split = (BASE[pair[0]] ?? []).flatMap(a => (BASE[pair[1]] ?? []).map(b => a + b));
      units.push([...COMBO[pair], ...split]);
      i++;
    } else {
      const c = kana[i];
      // 英字・数字・記号はそのまま打つ
      units.push(BASE[c] ?? [c.toLowerCase()]);
    }
  }
  // 「っ」は次の音の最初の子音を重ねる打ち方（kka など）も候補にし、次の音とまとめて1つにする
  const out: string[][] = [];
  for (let i = 0; i < units.length; i++) {
    if (units[i] === BASE['っ'] && i + 1 < units.length) {
      const next = units[i + 1];
      const dbl = next.filter(c => !V.includes(c[0]) && c[0] !== 'n').map(c => c[0] + c);
      const sep = units[i].flatMap(a => next.map(b => a + b));
      out.push([...dbl, ...sep]);
      i++;
    } else out.push(units[i]);
  }
  return out;
}

export interface RomajiState {
  units: string[][];
  idx: number;      // 今打っている区切り
  buf: string;      // 今の区切りで打った文字
  done: string;     // 打ち終わった区切りのローマ字
}

export function newRomaji(kana: string): RomajiState {
  return { units: unitsOf(kana), idx: 0, buf: '', done: '' };
}

export const isFinished = (s: RomajiState) => s.idx >= s.units.length;

// 1文字打った結果。正しければ新しい状態、間違いなら null
export function typeKey(s: RomajiState, key: string): RomajiState | null {
  if (isFinished(s)) return null;
  const cands = s.units[s.idx];
  const next = s.buf + key;
  if (cands.some(c => c.startsWith(next))) {
    // その打ち方で区切りが完成し、続きのある候補が他に無ければ次の区切りへ
    if (cands.includes(next) && !cands.some(c => c.length > next.length && c.startsWith(next))) {
      return { ...s, idx: s.idx + 1, buf: '', done: s.done + next };
    }
    return { ...s, buf: next };
  }
  // 「ん」を n 1つで済ませて次の音を打った場合（次が母音・y・n で始まる時は「な行」と区別できないので不可）
  if (cands.includes(s.buf) && s.buf !== '') {
    if (s.buf === 'n' && cands.includes('nn') && 'aiueoyn'.includes(key)) return null;
    const moved = { ...s, idx: s.idx + 1, buf: '', done: s.done + s.buf };
    return typeKey(moved, key);
  }
  return null;
}

// 画面に出すお手本: [打ち終わった部分, まだの部分]
export function guide(s: RomajiState): [string, string] {
  const typed = s.done + s.buf;
  if (isFinished(s)) return [typed, ''];
  const cur = s.units[s.idx].find(c => c.startsWith(s.buf)) ?? s.units[s.idx][0];
  // お手本の「ん」は、次が子音（y・n以外）で始まる時は n 1つで見せる（shinbun の方が自然なため）
  const rest = s.units.slice(s.idx + 1).map((u, i, arr) => {
    const nx = arr[i + 1]?.[0];
    return u[0] === 'nn' && nx && !'aiueoyn'.includes(nx[0]) ? 'n' : u[0];
  }).join('');
  return [typed, cur.slice(s.buf.length) + rest];
}
