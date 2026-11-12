import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { KeyboardLayout } from '../KeyboardLayout/KeyboardLayout';
import type { KeyMark, KeyHeat } from '../KeyboardLayout/Key';
import { makeFinder, type Board, type KeyWay } from './keyFinder';
import { newRomaji, typeKey, isFinished, aheadOf, completesKana, type RomajiState } from './romaji';
import type { TrialSetting } from './SymbolPractice';

// 第二の試練「親指の目覚め」（2026-10-30〜、本人希望で作り直し）。
// 本物の日本語入力で、親指で押すキー（かな・英数・Space・Enter・Backspace）とShiftを練習する。
//   ［かな］→ ローマ字 → Spaceで変換 → Enterで確定 →［英数］→ 英字（大文字はShift）→ … → Enterで送信
// 変換の結果は日本語入力ソフトや環境で違うので見ない。押したキー（e.code）と、
// 日本語入力がオンかどうか（keyCode 229）で判定する。間違えた文字はBackspaceで消してから打ち直す。

type Special = 'kana' | 'eisu' | 'space' | 'enter';
type Step =
  | { t: 'key'; key: Special; name: string }
  | { t: 'ja'; text: string; kana: string }
  | { t: 'en'; text: string };
interface Item { text: string; steps: Step[] }

const ITEMS = 10;
// お題。「 / 」で日本語と英語を区切る。日本語は「表示|読み」、英語はそのまま。
// 「っ」は日本語入力のBackspaceの消え方が違って判定がずれるので使わない
const SOURCE = [
  '明日は|あしたは / Keyball / を使います|をつかいます',
  '新しい|あたらしい / Mac / を買いました|をかいました',
  '会議は|かいぎは / Zoom / でお願いします|でおねがいします',
  'Google / で検索します|でけんさくします',
  '今日の|きょうの / TODO / を確認|をかくにん',
  'YouTube / を見る|をみる',
  'よろしくお願いします|よろしくおねがいします',
  'ありがとうございます|ありがとうございます',
  'iPhone / の充電|のじゅうでん',
  'Slack / に書きました|にかきました',
  '資料は|しりょうは / PDF / で送ります|でおくります',
  'Windows / の更新|のこうしん',
  'おはようございます|おはようございます',
  '了解です|りょうかいです',
  'Amazon / で注文|でちゅうもん',
  '週末は|しゅうまつは / Netflix / を見る|をみる',
  'Excel / で表を作る|でひょうをつくる',
  'お疲れさまです|おつかれさまです',
  'GitHub / に上げました|にあげました',
  '新しい|あたらしい / Keyball / が届いた|がとどいた',
  'OK / です|です',
  '写真を|しゃしんを / LINE / で送る|でおくる',
  'Keyball / は楽しい|はたのしい',
  'Mac / と|と / Windows',
];

// お題を、押す順の手順に分ける（日本語の前は［かな］、英語の前は［英数］、最後はEnterで送信）
function itemOf(src: string): Item {
  const steps: Step[] = [];
  let mode: 'ja' | 'en' | null = null, text = '';
  for (const seg of src.split(' / ')) {
    const [t, k] = seg.split('|');
    if (k !== undefined) {
      if (mode !== 'ja') steps.push({ t: 'key', key: 'kana', name: 'かな' });
      steps.push({ t: 'ja', text: t, kana: k });
      if (t !== k) steps.push({ t: 'key', key: 'space', name: '変換' });
      steps.push({ t: 'key', key: 'enter', name: '確定' });
      mode = 'ja';
    } else {
      if (mode !== 'en') steps.push({ t: 'key', key: 'eisu', name: '英数' });
      steps.push({ t: 'en', text: t });
      mode = 'en';
    }
    text += t;
  }
  steps.push({ t: 'key', key: 'enter', name: '送信' });
  return { text, steps };
}

// キー配列の中から探すキー（短く押した時の働き）。かなは LANG1・変換・カタカナひらがな、英数は LANG2・無変換
const CODES: Record<Special | 'bs', (c: number) => boolean> = {
  kana: c => c === 0x90 || c === 0x8A || c === 0x88,
  eisu: c => c === 0x91 || c === 0x8B,
  space: c => c === 0x2C,
  enter: c => c === 0x28,
  bs: c => c === 0x2A,
};
const KEY_NAME: Record<Special | 'bs', string> = { kana: 'かな', eisu: '英数', space: 'Space', enter: 'Enter', bs: 'Backspace' };
// かな・英数のキーが押されたか（OSやブラウザで名前が違う。届かない環境もあるので、
// その時は次に打った文字で日本語入力のオン・オフを見て判断する）
const isKanaKey = (e: KeyboardEvent) =>
  ['Lang1', 'KanaMode', 'Convert'].includes(e.code) || ['KanaMode', 'Convert', 'Hiragana', 'HiraganaKatakana', 'Lang1'].includes(e.key);
