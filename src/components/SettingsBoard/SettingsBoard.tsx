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
  className?: string;     // カードごとに中身の並べ方を変えたい時のクラス名
  headerRight?: React.ReactNode;  // タイトルの右端に置く部品（機能のON/OFFなど）
  render: (pane: number) => React.ReactNode;
}

interface SettingsBoardProps {
  cards: BoardCard[];
  areas?: string[];       // grid-template-areasの各行（例: 'ball scroll gesture aml'）
  // areasの代わりに「縦の列」ごとにカードを上から積む配置（各列の最後のカードが残りの高さを使う）。
  // 列ごとにカードの高さを自由に変えられるので、格子では高さが揃わない時に使う。
  stacks?: string[][];
  columns: string;        // grid-template-columns（例: '1fr 1fr 1.25fr 1fr'）
  fallback?: Record<string, string>;  // カードが無い時に代わりに広げるカード（fillAreas参照）
  rows?: string;          // grid-template-rows（省略時は全段同じ高さ）
}

// areasのうち、cardsに無い名前（ファームが非対応・未接続などでカードが出ない時）を
// 1マスずつ埋めて、格子に穴が空かないようにする。候補の優先順は
// fallbackで指定した名前（の連鎖）→ 下のマス → 上のマス → 左のマス → 右のマス。
// ※ grid-template-areasは各名前が長方形でないと無効になるため、配置を決める時は
//   この順で埋めても長方形のままになるようにする（必要ならfallbackで指定する）。
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
  const at = (x: number, y: number) => {
    const n = rows[y]?.[x];
    return n && present.has(n) ? n : undefined;
  };
  const out = rows.map((row, y) => row.map((name, x) => {
    if (present.has(name)) return name;
    return resolve(name) ?? at(x, y + 1) ?? at(x, y - 1) ?? at(x - 1, y) ?? at(x + 1, y) ?? '.';
  }));
  return out.map(r => r.join(' '));
}

export function SettingsBoard({ cards, areas = [], stacks, columns, fallback = {}, rows }: SettingsBoardProps) {
  if (stacks) {
    const byKey = new Map(cards.map(c => [c.key, c]));
    return (
      <div className="settings-board settings-board--fit settings-board--stacks" style={{ '--board-cols': columns } as React.CSSProperties}>
        {stacks.map((keys, i) => {
          const list = keys.map(k => byKey.get(k)).filter((c): c is BoardCard => !!c);
          if (list.length === 0) return null;
          return (
            <div key={i} className="board-stack">
              {list.map(c => <BoardCardView key={c.key} card={c} />)}
            </div>
          );
        })}
      </div>
    );
  }
  const filled = fillAreas(areas, new Set(cards.map(c => c.key)), fallback);
  const style = {
    '--board-areas': filled.map(r => `"${r}"`).join(' '),
    '--board-cols': columns,
    '--board-rows': rows ?? `repeat(${filled.length}, minmax(0, 1fr))`,
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
    <section className={`board-card ${card.className ?? ''}`} style={{ '--area': card.key } as React.CSSProperties}>
      <header className="board-card__head">
        <span className="board-card__title">{card.title}</span>
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
