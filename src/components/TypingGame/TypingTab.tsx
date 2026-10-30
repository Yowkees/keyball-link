import { useState, type ComponentProps } from 'react';
import { TypingGame, type Level } from './TypingGame';
import { SymbolPractice, type Course } from './SymbolPractice';

// タイピングゲームのタブ（2026-10-30、本人希望で作り直し）。
// 「Keyballの神」から6つの試練を受け、1つずつ合格していく。試練は、Keyballに慣れるまでに
// つまずきやすい順（縦に並んだキー → 親指キー → 数字 → 記号 → 実際の文 → ボールとキーの行き来）。
// 前の試練に合格すると次に挑戦できる。合格した後も、修行の間（自由練習）でいつでも練習できる。

type Trial = {
  key: string;
  name: string;
  desc: string;
  intro: string;   // 挑戦前の神のセリフ
  clear: string;   // 合格した時の神のセリフ
} & ({ kind: 'sym'; course: Course; pass: number } | { kind: 'cards'; level: Level });

const TRIALS: Trial[] = [
  {
    key: 'letters', kind: 'sym', course: 'letters', pass: 90, name: '縦の道', desc: '縦に並んだキーに指を慣らす',
    intro: 'Keyballのキーは縦にまっすぐ並んでおる。まずは指を縦に動かすことを覚えよ。B・N・T・Yなど、迷いやすいキーを含む言葉を打つのだ。',
    clear: '見事だ。指が縦の道を覚え始めておる。次は親指の番じゃ。',
  },
  {
    key: 'thumb', kind: 'sym', course: 'thumb', pass: 90, name: '親指の目覚め', desc: 'スペースとEnterを親指で',
    intro: 'スペースとEnterは親指の役目。言葉の間はスペース、最後はEnter（⏎）で締めよ。親指こそKeyballの要じゃ。',
    clear: '親指が目覚めたな。ここからが本当の試練。レイヤーの向こうへ進むぞ。',
  },
  {
    key: 'num', kind: 'sym', course: 'num', pass: 90, name: '数の門', desc: 'レイヤーにある数字',
    intro: '数字はレイヤーの向こうにある。光るキーを頼りに、レイヤーキーを押したまま打て。覚えた数字には、もう光はいらぬ。',
    clear: '数の門は開かれた。だが、真の迷宮はこの先にある。',
  },
  {
    key: 'sym', kind: 'sym', course: 'sym', pass: 90, name: '記号の迷宮', desc: 'よく使う記号12個',
    intro: '記号の迷宮。多くの者がここで迷い、Keyballを去った。だが恐れるな。迷えば光が道を示す。',
    clear: '迷宮を抜けたか。汝の指は、もう記号の在りかを知っておる。',
  },
  {
    key: 'real', kind: 'sym', course: 'real', pass: 90, name: '真の言葉', desc: 'メールアドレス・URL・コード',
    intro: 'メールアドレス、URL、コード。日々使う真の言葉で、これまでの全てを試す。',
    clear: '真の言葉を操れるようになったな。残るは最後の試練のみ。',
  },
  {
    key: 'cards', kind: 'cards', level: 'normal', name: '球と鍵の舞', desc: 'ボールで狙ってキーで打つ',
    intro: '最後の試練だ。動く札をボールで狙い、キーで打て。手を離さず、球と鍵の両方を操るのだ。ライフが尽きる前に全ての言葉を打ち終えよ。',
    clear: '六つの試練、全て越えたか。汝こそ真のKeyballの使い手。これからは修行の間で腕を磨くがよい。',
  },
];
const NUMS = ['一', '二', '三', '四', '五', '六'];
const PROGRESS_KEY = 'keyballTrials';

type Progress = Record<string, { cleared: boolean; best?: number }>;
function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') as Progress; } catch { return {}; }
}

type Screen = { type: 'map' } | { type: 'trial'; i: number } | { type: 'free'; mode: 'symbol' | 'cards' };