const isEisuKey = (e: KeyboardEvent) =>
  ['Lang2', 'NonConvert'].includes(e.code) || ['Eisu', 'Alphanumeric', 'NonConvert', 'Lang2'].includes(e.key);
// 日本語入力がオンの時に押したローマ字のキー（日本語入力中は e.key が当てにならないので、キーの位置で見る）
const letterOf = (code: string) => (/^Key[A-Z]$/.test(code) ? code[3].toLowerCase() : null);
const MODIFIERS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn'];
const clock = () => performance.now();
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

type BoardProps = Omit<ComponentProps<typeof KeyboardLayout>, 'keycodes' | 'selectedIndex' | 'onKeyClick' | 'onKeyDrop' | 'marks' | 'ballLabel' | 'heat'>;

interface Props {
  board: Board | null;
  boardProps: BoardProps | null;
  ballLabelFor: (layer: number) => string;
  trial: Omit<TrialSetting, 'course'>;
}

interface Run {
  items: Item[]; idx: number; step: number;
  rs: RomajiState | null;    // 日本語の打ち進み
  hist: RomajiState[];       // Backspaceで戻すための、日本語の打ち進みの履歴
  pos: number;               // 英語の打ち進み
  junk: number;              // 間違えて入力され、まだBackspaceで消していない文字の数
  junkKana: boolean;         // 最初の間違いで「かな」が出来上がったか（Backspace 1回で打ちかけのローマ字ごと消える）
  missed: boolean;
  wrongN: number;
  msg: string | null;
}
const EMPTY_RUN: Run = { items: [], idx: 0, step: 0, rs: null, hist: [], pos: 0, junk: 0, junkKana: false, missed: false, wrongN: 0, msg: null };
interface Result { ok: number; miss: number; acc: number; ms: number; heat: Record<number, { n: number; name: string }> }

