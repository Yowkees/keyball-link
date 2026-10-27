import { useEffect, useRef, useState } from 'react';
import { newRomaji, typeKey, isFinished, guide, type RomajiState } from './romaji';
import { pickWords, type Word } from './words';

// タイピングゲーム（2026-10-27〜、本人希望）。Keyballらしく「トラックボールで狙ってクリック →
// キーで打つ」を繰り返し、ボール操作と文字入力の行き来に慣れるためのもの。
// 画面の中をゆっくり動くカードから好きなものを選んでクリックし、その言葉を打つ。
// 日本語は「日本語入力オフでローマ字を直接」「日本語入力オン（IME）」のどちらで打っても判定する。
// 英単語は日本語入力オフ（英数）で打つ。難易度は3段階（カードの数・速さ・大きさ・言葉の長さが変わる）。
// 正解・間違いは、文字の色・カードの光り方・揺れではっきり分かるようにする（本人希望）。

type Level = 'easy' | 'normal' | 'hard';
// words: 1回のゲームで打つ単語の数 / onField: 画面に同時に出すカードの数
// speed: カードの動く速さ（画面の幅・高さに対する％／秒） / small: カードを小さくする
const LEVELS: Record<Level, { name: string; words: number; onField: number; speed: number; small: boolean; desc: string }> = {
  easy:   { name: 'かんたん',   words: 10, onField: 3, speed: 3,  small: false, desc: '短い言葉・ゆっくり' },
  normal: { name: 'ふつう',     words: 15, onField: 5, speed: 9,  small: false, desc: 'いろいろな長さ' },
  hard:   { name: 'むずかしい', words: 20, onField: 6, speed: 15, small: true,  desc: '長い言葉・小さく速いカード' },
};
const BEST_KEY = (lv: Level) => `typingGameBest_${lv}`;
const LEVEL_KEY = 'typingGameLevel';

interface Card { id: number; word: Word }
interface Pos { x: number; y: number; vx: number; vy: number }   // 位置は画面に対する％
interface Result { total: number; aim: number; type: number; miss: number; keys: number }
interface Pop { id: number; x: number; y: number }   // 打ち終わった時に出す「クリア！」の表示

