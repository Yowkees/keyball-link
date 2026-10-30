import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { KeyboardLayout } from '../KeyboardLayout/KeyboardLayout';
import type { KeyMark, KeyHeat } from '../KeyboardLayout/Key';
import { makeFinder, type Board, type KeyWay } from './keyFinder';
import { charToKeycode } from '../../lib/textToMacro';

// 記号・数字の練習（2026-10-29〜、本人希望）。Keyballをやめてしまう一番の原因
// 「レイヤーにある記号・数字の場所が分からない」をなくすための練習。
// その人のキー配列（接続したKeyballのキーマップ）を画面に出し、次に打つ文字の
// 「押すキー」「押したままにするレイヤーキー」「Shift」を光らせて案内する。
// 覚えてきた文字はヒントを遅らせ（すぐ → 2秒迷ったら → 5秒迷ったら）、最後は見ずに打てるようにする。
// 間違えた時は「レイヤーキーを押せていない」「Shiftが要る」など、何が違ったかを教える。

// letters・thumb は神の試練（TrialTab）だけで使うコース（自由練習のコース一覧には出さない）
export type Course = 'num' | 'sym' | 'real' | 'weak' | 'letters' | 'thumb';
const FREE_COURSES: Course[] = ['num', 'sym', 'real', 'weak'];
const COURSES: Record<Course, { name: string; desc: string }> = {
  letters: { name: '縦の道', desc: '縦に並んだキー' },
  thumb:   { name: '親指', desc: 'スペースとEnter' },
  num:  { name: '数字',       desc: '日付・時刻・金額・電話番号' },
  sym:  { name: '記号',       desc: 'よく使う記号から少しずつ増やす' },
  real: { name: '実際の文',   desc: 'メールアドレス・URL・コードなど' },
  weak: { name: '苦手な文字', desc: 'これまでの記録で苦手な文字だけ' },
};
const ITEMS = 20;   // 1回の練習のお題の数（2026-10-30に10→20。合格ラインも90%→95%に）
// よく使う順。記号のコースは最初の6個から始め、覚えたら3個ずつ増やす
const SYMBOL_ORDER = [...'-.,/@_():;!?#&*+="\'[]{}<>%$~^|`'];
const DIGITS = [...'0123456789'];
const REAL = [
  'yamada_taro@example.jp', 'https://www.example.com/', '~/Documents/report.pdf', '2026/10/29 12:30',
  '090-1234-5678', '(10+20)*3=90', 'x = [1, 2, 3];', 'if (a > b) { c(); }', 'name: "Keyball"',
  '50% OFF!', '$1,980', 'a-b_c.txt', 'Q&A', "it's OK", '<b>Hi</b>', 'git commit -m "fix"',
  'user@host:~$', 'const x = {a: 1};', '3.14 * r^2', 'A|B|C', '#keyball', 'v1.2.3', 'TODO: 3/15',
  'https://example.com/?q=1&page=2', 'tel: 03-1234-5678', 'price = 1200 * 1.1;',
  'info@keyball.jp', 'C:\\Users\\me', 'a && b || c', 'list[0] = "x";', '[OK] done!', '(^_^)/',
  'x += 1; y -= 2;', '10:00-18:00', '#1 / #2 / #3', 'f(x) = 2x + 1', '{"id": 7}', 'see: p.42',
  'npm run build', 'cd ~/keyball', 'Hello, World!', 'mail@ex.co.jp',
];
// 縦に並んだキー（普通のキーボードとずれて迷いやすいB・N・T・Y・V・Zなど）を多く含む言葉
const LETTER_WORDS = [
  'bring', 'vivid', 'typing', 'beyond', 'navy', 'token', 'brave', 'noble', 'verb', 'hybrid',
  'victory', 'zebra', 'buzz', 'convey', 'bunny', 'ebony', 'envy', 'tiny', 'bytes', 'gravity',
  'mobile', 'banana', 'cabin', 'velvet', 'tidy', 'ninety', 'combo', 'bounty', 'vintage', 'hymn',
  'bonny', 'bygone', 'novice', 'baby', 'tyre', 'betray', 'nebula', 'vibe', 'zone', 'bentley',
];
// 親指キーの練習（言葉の間はスペース、最後はEnter。\n がEnter）
const THUMB = [
  'keyball is fun\n', 'thumb keys\n', 'space and enter\n', 'type with thumbs\n', 'one two three\n',
  'good morning\n', 'see you soon\n', 'it is ok\n', 'nice day\n', 'let us go\n', 'red blue green\n',
  'a b c d e\n', 'yes or no\n', 'thank you\n', 'new line\n', 'big ball\n', 'happy keys\n',
  'left and right\n', 'up down\n', 'hello world\n', 'go go go\n', 'small but strong\n',
  'cat and dog\n', 'tea time\n', 'all done\n', 'one more time\n', 'you can do it\n',
  'light and dark\n', 'top to bottom\n', 'ready set go\n',
];
// 覚え具合: streak=続けて間違えずにヒントを待たず打てた回数。2回でヒントを2秒遅らせ、4回で「覚えた」
const HINT_DELAY = [0, 2000, 5000];
const stageOf = (streak: number) => (streak < 2 ? 0 : streak < 4 ? 1 : 2);
const MASTERY_KEY = 'symbolPracticeMastery';
const COURSE_KEY = 'symbolPracticeCourse';
const HINT_KEY = 'symbolPracticeHintAlways';

