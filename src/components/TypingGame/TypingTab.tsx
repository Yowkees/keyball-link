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
    intro: 'ほっほっ、Keyballのキーは縦にまっすぐ並んでおるのじゃ。まずは指を縦に動かすことを覚えるのじゃぞ。B・N・T・Yあたりは迷いやすいからのう、よく見て打つのじゃ。',
    clear: '見事じゃ！指が縦の道を覚え始めておるわい。次は親指の番じゃよ。',
  },
  {
    key: 'thumb', kind: 'sym', course: 'thumb', pass: 90, name: '親指の目覚め', desc: 'スペースとEnterを親指で',
    intro: 'スペースとEnterは親指の役目なのじゃ。言葉の間はスペース、最後はEnter（⏎）で締めるのじゃぞ。親指こそKeyballの要なんじゃ。',
    clear: 'ほう、親指が目覚めたようじゃな。ここからが本当の試練じゃ。レイヤーの向こうへ進むとしようかの。',
  },
  {
    key: 'num', kind: 'sym', course: 'num', pass: 90, name: '数の門', desc: 'レイヤーにある数字',
    intro: '数字はレイヤーの向こうにあるのじゃ。光るキーを頼りに、レイヤーキーを押したまま打つのじゃよ。覚えた数字には、もう光はいらんからのう。',
    clear: 'うむ、数の門は開かれたぞい。じゃが、本当の迷宮はこの先じゃ。',
  },
  {
    key: 'sym', kind: 'sym', course: 'sym', pass: 90, name: '記号の迷宮', desc: 'よく使う記号12個',
    intro: 'ここは記号の迷宮じゃ。多くの者がここで迷い、Keyballを去っていったのう…。じゃが恐れることはない。迷ったら光が道を教えてくれるわい。',
    clear: 'ほっほっ、迷宮を抜けおったか。おぬしの指は、もう記号の在りかを知っておるのじゃ。',
  },
  {
    key: 'real', kind: 'sym', course: 'real', pass: 90, name: '真の言葉', desc: 'メールアドレス・URL・コード',
    intro: 'メールアドレス、URL、コード。毎日使う真の言葉で、これまでの全てを試させてもらうぞい。',
    clear: '真の言葉を操れるようになったのう。残るは最後の試練だけじゃ。',
  },
  {
    key: 'cards', kind: 'cards', level: 'normal', name: '球と鍵の舞', desc: 'ボールで狙ってキーで打つ',
    intro: 'いよいよ最後の試練じゃ。動く札をボールで狙って、キーで打つのじゃ。手を離さず、球と鍵の両方を操るのじゃぞ。ライフが尽きる前に全部打ち終えるのじゃ。',
    clear: 'なんと、六つの試練を全て越えおったか！おぬしこそ真のKeyballの使い手じゃ。これからは修行の間で腕を磨くがよいぞ。',
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
      : t.kind === 'cards' ? '焦るでないぞ。ボールで狙って、キーで打つ。その行き来に慣れるまで、何度でも挑むがよいのじゃ。'
      : `なに、気にすることはないぞい。誰でも最初はここでつまずくものじゃ。正確さ${t.pass}%で合格じゃから、またおいで。`);
  };

  // 今の画面での神のセリフ
  const line = said ?? (
    screen.type === 'trial' ? TRIALS[screen.i].intro
    : screen.type === 'free' ? 'ここは修行の間じゃ。好きなだけ指を鍛えていくがよいぞ。'
    : clearedCount === TRIALS.length ? TRIALS[TRIALS.length - 1].clear
    : clearedCount === 0 ? 'ほっほっほ、よう来たのう。わしはKeyballの神じゃ。この小さな鍵盤を使いこなしたいなら、六つの試練を越えてみせるのじゃ。なに、焦らんでもよい。指は必ず覚えるからのう。'
    : `おお、よう戻ったのう。次は第${NUMS[clearedCount]}の試練「${TRIALS[clearedCount].name}」じゃよ。`
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
