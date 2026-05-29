import { useState, useEffect } from 'react';
import { KEYCODES, findKeycode, getKeyDisplayLabel, JIS_TAP_KEYS } from '../../lib/keycodes';
import type { KeycodeEntry, KeyLayout } from '../../lib/keycodes';
import { makeModTapKeycode, MOD_TAP_MODS, makeLtKeycode, LAYER_TAP_LAYERS } from '../../lib/protocol';
import { FIRMWARE_FEATURES } from '../../lib/firmwareFeatures';

export type PanelType = '通常' | 'Mod-Tap' | 'Layer-Tap';

interface KeyConfigModalProps {
  keyIndex: number;
  currentCode: number;
  keyLayout: KeyLayout;
  defaultPanel?: PanelType;
  onSelect: (keycode: number) => void;
  onClose: () => void;
}

// ── グループ定義 ──────────────────────────────────────────
const GROUP_CATEGORIES: { label: string; groups: string[] }[] = [
  { label: 'すべて',     groups: [] },
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

// MT/LT タップキー用グループ（基本キーコード ≤ 0xFF のみ）
const TAP_KEY_GROUPS: { label: string; keys: KeycodeEntry[] }[] = [
  { label: '文字',    keys: KEYCODES.filter(k => k.group === '文字') },
  { label: '数字',    keys: KEYCODES.filter(k => k.group === '数字') },
  { label: '基本',    keys: KEYCODES.filter(k => k.group === '基本') },
  { label: '矢印',    keys: KEYCODES.filter(k => k.group === '矢印') },
  { label: 'F',       keys: KEYCODES.filter(k => k.group === 'F') },
  { label: '修飾',    keys: KEYCODES.filter(k => k.group === '修飾') },
  { label: '記号',    keys: KEYCODES.filter(k => k.group === '記号') },
  { label: 'JIS記号', keys: JIS_TAP_KEYS },
  { label: 'マウス',  keys: KEYCODES.filter(k => k.group === 'マウス') },
  { label: '日本語',  keys: KEYCODES.filter(k => k.group === '日本語') },
];

// ── タップキーピッカー（MT/LT 共通） ─────────────────────
function TapKeyPicker({ value, keyLayout, onChange }: {
  value: number;
  keyLayout: KeyLayout;
  onChange: (kc: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('すべて');

  const groups = ['すべて', ...TAP_KEY_GROUPS.map(g => g.label)];

  const allKeys = TAP_KEY_GROUPS.flatMap(g =>
    g.keys.map(k => ({ ...k, groupLabel: g.label }))
  );

  const filtered = allKeys.filter(k => {
    if (activeGroup !== 'すべて' && k.groupLabel !== activeGroup) return false;
    if (search) {
      const q   = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="tap-picker">
      <div className="tap-picker__search-wrap">
        <input
          className="modal-search__input"
          type="text"
          placeholder="キーを検索…"
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveGroup('すべて'); }}
        />
        {search && (
          <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>
      {!search && (
        <div className="tap-picker__tabs">
          {groups.map(g => (
            <button
              key={g}
              className={`tab ${activeGroup === g ? 'tab--active' : ''}`}
              onClick={() => setActiveGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      )}
      <div className="tap-picker__grid">
        <button
          className={`picker-key ${value === 0 ? 'picker-key--current' : ''}`}
          onClick={() => onChange(0)}
          title="なし（タップキーなし）"
        >
          <span className="picker-key__char">—</span>
          <span className="picker-key__name">なし</span>
        </button>
        {filtered.map(k => (
          <button
            key={k.code}
            className={`picker-key ${k.code === value ? 'picker-key--current' : ''}`}
            onClick={() => onChange(k.code)}
            title={`${k.short} (0x${k.code.toString(16).toUpperCase()})`}
          >
            <span className="picker-key__char">{getKeyDisplayLabel(k.code, keyLayout)}</span>
            <span className="picker-key__name">{k.short}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="picker-empty">一致するキーが見つかりません</p>
        )}
      </div>
    </div>
  );
}

// ── 通常キーパネル ──────────────────────────────────────
function NormalPanel({ currentCode, keyLayout, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  onSelect: (c: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [search, setSearch] = useState('');

  const baseKeys = KEYCODES.filter(k =>
    k.group !== 'タップダンス' || FIRMWARE_FEATURES.tapDance
  );

  const filtered = baseKeys.filter(k => {
    if (activeCategory !== 'すべて') {
      const cat = GROUP_CATEGORIES.find(c => c.label === activeCategory);
      if (cat && cat.groups.length > 0 && !cat.groups.includes(k.group)) return false;
    }
    if (search) {
      const q    = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q) || k.label.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <div className="modal-search">
        <input
          className="modal-search__input"
          type="text"
          placeholder="キーを検索…"
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCategory('すべて'); }}
          autoFocus
        />
        {search && (
          <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>
      {!search && (
        <div className="modal-panel__tabs">
          {GROUP_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              className={`tab ${activeCategory === cat.label ? 'tab--active' : ''}`}
              onClick={() => setActiveCategory(cat.label)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
      <div className="modal-panel__grid">
        {filtered.map((e: KeycodeEntry) => (
          <button
            key={e.code}
            className={`picker-key ${e.code === currentCode ? 'picker-key--current' : ''}`}
            draggable
            onDragStart={ev => ev.dataTransfer.setData('text/plain', String(e.code))}
            onClick={() => onSelect(e.code)}
            title={`${e.short} (0x${e.code.toString(16).toUpperCase()})`}
          >
            <span className="picker-key__char">{getKeyDisplayLabel(e.code, keyLayout)}</span>
            <span className="picker-key__name">{e.short}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="picker-empty">一致するキーが見つかりません</p>
        )}
      </div>
      <p className="modal-result-count">{filtered.length} キー</p>
    </>
  );
}

// ── Mod-Tapパネル ────────────────────────────────────────
function ModTapPanel({ currentCode, keyLayout, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  onSelect: (c: number) => void;
}) {
  const isMT = currentCode >= 0x2000 && currentCode <= 0x3FFF;
  const [mod,    setMod]    = useState(isMT ? (currentCode >> 8) & 0x1F : 0x02);
  const [baseKc, setBaseKc] = useState(isMT ? currentCode & 0xFF : 0x00);

  const preview  = makeModTapKeycode(mod, baseKc);
  const tapDisp  = baseKc ? getKeyDisplayLabel(baseKc, keyLayout) : '—';
  const modLabel = MOD_TAP_MODS.find(m => m.value === mod)?.label ?? `Mod(${mod})`;

  return (
    <div className="builder-panel">
      <p className="builder-panel__desc">タップ → 通常キー / ホールド → 修飾キー として動作します。</p>

      <div className="builder-section">
        <div className="builder-section__label">ホールド時の修飾キー</div>
        <div className="builder-mod-buttons">
          {MOD_TAP_MODS.map(m => (
            <button
              key={m.value}
              className={`btn btn--layer btn--small ${mod === m.value ? 'btn--layer-active' : ''}`}
              onClick={() => setMod(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-section">
        <div className="builder-section__label">タップ時のキー</div>
        <TapKeyPicker value={baseKc} keyLayout={keyLayout} onChange={setBaseKc} />
      </div>

      <div className="builder-preview">
        タップ: <strong>{tapDisp.replace('\n', '/')}</strong>
        {' / '}
        ホールド: <strong>{modLabel}</strong>
      </div>
      <button
        className="btn btn--primary builder-panel__set"
        disabled={baseKc === 0}
        onClick={() => onSelect(preview)}
      >
        このMod-Tapを設定
      </button>
    </div>
  );
}

// ── Layer-Tapパネル ──────────────────────────────────────
function LayerTapPanel({ currentCode, keyLayout, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  onSelect: (c: number) => void;
}) {
  const isLT = currentCode >= 0x4000 && currentCode <= 0x43FF;
  const [layer,  setLayer]  = useState(isLT ? (currentCode >> 8) & 0x0F : 1);
  const [baseKc, setBaseKc] = useState(isLT ? currentCode & 0xFF : 0x00);

  const preview    = makeLtKeycode(layer, baseKc);
  const tapDisp    = baseKc ? getKeyDisplayLabel(baseKc, keyLayout) : '—';
  const layerLabel = LAYER_TAP_LAYERS.find(l => l.value === layer)?.label ?? `レイヤー ${layer}`;

  return (
    <div className="builder-panel">
      <p className="builder-panel__desc">タップ → 通常キー / ホールド → レイヤー有効化 として動作します。</p>

      <div className="builder-section">
        <div className="builder-section__label">ホールド時のレイヤー</div>
        <div className="builder-layer-buttons">
          {LAYER_TAP_LAYERS.map(l => (
            <button
              key={l.value}
              className={`btn btn--layer ${layer === l.value ? 'btn--layer-active' : ''}`}
              onClick={() => setLayer(l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-section">
        <div className="builder-section__label">タップ時のキー</div>
        <TapKeyPicker value={baseKc} keyLayout={keyLayout} onChange={setBaseKc} />
      </div>

      <div className="builder-preview">
        タップ: <strong>{tapDisp.replace('\n', '/')}</strong>
        {' / '}
        ホールド: <strong>{layerLabel}</strong>
      </div>
      <button
        className="btn btn--primary builder-panel__set"
        disabled={baseKc === 0}
        onClick={() => onSelect(preview)}
      >
        このLayer-Tapを設定
      </button>
    </div>
  );
}

// ── メインモーダル ────────────────────────────────────────
function detectPanelType(code: number): PanelType {
  if (code >= 0x2000 && code <= 0x3FFF) return 'Mod-Tap';
  if (code >= 0x4000 && code <= 0x43FF) return 'Layer-Tap';
  return '通常';
}

export function KeyConfigModal({
  currentCode, keyLayout, defaultPanel, onSelect, onClose,
}: KeyConfigModalProps) {
  const [panel, setPanel] = useState<PanelType>(defaultPanel ?? detectPanelType(currentCode));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const entry    = findKeycode(currentCode);
  const dispLabel = getKeyDisplayLabel(currentCode, keyLayout);

  const handleSelect = (code: number) => {
    onSelect(code);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-header">
          <span className="modal-title">
            キー設定 — 現在: <strong>{dispLabel.replace('\n', ' / ')}</strong>
            <span className="modal-title__code">({entry.short})</span>
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-type-tabs">
          {(['通常', 'Mod-Tap', 'Layer-Tap'] as PanelType[]).map(t => (
            <button key={t} className={`tab ${panel === t ? 'tab--active' : ''}`} onClick={() => setPanel(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {panel === '通常'      && <NormalPanel    currentCode={currentCode} keyLayout={keyLayout} onSelect={handleSelect} />}
          {panel === 'Mod-Tap'  && <ModTapPanel    currentCode={currentCode} keyLayout={keyLayout} onSelect={handleSelect} />}
          {panel === 'Layer-Tap'&& <LayerTapPanel  currentCode={currentCode} keyLayout={keyLayout} onSelect={handleSelect} />}
        </div>
      </div>
    </div>
  );
}