export function ThumbTrial({ board, boardProps, ballLabelFor, trial }: Props) {
  const finder = useMemo(() => (board ? makeFinder(board) : null), [board]);
  const [phase, setPhase] = useState<'ready' | 'play' | 'result'>('ready');
  const [result, setResult] = useState<Result | null>(null);
  const live = useRef<Run>({ ...EMPTY_RUN });
  const [run, setRun] = useState<Run>(EMPTY_RUN);
  const put = (v: Partial<Run>) => { Object.assign(live.current, v); setRun({ ...live.current }); };
  const stats = useRef({ start: 0, ok: 0, miss: 0, heat: {} as Record<number, { n: number; name: string }> });
  const inputRef = useRef<HTMLInputElement>(null);

  // 今押すべきもの: 文字（ch）か、文字にならないキー（code）
  const targetOf = (r: Run): { ch: string } | { code: Special | 'bs' } | null => {
    const st = r.items[r.idx]?.steps[r.step];
    if (!st) return null;
    if (r.junk > 0) return { code: 'bs' };
    if (st.t === 'key') return { code: st.key };
    if (st.t === 'ja') return r.rs ? { ch: aheadOf(r.rs)[1][0] ?? '' } : null;
    return { ch: st.text[r.pos] ?? '' };
  };
  const wayOf = (t: ReturnType<typeof targetOf>): KeyWay | null =>
    !t || !finder ? null : 'ch' in t ? finder.find(t.ch) : finder.findCode(CODES[t.code]);
  const nameOf = (t: ReturnType<typeof targetOf>) => (!t ? '' : 'ch' in t ? `「${t.ch}」` : `「${KEY_NAME[t.code]}」`);

  const start = () => {
    const items = shuffle(SOURCE).slice(0, ITEMS).map(itemOf);
    stats.current = { start: 0, ok: 0, miss: 0, heat: {} };
    live.current = { ...EMPTY_RUN, items };
    setRun({ ...live.current });
    setResult(null);
    setPhase('play');
    if (inputRef.current) inputRef.current.value = '';
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finish = () => {
    const s = stats.current;
    const acc = s.ok + s.miss ? Math.round(s.ok / (s.ok + s.miss) * 100) : 100;
    setResult({ ok: s.ok, miss: s.miss, acc, ms: clock() - s.start, heat: s.heat });
    setPhase('result');
    trial.onDone({ acc, passed: acc >= trial.pass });
  };

  // 次の手順へ（最後まで来たら次のお題へ）
  const advance = () => {
    const r = live.current, item = r.items[r.idx];
    stats.current.ok++;
    const next = r.step + 1;
    if (next < item.steps.length) {
      const st = item.steps[next];
      put({ step: next, junk: 0, missed: false, msg: null, ...(st.t === 'ja' ? { rs: newRomaji(st.kana), hist: [] } : st.t === 'en' ? { pos: 0 } : {}) });
      return;
    }
    // 送信のEnterで入力欄が変わる前に消すと残ることがあるので、少し後で消す
    setTimeout(() => { if (inputRef.current) inputRef.current.value = ''; }, 0);
    if (r.idx + 1 >= r.items.length) { finish(); return; }
    put({ idx: r.idx + 1, step: 0, rs: null, hist: [], pos: 0, junk: 0, missed: false, msg: null });
  };

  const miss = (msg: string, junk: Partial<Run> = {}) => {
    const r = live.current, s = stats.current;
    const t = targetOf(r), w = wayOf(t);
    s.miss++;
    if (w) s.heat[w.key] = { n: (s.heat[w.key]?.n ?? 0) + 1, name: t && 'ch' in t ? t.ch : t ? KEY_NAME[t.code] : '' };
    put({ msg, missed: true, wrongN: r.wrongN + 1, ...junk });
  };

  const onKey = (e: KeyboardEvent) => {
    const r = live.current;
    const st = r.items[r.idx]?.steps[r.step];
    if (!st) return;
    if (e.key === 'Escape') { setPhase('ready'); return; }
    if (e.ctrlKey || e.metaKey || MODIFIERS.includes(e.key)) return;
    if (!stats.current.start) stats.current.start = clock();
    const ime = e.isComposing || e.keyCode === 229 || e.key === 'Process';
    const letter = ime ? letterOf(e.code) : e.key.length === 1 ? e.key : null;

    // Backspace: 間違えた文字を消す。間違いが無ければ、打った文字を1つ戻す
    if (e.code === 'Backspace') {
      if (r.junk > 0) {
        const junk = r.junk - 1;
        put({ junk, msg: junk ? 'もう一度 Backspace で消してください' : null, ...(junk === 0 && st.t === 'ja' && r.junkKana && r.rs ? { rs: { ...r.rs, buf: '' } } : {}) });
      } else if (st.t === 'ja' && r.rs) {
        put({ rs: backOne(r.rs, r.hist) });
      } else if (st.t === 'en' && r.pos > 0) {
        put({ pos: r.pos - 1 });
      } else if (st.t === 'key' && (st.key === 'space' || (st.key === 'enter' && st.name === '確定')) && r.rs) {
        // 変換・確定の前なら、まだ日本語を打っている途中に戻れる
        const prev = r.items[r.idx].steps[r.step - 1];
        if (prev?.t === 'ja') put({ step: r.step - 1, rs: backOne(r.rs, r.hist), msg: null });
      }
      return;
    }
    // 間違えた文字が残っている間は、何を打っても消すまで進まない
    if (r.junk > 0) {
      if (letter || e.code === 'Space') put({ junk: r.junk + 1, msg: '間違えた文字を Backspace で消してください' });
      return;
    }

    if (st.t === 'key') {
      if (st.key === 'kana') {
        if (isKanaKey(e)) advance();
        else if (letter && ime) { advance(); onKey(e); }   // かなキーが届かない環境: 日本語入力がオンになっていればよい
        else if (letter) miss('「かな」キーを押して、日本語入力をオンにしてから打ちます', { junk: 1, junkKana: false });
      } else if (st.key === 'eisu') {
        if (isEisuKey(e)) advance();
        else if (letter && !ime) { advance(); onKey(e); }  // 英数キーが届かない環境: 日本語入力がオフになっていればよい
        else if (letter) miss('「英数」キーを押して、日本語入力をオフにしてから打ちます', { junk: 1, junkKana: false });
      } else if (st.key === 'space') {
        if (e.code === 'Space') advance();
        else if (e.code === 'Enter') {
          // 変換せずに確定した: 確定までは済んだので、次へ進む
          miss('Space で変換してから、Enter で確定します');
          put({ step: r.step + 1 });
          advance();
        } else if (letter) miss('Space で変換します', { junk: 1, junkKana: false });
      } else {
        if (e.code === 'Enter' || e.code === 'NumpadEnter') advance();
        else if (e.code === 'Space') { /* 変換の候補を選び直している */ }
        else if (letter) miss(st.name === '確定' ? 'Enter で確定します' : 'Enter で送信します', { junk: 1, junkKana: false });
      }
      return;
    }

    if (st.t === 'ja') {
      if (!letter || !r.rs) {
        if (e.code === 'Space' || e.code === 'Enter') miss('まだ途中です。最後まで打ってから変換・確定します');
        return;
      }
      if (!ime) { miss('日本語入力がオフです。「かな」キーを押してから打ってください', { junk: 1, junkKana: false }); return; }
      const next = typeKey(r.rs, letter);
      if (next) {
        stats.current.ok++;
        put({ rs: next, hist: [...r.hist, r.rs], missed: false, msg: null });
        if (isFinished(next)) { stats.current.ok--; advance(); }
      } else {
        miss(`違うキーです。Backspace で消して、${nameOf(targetOf(r))}を打ちます`, { junk: 1, junkKana: completesKana(r.rs.buf + letter) });
      }
      return;
    }

    // 英語
    if (ime) { miss('日本語入力がオンです。「英数」キーを押してから打ってください', { junk: 1, junkKana: false }); return; }
    if (!letter) return;
    if (letter === st.text[r.pos]) {
      if (r.pos + 1 >= st.text.length) advance();
      else { stats.current.ok++; put({ pos: r.pos + 1, missed: false, msg: null }); }
    } else {
      const want = st.text[r.pos];
      miss(want.toLowerCase() === letter.toLowerCase()
        ? (want !== want.toLowerCase() ? '大文字です。Backspace で消して、Shift を押しながら打ちます' : '小文字です。Backspace で消して、Shift を押さずに打ちます')
        : `違うキーです。Backspace で消して、「${want}」を打ちます`, { junk: 1, junkKana: false });
    }
  };

  // 間違えて押したキーの赤い目印は少しで消す
  useEffect(() => {
    if (!run.missed) return;
    const t = setTimeout(() => put({ missed: false }), 700);
    return () => clearTimeout(t);
  }, [run.wrongN, run.missed]);

  if (!board || !boardProps || !finder) {
    return (
      <div className="sym-practice">
        <div className="typing-game__head"><span className="typing-game__title">{trial.title}</span></div>
        <div className="typing-game__field sym-practice__field">
          <div className="typing-game__center">
            <p className="typing-game__lead">この試練は、つないだKeyballのキー配列を使います。</p>
            <p className="settings-desc">画面右上の「キーボードに接続」からKeyballをつないでください。</p>
            <button className="btn typing-game__start" onClick={trial.onExit}>試練の一覧へ</button>
          </div>
        </div>
      </div>
    );
  }

  const item = run.items[run.idx];
  const target = phase === 'play' ? targetOf(run) : null;
  const way = wayOf(target);
  const showLayer = way ? way.layer : 0;
  const marks: Record<number, KeyMark> = {};
  if (way) {
    if (way.hold !== null) marks[way.hold] = 'hold';
    if (way.shift !== null) marks[way.shift] = 'shift';
    marks[way.key] = run.missed ? 'wrong' : 'target';
  }
  // 結果の画面: 間違えたキーのヒートマップ
  let heat: Record<number, KeyHeat> | undefined;
  if (phase === 'result' && result) {
    const max = Math.max(0, ...Object.values(result.heat).map(h => h.n));
    heat = {};
    for (const [k, h] of Object.entries(result.heat))
      heat[+k] = { level: Math.max(1, Math.ceil(h.n / max * 4)) as KeyHeat['level'], note: `${h.name} ${h.n}回` };
  }
  const hasHeat = !!heat && Object.keys(heat).length > 0;
  const codes = board.layout.map(k => board.keymap[showLayer]?.[k.row]?.[k.col] ?? 0);

  return (
    <div className="sym-practice">
      <div className="typing-game__head">
        <span className="typing-game__title">{trial.title}</span>
        {phase === 'play' && <span className="typing-game__left">{run.idx + 1} / {run.items.length}</span>}
      </div>

      <div className="typing-game__field sym-practice__field" onClick={() => phase === 'play' && inputRef.current?.focus()}>
        {phase === 'ready' && (
          <div className="typing-game__center">
            <p className="typing-game__lead">{trial.intro}</p>
            <ul className="typing-game__rules">
              <li>日本語は「かな」キーで日本語入力をオンにして、ローマ字で打ち、Space で変換、Enter で確定します</li>
              <li>英語は「英数」キーで日本語入力をオフにして打ちます。大文字は Shift を押しながら</li>
              <li>最後に Enter で送信します。間違えた文字は Backspace で消してから打ち直します</li>
            </ul>
            <p className="settings-desc">合格の条件: 正確さ {trial.pass}% 以上 ／ やめる時は Esc</p>
            <div className="typing-game__again">
              <button className="btn btn--primary typing-game__start" onClick={start}>試練に挑む</button>
              <button className="btn typing-game__start" onClick={trial.onExit}>試練の一覧へ</button>
            </div>
          </div>
        )}

        {phase === 'play' && item && (
          <div className="typing-game__center sym-practice__play">
            <div key={run.idx} className="thumb-steps">
              {item.steps.map((st, i) => {
                const cls = `thumb-step ${i < run.step ? 'thumb-step--done' : i === run.step ? 'thumb-step--now' : ''}`;
                if (st.t === 'key') return <span key={i} className={`${cls} thumb-step--key`}>{st.name}</span>;
                if (st.t === 'en') {
                  const p = i < run.step ? st.text.length : i === run.step ? run.pos : 0;
                  return <span key={i} className={cls}><b><span className="thumb-typed">{st.text.slice(0, p)}</span>{st.text.slice(p)}</b><small>英数</small></span>;
                }
                const [typed, rest] = i === run.step && run.rs ? aheadOf(run.rs) : ['', ''];
                return (
                  <span key={i} className={cls}>
                    <b>{st.text}</b>
                    <small>{st.kana}</small>
                    {i === run.step && <small className="thumb-romaji"><span className="thumb-typed">{typed}</span>{rest}</small>}
                  </span>
                );
              })}
            </div>
            <input ref={inputRef} className="thumb-input" placeholder="ここに入力されます" autoComplete="off" spellCheck={false}
              onKeyDown={e => onKey(e.nativeEvent)} />
            <p className="sym-practice__how">
              {way ? finder.describe(way) : target ? `${nameOf(target)}のキーがキー配列に見つかりません` : ''}
            </p>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="typing-game__center">
            <p className={`trial-verdict ${result.acc >= trial.pass ? 'trial-verdict--pass' : 'trial-verdict--fail'}`}>{result.acc >= trial.pass ? '合格' : '不合格'}</p>
            <div className="typing-game__result">
              <span>正しく押せた回数</span><b>{result.ok} 回</b>
              <span>間違い</span><b>{result.miss} 回</b>
              <span>かかった時間</span><b>{Math.round(result.ms / 1000)} 秒</b>
              <span>正確さ</span><b>{result.acc}%（合格 {trial.pass}%）</b>
            </div>
            <div className="typing-game__again">
              <button className="btn btn--primary typing-game__start" onClick={start}>もう一度</button>
              <button className="btn typing-game__start" onClick={trial.onExit}>試練の一覧へ</button>
            </div>
          </div>
        )}
      </div>

      <p className={`typing-game__msg ${phase === 'play' && run.msg ? 'typing-game__msg--warn' : ''}`}>
        {phase === 'play' && run.msg ? `⚠ ${run.msg}` : ' '}
      </p>

      <div className="sym-practice__board">
        <div className="sym-practice__layer">
          {hasHeat ? '今回間違えたキー' : `レイヤー${showLayer}を表示中`}
          {hasHeat && <span className="sym-practice__legend">少ない{[1, 2, 3, 4].map(l => <span key={l} className={`sym-heat sym-heat--${l}`} />)}多い</span>}
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
    </div>
  );
}

// 日本語入力でBackspaceを1回押した時の戻り方: 打ちかけのローマ字があれば1文字、無ければかな1つ
function backOne(rs: RomajiState, hist: RomajiState[]): RomajiState {
  if (rs.buf) return { ...rs, buf: rs.buf.slice(0, -1) };
  for (let i = hist.length - 1; i >= 0; i--) if (hist[i].idx === rs.idx - 1 && hist[i].buf === '') return hist[i];
  return rs.idx > 0 ? { ...rs, idx: rs.idx - 1, buf: '' } : rs;
}
