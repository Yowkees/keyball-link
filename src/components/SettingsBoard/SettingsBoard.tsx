import { useState } from 'react';

// 設定タブ（トラックボール設定・マクロ拡張・詳細設定）の共通部品。左に項目のタブ、
// 右に選んだ項目を1枚のカードで表示する（2026-10-06〜）。
// 一時期は全項目をカードで画面いっぱいに並べる形だったが、本人判断でタブ表示に戻した。

export interface BoardCard {
  key: string;
  title: string;
  note?: string;          // タイトル横の補足
  tip?: string;           // タイトルにマウスを乗せた時の詳細説明（画面上の説明文の代わり）
  panes?: string[];       // カード内タブの見出し。2つ以上ある時だけタブを表示する
  className?: string;     // カードごとに中身の並べ方を変えたい時のクラス名
  headerRight?: React.ReactNode;  // タイトルの右端に置く部品（機能のON/OFFなど）
  render: (pane: number) => React.ReactNode;
}

function BoardCardView({ card }: { card: BoardCard }) {
  const [pane, setPane] = useState(0);
  const panes = card.panes && card.panes.length > 1 ? card.panes : null;
  return (
    <section className={`board-card ${card.className ?? ''}`} style={{ '--area': card.key } as React.CSSProperties}>
      <header className="board-card__head">
        <span className="board-card__title" data-tip={card.tip}>{card.title}</span>
        {card.note && !panes && <span className="board-card__note">{card.note}</span>}
        {card.headerRight && <div className="board-card__head-right">{card.headerRight}</div>}
        {panes && (
          <div className="board-card__tabs" role="tablist">
            {panes.map((p, i) => (
              <button
                key={p}
                role="tab"
                aria-selected={pane === i}
                className={`board-card__tab ${pane === i ? 'board-card__tab--active' : ''}`}
                onClick={() => setPane(i)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </header>
      <div className="board-card__body">{card.render(panes ? pane : 0)}</div>
    </section>
  );
}

// 左にカードの一覧（タブ）、右に選んだカードを1枚だけ大きく表示する形
// （2026-10-06〜、トラックボール設定で使用。本人希望）。カードの中身・並べ方は
// ボード表示と同じBoardCardを使う。
export function SettingsSidebarBoard({ cards }: { cards: BoardCard[] }) {
  const [selected, setSelected] = useState(cards[0]?.key);
  const active = cards.find(c => c.key === selected) ?? cards[0];
  if (!active) return null;
  return (
    <div className="board-sidebar-layout">
      <nav className="board-sidebar">
        {cards.map(c => (
          <button
            key={c.key}
            className={`board-sidebar__item ${active.key === c.key ? 'board-sidebar__item--active' : ''}`}
            onClick={() => setSelected(c.key)}
          >
            {c.title}
          </button>
        ))}
      </nav>
      <BoardCardView key={active.key} card={active} />
    </div>
  );
}