interface Rec { ok: number; miss: number; time: number; streak: number }
type Mastery = Record<string, Rec>;
const blank: Rec = { ok: 0, miss: 0, time: 0, streak: 0 };

function loadMastery(): Mastery {
  try { return JSON.parse(localStorage.getItem(MASTERY_KEY) ?? '{}') as Mastery; } catch { return {}; }
}
function save(key: string, v: string) {
  try { localStorage.setItem(key, v); } catch { /* 保存できなくても練習はできる */ }
}
function loadCourse(): Course {
  try { const v = localStorage.getItem(COURSE_KEY); return v === 'sym' || v === 'real' || v === 'weak' ? v : 'num'; } catch { return 'num'; }
}
const clock = () => performance.now();
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pad = (n: number) => String(n).padStart(2, '0');
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
// 練習で覚え具合を記録する文字（数字と記号。英字・スペースは記録しない）
const tracked = (ch: string) => /[^a-zA-Z ]/.test(ch);
// 画面に出す時の文字（スペースは␣、Enterは⏎）
const shown = (c: string) => (c === ' ' ? '␣' : c === '\n' ? '⏎' : c);

const NUM_GEN = [
  () => `${rand(2020, 2030)}/${pad(rand(1, 12))}/${pad(rand(1, 28))}`,
  () => `${rand(0, 23)}:${pad(rand(0, 59))}`,
  () => rand(1000, 99999).toLocaleString('en-US'),
  () => `0${rand(70, 90)}-${rand(1000, 9999)}-${rand(1000, 9999)}`,
  () => `${rand(0, 99)}.${rand(0, 99)}`,
  () => String(rand(1000, 999999)),
  () => `${rand(1, 100)}%`,
];

// 苦手さ: 間違えた割合・1文字にかかった時間・まだ覚えていないか
function weakness(r: Rec): number {
  const n = r.ok + r.miss;
  return (n ? r.miss / n : 0) * 2 + (r.ok ? r.time / r.ok / 1500 : 1) + (r.streak < 2 ? 0.5 : 0);
}

// 文字の集まりから、苦手な文字ほど出やすいように4文字ずつのお題を作る
function drill(pool: string[], m: Mastery): string[] {
  const w = pool.map(c => 1 + weakness(m[c] ?? blank));
  const pick = (prev: string) => {
    for (;;) {
      let x = Math.random() * w.reduce((a, b) => a + b, 0);
      const i = w.findIndex(v => (x -= v) < 0);
      const c = pool[i < 0 ? 0 : i];
      if (c !== prev || pool.length < 2) return c;
    }
  };
  return Array.from({ length: ITEMS }, () => {
    let s = '';
    for (let j = 0; j < 4; j++) s += pick(s.slice(-1));
    return s;
  });
}

type BoardProps = Omit<ComponentProps<typeof KeyboardLayout>, 'keycodes' | 'selectedIndex' | 'onKeyClick' | 'onKeyDrop' | 'marks' | 'ballLabel'>;

