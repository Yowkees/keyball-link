import { useState } from 'react';

// 設定タブ（トラックボール設定・マクロ拡張・詳細設定）で、全項目をカードにして
// 画面いっぱいに並べるための共通部品（2026-10-06、本人希望で「左に項目一覧・右に詳細」の
// サイドバー形式から変更。13〜14インチのノートPC（表示領域およそ1440×800）でスクロール
// せずに全項目が見えることが目標）。
// 背の高い項目は、カード内のタブ（panes）で中身を分けて高さを揃える。
// 配置はCSS Gridのgrid-template-areasで指定し、画面が小さい時（index.cssの
// .settings-boardのメディアクエリ参照）は配置指定を外して普通の縦並び＋スクロールに戻す。

export interface BoardCard {
  key: string;            // grid-template-areasでの名前を兼ねる（英小文字のみ）
  title: string;
  note?: string;          // タイトル横の補足（狭い時は省略される）
  panes?: string[];       // カード内タブの見出し。2つ以上ある時だけタブを表示する
  render: (pane: number) => React.ReactNode;
}

interface SettingsBoardProps {
  cards: BoardCard[];
  areas: string[];        // grid-template-areasの各行（例: 'ball scroll gesture aml'）
  columns: string;        // grid-template-columns（例: '1fr 1fr 1.25fr 1fr'）
  fallback?: Record<string, string>;  // カードが無い時に代わりに広げるカード（fillAreas参照）
}

// areasのうち、cardsに無い名前（ファームが非対応・未接続などでカードが出ない時）を
// 埋めて、格子に穴が空かないようにする。まずfallbackで指定した名前（の連鎖）を使い、
// 無ければ同じ行の隣、それも無ければ上の行の名前で埋める。
// ※ grid-template-areasは各名前が長方形でないと無効になるため、fallbackは
//   「置き換えても長方形のままになる相手」を指定すること。
function fillAreas(areas: string[], present: Set<string>, fallback: Record<string, string>): string[] {
  const rows = areas.map(r => r.trim().split(/\s+/));
  const resolve = (name: string): string | undefined => {
    const seen = new Set<string>();
    let n: string | undefined = name;
    while (n && !present.has(n) && !seen.has(n)) {
      seen.add(n);
      n = fallback[n];
    }
    return n && present.has(n) ? n : undefined;
  };
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (present.has(row[x])) continue;
      const missing = row[x];
      let repl = resolve(missing);
      for (let d = 1; d < row.length && !repl; d++) {
        if (x - d >= 0 && present.has(row[x - d])) repl = row[x - d];
        else if (x + d < row.length && present.has(row[x + d])) repl = row[x + d];
      }
      if (!repl && y > 0) repl = rows[y - 1][x];
      if (!repl) repl = '.';
      for (let i = x; i < row.length && row[i] === missing; i++) row[i] = repl;
    }
  }
  return rows.map(r => r.join(' '));
}

export function SettingsBoard({ cards, areas, columns, fallback = {} }: SettingsBoardProps) {
  const filled = fillAreas(areas, new Set(cards.map(c => c.key)), fallback);
  const style = {
    '--board-areas': filled.map(r => `"${r}"`).join(' '),
    '--board-cols': columns,
    '--board-rows': `repeat(${filled.length}, minmax(0, 1fr))`,
  } as React.CSSProperties;
  return (
    <div className="settings-board settings-board--fit" style={style}>
      {cards.map(c => <BoardCardView key={c.key} card={c} />)}
    </div>
  );
}

function BoardCardView({ card }: { card: BoardCard }) {
  const [pane, setPane] = useState(0);
  const panes = card.panes && card.panes.length > 1 ? card.panes : null;
  return (
    <section className="board-card" style={{ '--area': card.key } as React.CSSProperties}>
      <header className="board-card__head">
        <span className="board-card__title">{card.title}</span>
        {card.note && !panes && <span className="board-card__note">{card.note}</span>}
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