// 日本語入力の途中の文字を、読みと比べられる形にそろえる（カタカナ→ひらがな、全角英字→半角）
function normalizeIme(s: string): string {
  return s
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[ａ-ｚＡ-Ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

// 他のカードとなるべく離れた場所に、ランダムな向きで出す
function spawnPos(others: Pos[], speed: number): Pos {
  let best: Pos | null = null, bestD = -1;
  for (let i = 0; i < 12; i++) {
    const x = 14 + Math.random() * 72, y = 16 + Math.random() * 68;
    const d = Math.min(100, ...others.map(o => Math.hypot(o.x - x, o.y - y)));
    if (d > bestD) { bestD = d; best = { x, y, vx: 0, vy: 0 }; }
  }
  const a = Math.random() * Math.PI * 2;
  return { ...best!, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
}

function loadBest(lv: Level): number | null {
  try { const v = localStorage.getItem(BEST_KEY(lv)); return v ? Number(v) : null; } catch { return null; }
}
function saveBest(lv: Level, v: number) {
  try { localStorage.setItem(BEST_KEY(lv), String(v)); } catch { /* 保存できなくても遊べる */ }
}
function loadLevel(): Level {
  try { const v = localStorage.getItem(LEVEL_KEY); return v === 'easy' || v === 'hard' ? v : 'normal'; } catch { return 'normal'; }
}
// 経過時間の計測用（イベントの中でだけ呼ぶ）
const clock = () => performance.now();
const sec = (ms: number) => (ms / 1000).toFixed(2);

export function TypingGame() {
  const [phase, setPhase] = useState<'ready' | 'play' | 'result'>('ready');
  const [queue, setQueue] = useState<Word[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);   // クリックして打っている最中のカード
  const [romaji, setRomaji] = useState<RomajiState | null>(null);   // 日本語入力オフで打っている時の進み具合
  const [ime, setIme] = useState<{ ok: number; pending: string; wrong: boolean } | null>(null);  // 日本語入力オンの時
  const [missFlash, setMissFlash] = useState(0);   // 増えるたびに「間違い」の演出をやり直す
  const [okFlash, setOkFlash] = useState(0);       // 増えるたびに「正解」の演出をやり直す
  const [pops, setPops] = useState<Pop[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [level, setLevel] = useState<Level>(loadLevel);
  const [best, setBest] = useState<number | null>(() => loadBest(loadLevel()));
  const lv = LEVELS[level];
  const stats = useRef({ start: 0, phaseStart: 0, aim: 0, type: 0, miss: 0, keys: 0 });
  const nextId = useRef(0);
  const pos = useRef(new Map<number, Pos>());
  const els = useRef(new Map<number, HTMLElement>());
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<number | null>(null);
  useEffect(() => { activeRef.current = activeId; }, [activeId]);

  const active = cards.find(c => c.id === activeId) ?? null;

  // カードをゆっくり動かす（壁で跳ね返る）。打っている最中のカードは止める。
  // 毎フレームReactで描き直すと重いので、位置は要素のstyleを直接書き換える
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0, last = clock();
    const step = () => {
      const now = clock(), dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (const [id, p] of pos.current) {
        if (id !== activeRef.current) {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < 12 || p.x > 88) { p.vx = -p.vx; p.x = Math.max(12, Math.min(88, p.x)); }
          if (p.y < 14 || p.y > 86) { p.vy = -p.vy; p.y = Math.max(14, Math.min(86, p.y)); }
        }
        const el = els.current.get(id);
        if (el) { el.style.left = `${p.x}%`; el.style.top = `${p.y}%`; }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const chooseLevel = (l: Level) => {
    setLevel(l);
    setBest(loadBest(l));
    try { localStorage.setItem(LEVEL_KEY, l); } catch { /* 覚えられなくても遊べる */ }
  };

  const start = () => {
    const words = pickWords(lv.words, level);
    pos.current.clear();
    const first: Card[] = words.slice(0, lv.onField).map(w => {
      const id = nextId.current++;
      pos.current.set(id, spawnPos([...pos.current.values()], lv.speed));
      return { id, word: w };
    });
    setQueue(words.slice(lv.onField));
    setCards(first);
    setActiveId(null);
    setRomaji(null);
    setIme(null);
    setResult(null);
    setMsg(null);
    setPops([]);
    const now = clock();
    stats.current = { start: now, phaseStart: now, aim: 0, type: 0, miss: 0, keys: 0 };
    setPhase('play');
  };

  const clickCard = (c: Card) => {
    if (phase !== 'play' || c.id === activeId) { inputRef.current?.focus(); return; }
    const now = clock();
    // 狙う時間は、最初にカードを選ぶまで（打っている途中で別のカードに替えた時は数えない）
    if (activeId === null) { stats.current.aim += now - stats.current.phaseStart; stats.current.phaseStart = now; }
    setActiveId(c.id);
    activeRef.current = c.id;
    setRomaji(newRomaji(c.word.kana));
    setIme(null);
    setMissFlash(0);
    setOkFlash(0);
    setMsg(null);
    const input = inputRef.current;
    if (input) {
      // 日本語入力の変換候補の窓がカードの近くに出るよう、見えない入力欄をカードの位置へ
      const p = pos.current.get(c.id);
      if (p) { input.style.left = `${p.x}%`; input.style.top = `${p.y}%`; }
      input.value = '';
      input.focus();
    }
  };

  // 1単語打ち終わった: 「クリア」を出してカードを消し、残りがあれば新しいカードを出す
  const finishWord = (doneId: number) => {
    const now = clock();
    stats.current.type += now - stats.current.phaseStart;
    stats.current.phaseStart = now;
    const p = pos.current.get(doneId);
    if (p) {
      const pop = { id: doneId, x: p.x, y: p.y };
      setPops(ps => [...ps, pop]);
      setTimeout(() => setPops(ps => ps.filter(x => x !== pop)), 700);
    }
    pos.current.delete(doneId);
    let rest = cards.filter(c => c.id !== doneId);
    if (queue.length > 0) {
      const id = nextId.current++;
      pos.current.set(id, spawnPos([...pos.current.values()], lv.speed));
      rest = [...rest, { id, word: queue[0] }];
      setQueue(queue.slice(1));
    }
    setCards(rest);
    setActiveId(null);
    activeRef.current = null;
    setRomaji(null);
    setIme(null);
    setMsg(null);
    // 日本語入力の途中の文字が残らないように、入力欄を空にして一度外す
    const input = inputRef.current;
    if (input) { input.blur(); input.value = ''; }
    if (rest.length === 0) {
      const s = stats.current;
      const total = now - s.start;
      setResult({ total, aim: s.aim / lv.words, type: s.type / lv.words, miss: s.miss, keys: s.keys });
      if (best === null || total < best) { setBest(total); saveBest(level, total); }
      setPhase('result');
    }
  };

  const miss = () => { stats.current.miss++; setMissFlash(f => f + 1); };
  const hit = () => { stats.current.keys++; setOkFlash(f => f + 1); };

  // 日本語入力オフ（ローマ字・英字を直接）の判定
  useEffect(() => {
    if (phase !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { setPhase('ready'); return; }
      // 日本語入力オンの時は、見えない入力欄の変換前の文字（compositionupdate）で判定する
      if (e.isComposing || e.key === 'Process' || e.keyCode === 229) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
      if (!active || !romaji) { setMsg('先に打ちたいカードをクリックしてください'); return; }
      setMsg(null);
      const next = typeKey(romaji, e.key.toLowerCase());
      if (!next) { miss(); setMsg(`「${e.key}」は違います`); return; }
      hit();
      if (isFinished(next)) finishWord(active.id);
      else setRomaji(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // 日本語入力オンの判定: 変換前の文字（ひらがな＋打ちかけのローマ字）が読みの先頭と合っているか
  const onComposition = (data: string) => {
    if (!active) return;
    if (active.word.lang === 'en') { setMsg('英単語は日本語入力をオフ（英数）にして打ちます'); return; }
    const t = normalizeIme(data);
    const m = /[a-z']*$/.exec(t);
    const pending = m ? m[0] : '';
    const kana = t.slice(0, t.length - pending.length);
    const reading = active.word.kana;
    const ok = reading.startsWith(kana);
    if (!ok && !ime?.wrong) miss();
    else if (ok) hit();
    setMsg(ok ? null : '違う文字が入っています（BackSpaceで消して打ち直し）');
    if (ok && kana === reading && pending === '') { finishWord(active.id); return; }
    setIme({ ok: ok ? kana.length : 0, pending, wrong: !ok });
  };

  // 変換して確定した時（漢字にしてEnterなど）。表示と同じか読みと同じなら正解
  const onCommit = (text: string) => {
    if (!active || text === '') return;
    if (text === active.word.text || normalizeIme(text) === active.word.kana) finishWord(active.id);
    else if (active.word.lang === 'ja') { miss(); setIme(null); setMsg('違う言葉で確定されました。もう一度打ってください'); }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="typing-game">
      <div className="typing-game__head">
        <span className="typing-game__title">タイピングゲーム</span>
        {phase !== 'ready' && <span className="typing-game__stage">{lv.name}</span>}
        {phase === 'play' && <span className="typing-game__left">残り {cards.length + queue.length} 語</span>}
        {best !== null && <span className="typing-game__best">ベスト {sec(best)} 秒</span>}
      </div>

      <div className={`typing-game__field ${lv.small ? 'typing-game__field--small' : ''}`}>
        {/* 日本語入力の文字を受け取るための見えない入力欄 */}
        <input
          ref={inputRef}
          className="typing-game__input"
          aria-label="入力"
          autoComplete="off"
          onCompositionUpdate={e => onComposition(e.data)}
          onCompositionEnd={e => { if (activeRef.current !== null) onCommit(e.data); }}
          onInput={e => { if (!(e.nativeEvent as InputEvent).isComposing) e.currentTarget.value = ''; }}
        />

        {phase === 'ready' && (
          <div className="typing-game__center">
            <p className="typing-game__lead">動いているカードから好きなものをトラックボールで狙ってクリックし、その言葉を打ちます。</p>
            <ul className="typing-game__rules">
              <li>日本語は、日本語入力オン・オフどちらでも打てます（オフの時はローマ字で。し＝shi / si など、どの打ち方でもOK）</li>
              <li>英単語は日本語入力をオフ（英数）にして打ちます</li>
              <li>途中でやめる時は Esc</li>
            </ul>
            <div className="typing-game__levels">
              {(Object.keys(LEVELS) as Level[]).map(l => (
                <button key={l} type="button" className={`typing-level ${level === l ? 'typing-level--on' : ''}`} onClick={() => chooseLevel(l)}>
                  <b>{LEVELS[l].name}</b>
                  <span>{LEVELS[l].desc}・{LEVELS[l].words}語</span>
                </button>
              ))}
            </div>
            <button className="btn btn--primary typing-game__start" onClick={start}>スタート</button>
          </div>
        )}

        {phase === 'play' && cards.map(c => {
          const isActive = c.id === activeId;
          const [typed, rest] = isActive && romaji && !ime ? guide(romaji) : ['', ''];
          return (
            <button
              key={c.id}
              ref={el => {
                if (!el) { els.current.delete(c.id); return; }
                // 出た瞬間から正しい位置に置く（以後の移動はアニメーションの処理で書き換える）
                const p = pos.current.get(c.id);
                if (p && !els.current.has(c.id)) { el.style.left = `${p.x}%`; el.style.top = `${p.y}%`; }
                els.current.set(c.id, el);
              }}
              type="button"
              className={[
                'typing-card',
                isActive ? 'typing-card--active' : '',
                activeId !== null && !isActive ? 'typing-card--dim' : '',
              ].join(' ')}
              onClick={() => clickCard(c)}
            >
              {/* 間違えた時は中身が揺れて枠が赤く、正解の時は枠が一瞬明るく光る（keyを変えて演出をやり直す） */}
              {isActive && missFlash > 0 && <span key={`m${missFlash}`} className="typing-card__flash typing-card__flash--miss" />}
              {isActive && okFlash > 0 && <span key={`o${okFlash}`} className="typing-card__flash typing-card__flash--ok" />}
              <span key={isActive ? `s${missFlash}` : 's'} className={`typing-card__body ${isActive && missFlash ? 'typing-card__body--shake' : ''}`}>
                <span className="typing-card__text">{c.word.text}</span>
                {c.word.lang === 'ja' && (
                  <span className="typing-card__kana">
                    {isActive && ime ? (
                      <><span className="typing-card__typed">{c.word.kana.slice(0, ime.ok)}</span>{c.word.kana.slice(ime.ok)}</>
                    ) : c.word.kana}
                  </span>
                )}
                {isActive && (
                  <span className="typing-card__romaji">
                    {ime ? <span className={ime.wrong ? 'typing-card__wrong' : 'typing-card__typed'}>{ime.pending || ' '}</span>
                      : <>
                          <span className="typing-card__typed">{typed.slice(0, -1)}</span>
                          {/* 最後に打った文字は少し跳ねさせて、入ったことを分かりやすくする */}
                          {typed && <span key={`k${okFlash}`} className="typing-card__typed typing-card__last">{typed.slice(-1)}</span>}
                          <span className="typing-card__rest">{rest}</span>
                        </>}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {pops.map(p => (
          <span key={p.id} className="typing-pop" style={{ left: `${p.x}%`, top: `${p.y}%` }}>クリア！</span>
        ))}

        {phase === 'result' && result && (
          <div className="typing-game__center">
            <p className="typing-game__lead">おつかれさまでした</p>
            <div className="typing-game__result">
              <span>合計タイム</span><b>{sec(result.total)} 秒</b>
              <span>狙う時間（1語あたり）</span><b>{sec(result.aim)} 秒</b>
              <span>打つ時間（1語あたり）</span><b>{sec(result.type)} 秒</b>
              <span>打ち間違い</span><b>{result.miss} 回</b>
              <span>正確さ</span><b>{result.keys + result.miss ? Math.round(result.keys / (result.keys + result.miss) * 100) : 100}%</b>
            </div>
            {best !== null && result.total <= best && <p className="typing-game__new">ベスト更新！</p>}
            <div className="typing-game__again">
              <button className="btn btn--primary typing-game__start" onClick={start}>もう一度</button>
              <button className="btn typing-game__start" onClick={() => setPhase('ready')}>難易度を変える</button>
            </div>
          </div>
        )}
      </div>

      <p className={`typing-game__msg ${msg ? 'typing-game__msg--warn' : ''}`}>
        {msg ? `⚠ ${msg}`
          : phase === 'play' ? (activeId === null ? '打ちたいカードをクリック' : '打ってください（別のカードをクリックすると替えられます／Escでやめる）') : ' '}
      </p>
    </div>
  );
}