// 神の試練として遊ぶ時の設定（無ければ自由練習）
export interface TrialSetting {
  course: Course;
  title: string;
  intro: string;
  pass: number;                                // 合格に必要な正確さ（%）
  onDone: (r: { acc: number; passed: boolean }) => void;
  onExit: () => void;
}

interface Props {
  board: Board | null;                         // 未接続の時はnull
  boardProps: BoardProps | null;
  ballLabelFor: (layer: number) => string;
  trial?: TrialSetting;
}

interface Run {
  items: string[]; idx: number; pos: number;
  hint: boolean;          // 今の文字のヒントを出しているか
  stage: number;          // 今の文字のヒントの段階（0=すぐ 1=2秒後 2=5秒後）
  missed: boolean;        // 今の文字で間違えたか
  wrong: number | null;   // 間違えて押したキー（一瞬赤くする）
  wrongN: number;         // 増えるたびに「間違い」の演出をやり直す
  okN: number;            // 増えるたびに「正解」の演出をやり直す
  msg: string | null;
}
const EMPTY_RUN: Run = { items: [], idx: 0, pos: 0, hint: false, stage: 0, missed: false, wrong: null, wrongN: 0, okN: 0, msg: null };
interface Result { chars: number; miss: number; ms: number; weak: string[]; newlyLearned: string[]; acc: number; perMiss: Record<string, number> }

