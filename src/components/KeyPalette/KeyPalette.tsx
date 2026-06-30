import { useState } from 'react';
import { KEYCODES, getKeyDisplayLabel, isKeycodeUnavailable, FW_ALL_AVAILABLE } from '../../lib/keycodes';
import type { KeycodeEntry, KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import { FIRMWARE_FEATURES } from '../../lib/firmwareFeatures';

interface KeyPaletteProps {
  keyLayout: KeyLayout;
  avail?: FirmwareAvail;  // 接続中ファームで使えない機能のキーをグレーアウト
}

// カテゴリ定義（KeyConfigModalと同じ分類）
const CATEGORIES: { label: string; groups: string[] }[] = [
  { label: '文字/数字',  groups: ['文字', '数字'] },
  { label: '記号',       groups: ['記号', 'Shift記号', 'JIS記号'] },
  { label: '操作',       groups: ['基本', '修飾', '矢印', 'システム'] },
  { label: 'F/テンキー', groups: ['F', 'テンキー'] },
  { label: '日本語',     groups: ['日本語'] },
  { label: 'レイヤー',   groups: FIRMWARE_FEATURES.tapDance ? ['レイヤー', 'ワンショット', 'タップダンス'] : ['レイヤー', 'ワンショット'] },
  { label: 'マウス',     groups: ['マウス'] },
  { label: 'メディア',   groups: ['メディア'] },
  { label: 'RGB',        groups: ['RGB'] },
  { label: 'Keyball',    groups: ['Keyball'] },
  { label: 'マクロ',     groups: ['マクロ'] },
  { label: '特殊',       groups: ['特殊'] },
];

export function KeyPalette({ keyLayout, avail = FW_ALL_AVAILABLE }: KeyPaletteProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('文字/数字');
  const [search, setSearch] = useState('');

  const cat = CATEGORIES.find(c => c.label === activeCategory);
  const filtered = KEYCODES.filter((k: KeycodeEntry) => {
    if (k.group === 'タップダンス' && !FIRMWARE_FEATURES.tapDance) return false;
    if (k.layout && k.layout !== keyLayout) return false;
    if (search) {
      const q = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q) || k.label.toLowerCase().includes(q);
    }
    return cat ? cat.groups.includes(k.group) : true;
  });

  return (
    <div className={`key-palette ${open ? 'key-palette--open' : ''}`}>
      <button className="key-palette__header" onClick={() => setOpen(o => !o)}>
        <span className="key-palette__title">
          キーをドラッグして配置
          <span className="settings-unit">下のキーを上の配列にドラッグ&ドロップで設定できます</span>
        </span>
        <span className="collapsible-card__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="key-palette__body">
          <div className="modal-search">
            <input
              className="modal-search__input" type="text" placeholder="キーを検索…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          {!search && (
            <div className="modal-panel__tabs">
              {CATEGORIES.map(c => (
                <button
                  key={c.label}
                  className={`tab ${activeCategory === c.label ? 'tab--active' : ''}`}
                  onClick={() => setActiveCategory(c.label)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <div className="key-palette__grid">
            {filtered.map(k => {
              const unavail = isKeycodeUnavailable(k, avail);
              return (
                <button
                  key={k.code}
                  className={`picker-key ${unavail ? 'picker-key--dim' : ''}`}
                  draggable={!unavail}
                  onDragStart={ev => { if (unavail) { ev.preventDefault(); return; } ev.dataTransfer.setData('text/plain', String(k.code)); }}
                  title={unavail
                    ? `${k.short} — このファーム版では使用できません`
                    : `${k.short} (0x${k.code.toString(16).toUpperCase()}) — ドラッグして配置`}
                >
                  <span className="picker-key__char">{getKeyDisplayLabel(k.code, keyLayout)}</span>
                  <span className="picker-key__name">{k.short}</span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="picker-empty">一致するキーが見つかりません</p>}
          </div>
        </div>
      )}
    </div>
  );
}