export function TypingTab(props: ComponentProps<typeof SymbolPractice>) {
  const [screen, setScreen] = useState<Screen>({ type: 'map' });
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [said, setSaid] = useState<string | null>(null);   // 試練の結果に対する神のセリフ（画面を移ると消える）
  const unlocked = (i: number) => i === 0 || !!progress[TRIALS[i - 1].key]?.cleared;
  const clearedCount = TRIALS.filter(t => progress[t.key]?.cleared).length;

  const go = (s: Screen) => { setScreen(s); setSaid(null); };

  const done = (i: number, passed: boolean, acc?: number) => {
    const t = TRIALS[i], prev = progress[t.key];
    const next: Progress = {
      ...progress,
      [t.key]: { cleared: !!prev?.cleared || passed, best: acc === undefined ? prev?.best : Math.max(prev?.best ?? 0, acc) },
    };
    setProgress(next);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* 保存できなくても遊べる */ }
    setSaid(passed ? t.clear
      : t.kind === 'cards' ? '焦るでない。ボールで狙い、キーで打つ。その行き来に慣れるまで、何度でも挑むがよい。'
      : `恐れることはない。誰もが最初はここでつまずく。正確さ${t.pass}%で合格じゃ。もう一度来るがよい。`);
  };

  // 今の画面での神のセリフ
  const line = said ?? (
    screen.type === 'trial' ? TRIALS[screen.i].intro
    : screen.type === 'free' ? '修行の間じゃ。好きなだけ指を鍛えるがよい。'
    : clearedCount === TRIALS.length ? TRIALS[TRIALS.length - 1].clear
    : clearedCount === 0 ? 'よく来た。我はKeyballの神。この小さき鍵盤を使いこなしたくば、六つの試練を越えてみせよ。焦らずともよい、指は必ず覚える。'
    : `よくぞ戻った。次は第${NUMS[clearedCount]}の試練「${TRIALS[clearedCount].name}」じゃ。`
  );

  return (
    <div className="typing-tab">
      <div className="trial-god">
        <img className="trial-god__face" src="/typing/keyball-god.jpg" alt="Keyballの神" />
        <div className="trial-god__bubble">
          <span className="trial-god__name">Keyballの神</span>
          <p key={line} className="trial-god__line">{line}</p>
        </div>
      </div>

      {screen.type === 'map' && (
        <>
          <div className="trial-map">
            {TRIALS.map((t, i) => {
              const p = progress[t.key], open = unlocked(i);
              return (
                <button
                  key={t.key}
                  type="button"
                  className={`trial-card ${p?.cleared ? 'trial-card--cleared' : ''} ${!open ? 'trial-card--locked' : ''}`}
                  disabled={!open}
                  onClick={() => go({ type: 'trial', i })}
                >
                  <span className="trial-card__no">第{NUMS[i]}の試練</span>
                  <b className="trial-card__name">{t.name}</b>
                  <span className="trial-card__desc">{t.desc}</span>
                  <span className="trial-card__state">
                    {p?.cleared ? `合格${p.best !== undefined ? `（最高 ${p.best}%）` : ''}` : open ? '挑戦できる' : '前の試練に合格すると挑戦できる'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="trial-free">
            <span className="trial-free__title">修行の間（自由練習）</span>
            <button type="button" className="btn" onClick={() => go({ type: 'free', mode: 'symbol' })}>記号・数字の練習</button>
            <button type="button" className="btn" onClick={() => go({ type: 'free', mode: 'cards' })}>カードゲーム（ボールで狙って打つ）</button>
          </div>
        </>
      )}

      {screen.type === 'trial' && (() => {
        const i = screen.i, t = TRIALS[i];
        const common = { title: `第${NUMS[i]}の試練「${t.name}」`, intro: t.desc, onExit: () => go({ type: 'map' }) };
        return t.kind === 'cards'
          ? <TypingGame key={t.key} trial={{ ...common, level: t.level, onDone: r => done(i, r.passed) }} />
          : <SymbolPractice key={t.key} {...props} trial={{ ...common, course: t.course, pass: t.pass, onDone: r => done(i, r.passed, r.acc) }} />;
      })()}

      {screen.type === 'free' && (
        <>
          <button type="button" className="btn trial-back" onClick={() => go({ type: 'map' })}>← 試練の一覧へ</button>
          {screen.mode === 'symbol' ? <SymbolPractice {...props} /> : <TypingGame />}
        </>
      )}
    </div>
  );
}
