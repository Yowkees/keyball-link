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
    key: 'letters', kind: 'sym', course: 'letters', pass: 95, name: '縦の道', desc: '縦に並んだキーを含む日本語',
    intro: 'さあ行くぞい！Keyballのキーは縦にまっすぐ並んでおるのじゃ！指を縦にシュッと動かすのじゃ！B・N・T・Yあたりは迷いやすいぞ！日本語はローマ字で、気合いを入れて打つのじゃ！',
    clear: 'わっはっは！見事じゃ見事じゃ！指が縦の道を覚えてきおったわい！次は親指の番じゃ！',
  },
  {
    key: 'thumb', kind: 'sym', course: 'thumb', pass: 95, name: '親指の目覚め', desc: '日本語の文をスペースとEnterで区切る',
    intro: '親指を鳴らせぃ！スペースとEnterは親指の役目じゃ！言葉の間はスペース、最後はEnter（⏎）でビシッと締めるのじゃ！親指こそKeyballの要なんじゃぞ！',
    clear: 'おおっ、親指が目覚めおった！よいぞよいぞ！ここからが本番じゃ、レイヤーの向こうへ突き進むのじゃ！',
  },
  {
    key: 'num', kind: 'sym', course: 'num', pass: 95, name: '数の門', desc: '日付・時刻・金額の入った日本語',
    intro: '数字はレイヤーの向こうに隠れておるのじゃ！光るキーを目印に、レイヤーキーを押したまま打つのじゃ！覚えた数字には、もう光はいらんぞい！',
    clear: 'よっしゃあ！数の門が開いたぞい！じゃが油断するでないぞ、本当の迷宮はこの先じゃ！',
  },
  {
    key: 'sym', kind: 'sym', course: 'jsym', pass: 95, name: '記号の迷宮', desc: '「」？！（）などの入った日本語',
    intro: 'ここが記号の迷宮じゃ！多くの者がここで迷って去っていったわい。じゃが、おぬしなら大丈夫じゃ！迷ったら光が道を教えてくれる、ドーンと行くのじゃ！',
    clear: 'わっはっは！迷宮を抜けおった！おぬしの指は、もう記号の在りかを知っておるぞ！',
  },
  {
    key: 'real', kind: 'sym', course: 'real', pass: 95, name: '真の言葉', desc: 'メールアドレス・URLの入った日本語',
    intro: 'メールアドレスにURL、日付まで入った真の言葉じゃ！これまでの全てをぶつけてくるのじゃ！',
    clear: 'すばらしい！真の言葉を操れるようになったのう！残るは最後の試練だけじゃ、燃えてきたわい！',
  },
  {
    key: 'cards', kind: 'cards', level: 'normal', name: '球と鍵の舞', desc: 'ボールで狙ってキーで打つ',
    intro: 'いよいよ最後の試練じゃあ！動く札をボールで狙って、キーで打ち抜くのじゃ！手を離さず、球と鍵の両方を操るのじゃぞ！ライフが尽きる前に全部打ち終えるのじゃ！',
    clear: 'うおおお！六つの試練を全部越えおった！おぬしこそ真のKeyballの使い手じゃ！わしも鼻が高いわい！これからは修行の間でどんどん腕を磨くのじゃ！',
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
      : t.kind === 'cards' ? '惜しい惜しい！ボールで狙って、キーで打つ！その行き来に慣れるまで、何度でもかかってくるのじゃ！'
      : `なんのなんの！誰でも最初はここでつまずくもんじゃ！正確さ${t.pass}%で合格じゃ、もう一回かかってくるのじゃ！`);
  };

  // 今の画面での神のセリフ
  const line = said ?? (
    screen.type === 'trial' ? TRIALS[screen.i].intro
    : screen.type === 'free' ? 'ここは修行の間じゃ！好きなだけ指を鍛えるのじゃ！赤いキーが苦手なキーじゃぞ！'
    : clearedCount === TRIALS.length ? TRIALS[TRIALS.length - 1].clear
    : clearedCount === 0 ? 'わっはっは！よう来たのう！わしはKeyballの神じゃ！この小さな鍵盤を使いこなしたいなら、六つの試練を越えてみせるのじゃ！なあに、指は必ず覚える！さあ、始めるぞい！'
    : `おお、待っておったぞ！次は第${NUMS[clearedCount]}の試練「${TRIALS[clearedCount].name}」じゃ！いざ勝負！`
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
