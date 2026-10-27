import { useEffect, useRef, useState } from 'react';
import { newRomaji, typeKey, isFinished, guide, type RomajiState } from './romaji';
import { pickWords, type Word } from './words';

// タイピングゲーム（2026-10-27〜、本人希望）。Keyballらしく「トラックボールで狙ってクリック →
// キーで打つ」を繰り返し、ボール操作と文字入力の行き来に慣れるためのもの。
// まずはステージ1（大きいカード）のみ。打つ言葉は日本語（ローマ字入力）と英単語を混ぜる。

const ROUND_WORDS = 10;   // 1回のゲームで打つ単語の数
const ON_FIELD = 4;       // 画面に同時に出すカードの数
const COLS = 4;           // カードを置く場所のマス目（重ならないようにマスごとに1枚）
const ROWS = 3;
const BEST_KEY = 'typingGameBest';

interface Card { id: number; word: Word; cell: number; dx: number; dy: number }
interface Result { total: number; aim: number; type: number; miss: number; clickMiss: number; keys: number }

const randomCell = (used: number[]) => {
  const free = Array.from({ length: COLS * ROWS }, (_, i) => i).filter(i => !used.includes(i));
  return free[Math.floor(Math.random() * free.length)];
};
// マスの中で少しずらして、並びが単調にならないようにする（-1〜1）
const jitter = () => Math.random() * 2 - 1;

function loadBest(): number | null {
  try { const v = localStorage.getItem(BEST_KEY); return v ? Number(v) : null; } catch { return null; }
}
function saveBest(v: number) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* 保存できなくても遊べる */ }
}
// 経過時間の計測用（イベントの中でだけ呼ぶ）
const clock = () => performance.now();
const sec = (ms: number) => (ms / 1000).toFixed(2);