export function SymbolPractice({ board, boardProps, ballLabelFor, trial }: Props) {
  const finder = useMemo(() => (board ? makeFinder(board) : null), [board]);
  const [phase, setPhase] = useState<'ready' | 'play' | 'result'>('ready');
  const [freeCourse, setCourse] = useState<Course>(loadCourse);
  const course = trial?.course ?? freeCourse;
  const [hintAlways, setHintAlways] = useState(() => { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; } });
  const [mastery, setMastery] = useState<Mastery>(loadMastery);
  const masteryRef = useRef(mastery);
  const [result, setResult] = useState<Result | null>(null);
  const live = useRef<Run>({ ...EMPTY_RUN });
  const [run, setRun] = useState<Run>(EMPTY_RUN);
  const put = (v: Partial<Run>) => { Object.assign(live.current, v); setRun({ ...live.current }); };
  const stats = useRef({ start: 0, last: 0, chars: 0, miss: 0, perMiss: {} as Record<string, number>, learnedBefore: new Set<string>() });

  // このキー配列で打てる数字・記号と、打てない記号（JIS配列の \ ¥ は環境で出る文字が違うので練習から外す）
  const { digits, symbols, missing } = useMemo(() => {
    if (!finder) return { digits: [], symbols: [], missing: [] };
    const syms = SYMBOL_ORDER.filter(c => !(board?.keyLayout === 'JIS' && c === '\\'));
    return {
      digits: DIGITS.filter(c => finder.find(c)),
      symbols: syms.filter(c => finder.find(c)),
      missing: syms.filter(c => !finder.find(c)),
    };
  }, [finder, board]);
  const all = useMemo(() => [...digits, ...symbols], [digits, symbols]);
  const learned = all.filter(c => (mastery[c]?.streak ?? 0) >= 4);
  // 記号のコースで練習する記号: 最初の6個から、全部ヒント2秒待ちの段階まで来たら3個ずつ増やす
  const symPool = useMemo(() => {
    let n = Math.min(6, symbols.length);
    while (n < symbols.length && symbols.slice(0, n).every(c => (mastery[c]?.streak ?? 0) >= 2)) n = Math.min(symbols.length, n + 3);
    return symbols.slice(0, n);
  }, [symbols, mastery]);
  const weakPool = useMemo(
    () => all.filter(c => mastery[c] && mastery[c].ok + mastery[c].miss > 0)
      .sort((a, b) => weakness(mastery[b]) - weakness(mastery[a])).slice(0, 8),
    [all, mastery],
  );

  const item = run.items[run.idx] ?? '';
  const want = item[run.pos] ?? '';
  const way: KeyWay | null = phase === 'play' && finder && want ? finder.find(want) : null;

  // 次の文字に進んだ時のヒントの段階（英字・スペースは5秒迷った時だけ出す）
  const hintFor = (ch: string) => {
    const stage = hintAlways ? 0 : tracked(ch) ? stageOf(masteryRef.current[ch]?.streak ?? 0) : 2;
    return { stage, hint: stage === 0 };
  };

  // 迷っている時は、段階に応じた時間が過ぎたらヒントを出す
  useEffect(() => {
    if (phase !== 'play' || run.hint) return;
    const t = setTimeout(() => put({ hint: true }), HINT_DELAY[run.stage]);
    return () => clearTimeout(t);
  }, [phase, run.idx, run.pos, run.hint, run.stage]);

  // 間違えて押したキーの赤い目印は少しで消す
  useEffect(() => {
    if (run.wrong === null) return;
    const t = setTimeout(() => put({ wrong: null }), 700);
    return () => clearTimeout(t);
  }, [run.wrongN, run.wrong]);

  const start = () => {
    const items =
      course === 'num' ? Array.from({ length: ITEMS }, () => NUM_GEN[rand(0, NUM_GEN.length - 1)]())
      : course === 'sym' ? drill(trial ? symbols.slice(0, 12) : symPool, masteryRef.current)
      : course === 'letters' ? shuffle(LETTER_WORDS).slice(0, ITEMS)
      : course === 'thumb' ? shuffle(THUMB).slice(0, ITEMS)
      : course === 'weak' ? drill(weakPool, masteryRef.current)
      : shuffle(REAL).slice(0, ITEMS);
    // 打てない文字が入ったお題は使わない（そのキー配列に無い記号など）
    const ok = items.filter(s => [...s].every(c => finder?.find(c)));
    if (!ok.length) return;
    stats.current = { start: 0, last: 0, chars: 0, miss: 0, perMiss: {}, learnedBefore: new Set(learned) };
    put({ items: ok, idx: 0, pos: 0, missed: false, wrong: null, msg: null, ...hintFor(ok[0][0]) });
    setResult(null);
    setPhase('play');
    // スタートのボタンにフォーカスが残ると、スペース・Enterでボタンが押されてやり直しになるので外す
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const finish = () => {
    const s = stats.current, m = masteryRef.current;
    const weak = Object.entries(s.perMiss).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
    const newlyLearned = all.filter(c => (m[c]?.streak ?? 0) >= 4 && !s.learnedBefore.has(c));
    const acc = s.chars + s.miss ? Math.round(s.chars / (s.chars + s.miss) * 100) : 100;
    setResult({ chars: s.chars, miss: s.miss, ms: s.last - s.start, weak, newlyLearned, acc, perMiss: { ...s.perMiss } });
    setPhase('result');
    trial?.onDone({ acc, passed: acc >= trial.pass });
  };

  const record = (ch: string, f: (r: Rec) => Rec) => {
    if (!tracked(ch)) return;
    const next = { ...masteryRef.current, [ch]: f(masteryRef.current[ch] ?? blank) };
    masteryRef.current = next;
    setMastery(next);
    save(MASTERY_KEY, JSON.stringify(next));
  };

  // 間違えた時に、何が違ったかを調べる
  const diagnose = (got: string, want: string, w: KeyWay): { msg: string; key: number | null } => {
    if (!finder || !board) return { msg: '違うキーです', key: null };
    const g = finder.find(got);
    const other = board.keyLayout === 'JIS' ? 'US' : 'JIS';
    const wantCode = charToKeycode(want, board.keyLayout), gotCode = charToKeycode(got, board.keyLayout);
    if (wantCode !== null && charToKeycode(got, other) === wantCode)
      return { msg: `「${got}」が入力されました。パソコンのキーボード設定と、Keyball Linkの配列設定（${board.keyLayout}）が違うかもしれません（詳細設定で変えられます）`, key: w.key };
    if (g && g.key === w.key && g.layer !== w.layer)
      return {
        msg: w.layer === 0 ? `キーは合っています。レイヤーキーを離してから押してください`
          : g.layer === 0 ? `キーは合っています。${finder.describe(w).split(' ＋ ')[0]}押してください`
          : `キーは合っていますが、レイヤー${g.layer}で押しています（レイヤー${w.layer}です）`,
        key: w.key,
      };
    if (wantCode !== null && gotCode !== null && (wantCode ^ 0x0200) === gotCode)
      return { msg: w.shift !== null ? 'キーは合っています。Shiftも一緒に押してください' : 'キーは合っています。Shiftは押さずに打ってください', key: w.key };
    return { msg: g ? `押したのは「${got}」のキーです（レイヤー${g.layer}）` : `「${got}」が入力されました`, key: g && g.layer === (live.current.hint ? w.layer : 0) ? g.key : null };
  };

  const onKey = (e: KeyboardEvent) => {
    const r = live.current;
    if (e.key === 'Escape') { setPhase('ready'); return; }
    if (e.ctrlKey || e.metaKey) return;
    if (e.isComposing || e.key === 'Process' || e.keyCode === 229) { put({ msg: '日本語入力をオフ（英数）にしてから打ってください' }); return; }
    // Enterは「\n」として扱う。それ以外の文字にならないキー（Shift・レイヤーキーだけ等）は無視
    const key = e.key === 'Enter' ? '\n' : e.key;
    if (key.length !== 1) return;
    e.preventDefault();
    const now = clock(), s = stats.current;
    if (!s.start) { s.start = now; s.last = now; }
    const target = r.items[r.idx][r.pos];
    if (key === target) {
      const dt = now - s.last;
      s.last = now; s.chars++;
      // 迷ってヒントを見てから打った時は「覚えた」に数えない
      const waited = r.hint && r.stage > 0;
      record(target, v => ({ ...v, ok: v.ok + 1, time: v.time + dt, streak: r.missed ? 0 : waited ? v.streak : v.streak + 1 }));
      let { idx, pos } = r;
      pos++;
      if (pos >= r.items[idx].length) { idx++; pos = 0; }
      if (idx >= r.items.length) { put({ okN: r.okN + 1 }); finish(); return; }
      put({ idx, pos, missed: false, msg: null, okN: r.okN + 1, ...hintFor(r.items[idx][pos]) });
    } else {
      s.miss++;
      s.perMiss[target] = (s.perMiss[target] ?? 0) + 1;
      record(target, v => ({ ...v, miss: v.miss + 1, streak: 0 }));
      const w = finder?.find(target);
      const d = w ? diagnose(key, target, w) : { msg: '違うキーです', key: null };
      put({ missed: true, hint: true, msg: d.msg, wrong: d.key, wrongN: r.wrongN + 1 });
    }
  };
  useEffect(() => {
    if (phase !== 'play') return;
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const chooseCourse = (c: Course) => { setCourse(c); save(COURSE_KEY, c); };
  const chip = (c: string) => {
    const st = stageOf(mastery[c]?.streak ?? 0), seen = !!mastery[c];
    return <span key={c} className={`sym-chip sym-chip--${!seen ? 'new' : ['learning', 'almost', 'done'][st]}`}>{shown(c)}</span>;
  };

  if (!board || !boardProps || !finder) {
    return (
      <div className="sym-practice">
        <div className="typing-game__field sym-practice__field">
          <div className="typing-game__center">
            <p className="typing-game__lead">{trial ? 'この試練は、つないだKeyballのキー配列を使います。' : 'Keyballをつなぐと、あなたのキー配列で記号・数字の練習ができます。'}</p>
            <p className="settings-desc">画面右上の「キーボードに接続」からKeyballをつないでください。</p>
            {trial && <button className="btn typing-game__start" onClick={trial.onExit}>試練の一覧へ</button>}
          </div>
        </div>
      </div>
    );
  }

  // キー配列の図: ヒントを出している時はその文字のレイヤーを、出していない時はレイヤー0を表示する
  const showLayer = phase === 'play' && run.hint && way ? way.layer : 0;
  const marks: Record<number, KeyMark> = {};
  if (phase === 'play' && run.hint && way) {
    if (way.hold !== null) marks[way.hold] = 'hold';
    if (way.shift !== null) marks[way.shift] = 'shift';
    marks[way.key] = 'target';
  }
  if (phase === 'play' && run.wrong !== null) marks[run.wrong] = 'wrong';
  // 間違えやすいキーのヒートマップ。結果の画面は今回の間違い、自由練習の始める前はこれまでの間違いを出す。
  // 同じキーで打つ文字（a と A、レイヤー違いの文字など）はまとめ、最も間違えたキーを4として4段階で色を付ける
  const heatFrom = (miss: Record<string, number>) => {
    if (!finder) return undefined;
    const byKey: Record<number, { n: number; chars: string[] }> = {};
    for (const [c, n] of Object.entries(miss)) {
      const w = n > 0 ? finder.find(c) : null;
      if (!w) continue;
      const e = (byKey[w.key] ??= { n: 0, chars: [] });
      e.n += n;
      if (!e.chars.includes(shown(c))) e.chars.push(shown(c));
    }
    const max = Math.max(0, ...Object.values(byKey).map(e => e.n));
    const heat: Record<number, KeyHeat> = {};
    for (const [k, e] of Object.entries(byKey))
      heat[+k] = { level: Math.max(1, Math.ceil(e.n / max * 4)) as KeyHeat['level'], note: `${e.chars.slice(0, 3).join('')} ${e.n}回` };
    return heat;
  };
  const heat = phase === 'result' && result ? heatFrom(result.perMiss)
    : phase === 'ready' && !trial ? heatFrom(Object.fromEntries(all.map(c => [c, mastery[c]?.miss ?? 0])))
    : undefined;
  const hasHeat = !!heat && Object.keys(heat).length > 0;
  const codes = board.layout.map(k => board.keymap[showLayer]?.[k.row]?.[k.col] ?? 0);
  const canStart = course === 'weak' ? weakPool.length >= 3 : course === 'sym' ? symPool.length > 0 : true;

  return (
    <div className="sym-practice">
      <div className="typing-game__head">
        <span className="typing-game__title">{trial ? trial.title : '記号・数字の練習'}</span>
        {!trial && phase !== 'ready' && <span className="typing-game__stage">{COURSES[course].name}</span>}
        {phase === 'play' && <span className="typing-game__left">{run.idx + 1} / {run.items.length}</span>}
        <span className="typing-game__best">覚えた文字 {learned.length} / {all.length}</span>
      </div>

      <div className="typing-game__field sym-practice__field">
        {phase === 'ready' && trial && (
          <div className="typing-game__center">
            <p className="typing-game__lead">{trial.intro}</p>
            <p className="settings-desc">合格の条件: 正確さ {trial.pass}% 以上 ／ 日本語入力はオフ（英数）にして打つ ／ やめる時は Esc</p>
            <label className="sym-practice__opt">
              <input type="checkbox" checked={hintAlways} onChange={e => { setHintAlways(e.target.checked); save(HINT_KEY, e.target.checked ? '1' : '0'); }} />
              ヒントをいつもすぐに出す
            </label>
            <div className="typing-game__again">
              <button className="btn btn--primary typing-game__start" onClick={start}>試練に挑む</button>
              <button className="btn typing-game__start" onClick={trial.onExit}>試練の一覧へ</button>
            </div>
          </div>
        )}

        {phase === 'ready' && !trial && (
          <div className="typing-game__center">
            <p className="typing-game__lead">あなたのキー配列で、レイヤーにある記号・数字を覚える練習です。</p>
            <ul className="typing-game__rules">
              <li>下のキー配列で、押すキー（緑）と、押したままにするレイヤーキー・Shift（青・紫）が光ります</li>
              <li>覚えてきた文字は、ヒントが少し待ってから出るようになります。最後は見ずに打てるのが目標です</li>
              <li>日本語入力はオフ（英数）にして打ちます。途中でやめる時は Esc</li>
            </ul>
            <div className="typing-game__levels">
              {FREE_COURSES.map(c => (
                <button key={c} type="button" className={`typing-level ${course === c ? 'typing-level--on' : ''}`} onClick={() => chooseCourse(c)}>
                  <b>{COURSES[c].name}</b>
                  <span>{COURSES[c].desc}</span>
                </button>
              ))}
            </div>
            {course === 'sym' && <div className="sym-chips">練習する記号: {symPool.map(chip)}</div>}
            {course === 'weak' && (weakPool.length >= 3
              ? <div className="sym-chips">苦手な文字: {weakPool.map(chip)}</div>
              : <p className="settings-desc">まだ記録が少ないので、先に他のコースで練習してください。</p>)}
            <label className="sym-practice__opt">
              <input type="checkbox" checked={hintAlways} onChange={e => { setHintAlways(e.target.checked); save(HINT_KEY, e.target.checked ? '1' : '0'); }} />
              ヒントをいつもすぐに出す
            </label>
            <button className="btn btn--primary typing-game__start" disabled={!canStart} onClick={start}>スタート</button>
          </div>
        )}

        {phase === 'play' && (
          <div className="typing-game__center sym-practice__play">
            <div key={run.idx} className="sym-practice__item">
              {[...item].map((c, i) => (
                <span
                  key={i}
                  className={i < run.pos ? 'sym-ch sym-ch--done' : i === run.pos ? `sym-ch sym-ch--now ${run.missed ? 'sym-ch--miss' : ''}` : 'sym-ch'}
                >
                  {i === run.pos && run.wrongN > 0 && run.missed && <span key={run.wrongN} className="sym-ch__shake" />}
                  {shown(c)}
                </span>
              ))}
            </div>
            <p className={`sym-practice__how ${run.hint ? '' : 'sym-practice__how--wait'}`}>
              {run.hint && way ? finder.describe(way) : 'キーを思い出して押してみよう（迷ったらヒントが出ます）'}
            </p>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="typing-game__center">
            {trial
              ? <p className={`trial-verdict ${result.acc >= trial.pass ? 'trial-verdict--pass' : 'trial-verdict--fail'}`}>{result.acc >= trial.pass ? '合格' : '不合格'}</p>
              : <p className="typing-game__lead">おつかれさまでした</p>}
            <div className="typing-game__result">
              <span>打った文字</span><b>{result.chars} 文字</b>
              <span>1文字あたり</span><b>{result.chars ? (result.ms / result.chars / 1000).toFixed(2) : '-'} 秒</b>
              <span>打ち間違い</span><b>{result.miss} 回</b>
              <span>正確さ</span><b>{result.acc}%{trial ? `（合格 ${trial.pass}%）` : ''}</b>
            </div>
            {result.newlyLearned.length > 0 && <div className="sym-chips">新しく覚えた: {result.newlyLearned.map(chip)}</div>}
            {result.weak.length > 0 && <div className="sym-chips">今回間違えた: {result.weak.map(chip)}</div>}
            <div className="typing-game__again">
              <button className="btn btn--primary typing-game__start" onClick={start}>もう一度</button>
              {trial
                ? <button className="btn typing-game__start" onClick={trial.onExit}>試練の一覧へ</button>
                : <button className="btn typing-game__start" onClick={() => setPhase('ready')}>コースを変える</button>}
            </div>
          </div>
        )}
      </div>

      <p className={`typing-game__msg ${phase === 'play' && run.msg ? 'typing-game__msg--warn' : ''}`}>
        {phase === 'play' && run.msg ? `⚠ ${run.msg}` : ' '}
      </p>

      <div className="sym-practice__board">
        <div className="sym-practice__layer">
          {hasHeat ? (phase === 'result' ? '今回間違えたキー' : 'これまで間違えたキー') : `レイヤー${showLayer}を表示中`}
          {hasHeat && <span className="sym-practice__legend">少ない{[1, 2, 3, 4].map(l => <span key={l} className={`sym-heat sym-heat--${l}`} />)}多い</span>}
          {phase !== 'play' && !hasHeat && <span className="sym-practice__legend">覚え具合: {['learning', 'almost', 'done'].map((k, i) => <span key={k} className={`sym-chip sym-chip--${k}`}>{['練習中', 'もう少し', '覚えた'][i]}</span>)}</span>}
        </div>
        <div className="layout-scroll">
          <KeyboardLayout
            {...boardProps}
            keycodes={codes}
            selectedIndex={null}
            marks={marks}
            heat={heat}
            ballLabel={ballLabelFor(showLayer)}
            onKeyClick={() => {}}
            onKeyDrop={() => {}}
          />
        </div>
      </div>

      {phase === 'ready' && !trial && (
        <div className="sym-chips sym-practice__all">
          {all.map(chip)}
          {missing.length > 0 && <span className="sym-practice__missing">このキー配列では打てない記号: {missing.join(' ')}</span>}
        </div>
      )}
    </div>
  );
}