export function TypingGame() {
  const [phase, setPhase] = useState<'ready' | 'play' | 'result'>('ready');
  const [queue, setQueue] = useState<Word[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);   // クリックして打っている最中のカード
  const [romaji, setRomaji] = useState<RomajiState | null>(null);
  const [missFlash, setMissFlash] = useState(0);
  const [wrongCard, setWrongCard] = useState<number | null>(null);
  const [imeWarn, setImeWarn] = useState(false);
  const [needClick, setNeedClick] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [best, setBest] = useState<number | null>(loadBest);
  const stats = useRef({ start: 0, phaseStart: 0, aim: 0, type: 0, miss: 0, clickMiss: 0, keys: 0 });
  const nextId = useRef(0);

  const start = () => {
    const words = pickWords(ROUND_WORDS);
    const first: Card[] = [];
    for (const w of words.slice(0, ON_FIELD)) {
      first.push({ id: nextId.current++, word: w, cell: randomCell(first.map(c => c.cell)), dx: jitter(), dy: jitter() });
    }
    setQueue(words.slice(ON_FIELD));
    setCards(first);
    setTargetId(first[0].id);
    setActiveId(null);
    setRomaji(null);
    setResult(null);
    setImeWarn(false);
    setNeedClick(false);
    const now = clock();
    stats.current = { start: now, phaseStart: now, aim: 0, type: 0, miss: 0, clickMiss: 0, keys: 0 };
    setPhase('play');
  };

  const clickCard = (c: Card) => {
    if (phase !== 'play' || activeId !== null) return;
    if (c.id !== targetId) {
      // 光っていないカードを押した（狙いのずれ）
      stats.current.clickMiss++;
      setWrongCard(c.id);
      setTimeout(() => setWrongCard(w => (w === c.id ? null : w)), 300);
      return;
    }
    const now = clock();
    stats.current.aim += now - stats.current.phaseStart;
    stats.current.phaseStart = now;
    setActiveId(c.id);
    setRomaji(newRomaji(c.word.kana));
    setMissFlash(0);
    setNeedClick(false);
  };

  // 1単語打ち終わった: カードを消して、残りがあれば新しいカードを出し、次に狙うカードを決める
  const finishWord = (doneId: number) => {
    const now = clock();
    stats.current.type += now - stats.current.phaseStart;
    stats.current.phaseStart = now;
    let rest = cards.filter(c => c.id !== doneId);
    if (queue.length > 0) {
      const used = cards.map(c => c.cell);   // 今消したカードの場所はすぐには使わない（同じ所に出ると狙う練習にならない）
      rest = [...rest, { id: nextId.current++, word: queue[0], cell: randomCell(used), dx: jitter(), dy: jitter() }];
      setQueue(queue.slice(1));
    }
    setCards(rest);
    setActiveId(null);
    setRomaji(null);
    if (rest.length === 0) {
      const s = stats.current;
      const total = now - s.start;
      setResult({ total, aim: s.aim / ROUND_WORDS, type: s.type / ROUND_WORDS, miss: s.miss, clickMiss: s.clickMiss, keys: s.keys });
      if (best === null || total < best) { setBest(total); saveBest(total); }
      setPhase('result');
      return;
    }
    setTargetId(rest[Math.floor(Math.random() * rest.length)].id);
  };

  useEffect(() => {
    if (phase !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { setPhase('ready'); return; }
      // 日本語入力（IME）がオンだと1文字ずつ判定できない
      if (e.isComposing || e.key === 'Process') { setImeWarn(true); e.preventDefault(); return; }
      if (e.key.length !== 1) return;
      e.preventDefault();
      setImeWarn(false);
      if (activeId === null || !romaji) { setNeedClick(true); return; }
      const next = typeKey(romaji, e.key.toLowerCase());
      if (!next) {
        stats.current.miss++;
        setMissFlash(f => f + 1);
        return;
      }
      stats.current.keys++;
      if (isFinished(next)) finishWord(activeId);
      else setRomaji(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="typing-game">
      <div className="typing-game__head">
        <span className="typing-game__title">タイピングゲーム</span>
        <span className="typing-game__stage">ステージ1</span>
        {phase === 'play' && <span className="typing-game__left">残り {cards.length + queue.length} 語</span>}
        {best !== null && <span className="typing-game__best">ベスト {sec(best)} 秒</span>}
      </div>

      <div className="typing-game__field">
        {phase === 'ready' && (
          <div className="typing-game__center">
            <p className="typing-game__lead">光っているカードをトラックボールで狙ってクリックし、出てきた言葉を打ちます。</p>
            <ul className="typing-game__rules">
              <li>日本語はローマ字で打ちます（し＝shi / si など、どの打ち方でもOK）</li>
              <li>日本語入力はオフ（英数）にしてください</li>
              <li>全部で{ROUND_WORDS}語。途中でやめる時は Esc</li>
            </ul>
            <button className="btn btn--primary typing-game__start" onClick={start}>スタート</button>
          </div>
        )}

        {phase === 'play' && cards.map(c => {
          const col = c.cell % COLS, row = Math.floor(c.cell / COLS);
          const left = ((col + 0.5 + c.dx * 0.18) / COLS) * 100;
          const top = ((row + 0.5 + c.dy * 0.15) / ROWS) * 100;
          const active = c.id === activeId;
          const [typed, rest] = active && romaji ? guide(romaji) : ['', ''];
          return (
            <button
              key={c.id}
              type="button"
              className={[
                'typing-card',
                c.id === targetId && !active ? 'typing-card--target' : '',
                active ? 'typing-card--active' : '',
                activeId !== null && !active ? 'typing-card--dim' : '',
                wrongCard === c.id ? 'typing-card--wrong' : '',
              ].join(' ')}
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => clickCard(c)}
            >
              <span className="typing-card__text">{c.word.text}</span>
              {c.word.lang === 'ja' && <span className="typing-card__kana">{c.word.kana}</span>}
              {active && (
                <span key={missFlash} className={`typing-card__romaji ${missFlash ? 'typing-card__romaji--miss' : ''}`}>
                  <span className="typing-card__typed">{typed}</span>{rest}
                </span>
              )}
            </button>
          );
        })}

        {phase === 'result' && result && (
          <div className="typing-game__center">
            <p className="typing-game__lead">おつかれさまでした</p>
            <div className="typing-game__result">
              <span>合計タイム</span><b>{sec(result.total)} 秒</b>
              <span>狙う時間（1語あたり）</span><b>{sec(result.aim)} 秒</b>
              <span>打つ時間（1語あたり）</span><b>{sec(result.type)} 秒</b>
              <span>打ち間違い</span><b>{result.miss} 回</b>
              <span>クリックの外れ</span><b>{result.clickMiss} 回</b>
              <span>正確さ</span><b>{result.keys + result.miss ? Math.round(result.keys / (result.keys + result.miss) * 100) : 100}%</b>
            </div>
            {best !== null && result.total <= best && <p className="typing-game__new">ベスト更新！</p>}
            <button className="btn btn--primary typing-game__start" onClick={start}>もう一度</button>
          </div>
        )}
      </div>

      <p className="typing-game__msg">
        {imeWarn ? '⚠ 日本語入力がオンになっています。英数に切り替えてください'
          : needClick ? '先に光っているカードをクリックしてください'
          : phase === 'play' ? (activeId === null ? '光っているカードをクリック' : '打ってください（Escでやめる）') : ' '}
      </p>
    </div>
  );
}
