import { useState, useEffect } from 'react';
import { KEYCODES, findKeycode, getKeyDisplayLabel, JIS_TAP_KEYS } from '../../lib/keycodes';
import type { KeycodeEntry, KeyLayout } from '../../lib/keycodes';
import {
  makeModTapKeycode, MOD_TAP_MODS, makeLtKeycode, LAYER_TAP_LAYERS,
  makeModsKeycode, MODIFIER_BITS, MOD_RIGHT_BIT,
} from '../../lib/protocol';
import { FIRMWARE_FEATURES } from '../../lib/firmwareFeatures';

export type PanelType = '通常' | 'ホールド' | 'カスタム';

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

// 修飾と組み合わせ可能な基本キー（0xFF以下）かどうか
function isBasicKey(code: number): boolean {
  return code > 0 && code <= 0xFF;
}

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

// ── タップキーピッカー（ホールドタブのタップ側で使用） ──────
function TapKeyPicker({ value, keyLayout, onChange }: {
  value: number;
  keyLayout: KeyLayout;
  onChange: (kc: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('すべて');

  const groups = ['すべて', ...TAP_KEY_GROUPS.map(g => g.label)];
  const allKeys = TAP_KEY_GROUPS.flatMap(g => g.keys.map(k => ({ ...k, groupLabel: g.label })));

  const filtered = allKeys.filter(k => {
    if (activeGroup !== 'すべて' && k.groupLabel !== activeGroup) return false;
    if (search) {
      const q = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="tap-picker">
      <div className="tap-picker__search-wrap">
        <input
          className="modal-search__input" type="text" placeholder="キーを検索…"
          value={search} onChange={e => { setSearch(e.target.value); setActiveGroup('すべて'); }}
        />
        {search && <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>}
      </div>
      {!search && (
        <div className="tap-picker__tabs">
          {groups.map(g => (
            <button key={g} className={`tab ${activeGroup === g ? 'tab--active' : ''}`} onClick={() => setActiveGroup(g)}>{g}</button>
          ))}
        </div>
      )}
      <div className="tap-picker__grid">
        <button className={`picker-key ${value === 0 ? 'picker-key--current' : ''}`} onClick={() => onChange(0)} title="なし">
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
        {filtered.length === 0 && <p className="picker-empty">一致するキーが見つかりません</p>}
      </div>
    </div>
  );
}

// ── 通常キーパネル（修飾キー付加対応） ────────────────────
function NormalPanel({ currentCode, keyLayout, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  onSelect: (c: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [search, setSearch] = useState('');
  // 現在のコードがMODSなら修飾を復元
  const isMods = currentCode >= 0x0100 && currentCode <= 0x1FFF;
  const [mods, setMods] = useState(isMods ? (currentCode >> 8) & 0x1F : 0);

  const baseKeys = KEYCODES.filter(k => k.group !== 'タップダンス' || FIRMWARE_FEATURES.tapDance);

  const filtered = baseKeys.filter(k => {
    if (activeCategory !== 'すべて') {
      const cat = GROUP_CATEGORIES.find(c => c.label === activeCategory);
      if (cat && cat.groups.length > 0 && !cat.groups.includes(k.group)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q) || k.label.toLowerCase().includes(q);
    }
    return true;
  });

  const right = (mods & MOD_RIGHT_BIT) !== 0;
  const toggleMod = (bit: number) => setMods(m => m ^ bit);
  const modsActive = (mods & 0x0F) !== 0;

  // キークリック時：修飾が選択されていて基本キーなら MODS、それ以外は素のコード
  const handleKey = (code: number) => {
    if (modsActive && isBasicKey(code)) {
      onSelect(makeModsKeycode(mods, code));
    } else {
      onSelect(code);
    }
  };

  const modLabel = MODIFIER_BITS.filter(m => mods & m.bit)
    .map(m => (right ? 'R' : '') + m.label).join('+');

  return (
    <>
      {/* 修飾キー付加バー */}
      <div className="mod-bar">
        <span className="mod-bar__label">修飾キーを付加:</span>
        {MODIFIER_BITS.map(m => (
          <button
            key={m.bit}
            className={`btn btn--small btn--layer ${mods & m.bit ? 'btn--layer-active' : ''}`}
            onClick={() => toggleMod(m.bit)}
          >
            {(right ? 'R' : '') + m.label}
          </button>
        ))}
        <button
          className={`btn btn--small btn--layer ${right ? 'btn--layer-active' : ''}`}
          onClick={() => toggleMod(MOD_RIGHT_BIT)}
          title="左右の修飾キーを切り替え"
        >
          右側
        </button>
        {modsActive && (
          <span className="mod-bar__hint">
            選択中: <strong>{modLabel}</strong> ＋ クリックしたキー
          </span>
        )}
      </div>

      <div className="modal-search">
        <input
          className="modal-search__input" type="text" placeholder="キーを検索…"
          value={search} onChange={e => { setSearch(e.target.value); setActiveCategory('すべて'); }}
          autoFocus
        />
        {search && <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>}
      </div>
      {!search && (
        <div className="modal-panel__tabs">
          {GROUP_CATEGORIES.map(cat => (
            <button key={cat.label} className={`tab ${activeCategory === cat.label ? 'tab--active' : ''}`} onClick={() => setActiveCategory(cat.label)}>{cat.label}</button>
          ))}
        </div>
      )}
      <div className="modal-panel__grid">
        {filtered.map((e: KeycodeEntry) => {
          const dimmed = modsActive && !isBasicKey(e.code);
          return (
            <button
              key={e.code}
              className={`picker-key ${e.code === currentCode ? 'picker-key--current' : ''} ${dimmed ? 'picker-key--dim' : ''}`}
              draggable
              onDragStart={ev => ev.dataTransfer.setData('text/plain', String(modsActive && isBasicKey(e.code) ? makeModsKeycode(mods, e.code) : e.code))}
              onClick={() => handleKey(e.code)}
              title={dimmed ? '修飾キーと組み合わせできません' : `${e.short} (0x${e.code.toString(16).toUpperCase()})`}
            >
              <span className="picker-key__char">{getKeyDisplayLabel(e.code, keyLayout)}</span>
              <span className="picker-key__name">{e.short}</span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="picker-empty">一致するキーが見つかりません</p>}
      </div>
      <p className="modal-result-count">{filtered.length} キー</p>
    </>
  );
}

// ── ホールドパネル（Mod-Tap / Layer-Tap 統合） ────────────
type HoldKind = 'mod' | 'layer';

function HoldPanel({ currentCode, keyLayout, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  onSelect: (c: number) => void;
}) {
  const isMT = currentCode >= 0x2000 && currentCode <= 0x3FFF;
  const isLT = currentCode >= 0x4000 && currentCode <= 0x43FF;

  const [kind, setKind]     = useState<HoldKind>(isLT ? 'layer' : 'mod');
  const [mod, setMod]       = useState(isMT ? (currentCode >> 8) & 0x1F : 0x02);
  const [layer, setLayer]   = useState(isLT ? (currentCode >> 8) & 0x0F : 1);
  const [baseKc, setBaseKc] = useState((isMT || isLT) ? currentCode & 0xFF : 0x00);

  const preview = kind === 'mod' ? makeModTapKeycode(mod, baseKc) : makeLtKeycode(layer, baseKc);
  const tapDisp = baseKc ? getKeyDisplayLabel(baseKc, keyLayout).replace('\n', '/') : '—';
  const holdLabel = kind === 'mod'
    ? (MOD_TAP_MODS.find(m => m.value === mod)?.label ?? `Mod(${mod})`)
    : (LAYER_TAP_LAYERS.find(l => l.value === layer)?.label ?? `レイヤー ${layer}`);

  return (
    <div className="builder-panel">
      <p className="builder-panel__desc">
        タップ → 通常キー、ホールド（長押し）→ 修飾キー または レイヤー切替 として動作します。
      </p>

      {/* ホールド時の動作カテゴリ */}
      <div className="builder-section">
        <div className="builder-section__label">ホールド時の動作</div>
        <div className="hold-kind-tabs">
          <button className={`tab ${kind === 'mod' ? 'tab--active' : ''}`} onClick={() => setKind('mod')}>修飾キー</button>
          <button className={`tab ${kind === 'layer' ? 'tab--active' : ''}`} onClick={() => setKind('layer')}>レイヤー切替</button>
        </div>
        {kind === 'mod' ? (
          <div className="builder-mod-buttons">
            {MOD_TAP_MODS.map(m => (
              <button key={m.value} className={`btn btn--layer btn--small ${mod === m.value ? 'btn--layer-active' : ''}`} onClick={() => setMod(m.value)}>{m.label}</button>
            ))}
          </div>
        ) : (
          <div className="builder-layer-buttons">
            {LAYER_TAP_LAYERS.map(l => (
              <button key={l.value} className={`btn btn--layer ${layer === l.value ? 'btn--layer-active' : ''}`} onClick={() => setLayer(l.value)}>{l.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* タップ時のキー（カテゴリ別） */}
      <div className="builder-section">
        <div className="builder-section__label">タップ時のキー</div>
        <TapKeyPicker value={baseKc} keyLayout={keyLayout} onChange={setBaseKc} />
      </div>

      <div className="builder-preview">
        タップ: <strong>{tapDisp}</strong>{' / '}ホールド: <strong>{holdLabel}</strong>
      </div>
      <button className="btn btn--primary builder-panel__set" disabled={baseKc === 0} onClick={() => onSelect(preview)}>
        この設定を適用
      </button>
    </div>
  );
}

// ── カスタムパネル（16進数手動入力） ──────────────────────
function CustomPanel({ currentCode, keyLayout, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  onSelect: (c: number) => void;
}) {
  const [text, setText] = useState('0x' + currentCode.toString(16).toUpperCase().padStart(4, '0'));

  const parsed = (() => {
    const t = text.trim().replace(/^0x/i, '');
    if (!/^[0-9a-fA-F]{1,4}$/.test(t)) return null;
    return parseInt(t, 16);
  })();

  const valid = parsed !== null && parsed >= 0 && parsed <= 0xFFFF;
  const entry = valid ? findKeycode(parsed) : null;

  return (
    <div className="builder-panel">
      <p className="builder-panel__desc">
        QMKのキーコードを16進数で直接入力します（例: <code>0x0004</code> = A、<code>0x00E1</code> = 左Shift）。
        上級者向け。一覧にないキーコードを指定したいときに使います。
      </p>

      <div className="builder-section">
        <div className="builder-section__label">キーコード（16進数）</div>
        <input
          className="modal-search__input custom-hex-input"
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="0x0004"
          spellCheck={false}
          autoFocus
        />
      </div>

      <div className="builder-preview">
        {valid && entry ? (
          <>
            解釈: <strong>{getKeyDisplayLabel(parsed, keyLayout).replace('\n', ' / ')}</strong>
            <span className="modal-title__code">（{entry.short} / 0x{parsed.toString(16).toUpperCase().padStart(4, '0')}）</span>
          </>
        ) : (
          <span style={{ color: 'var(--red)' }}>0x0000〜0xFFFF の16進数を入力してください</span>
        )}
      </div>

      <button className="btn btn--primary builder-panel__set" disabled={!valid} onClick={() => valid && onSelect(parsed)}>
        このキーコードを設定
      </button>
    </div>
  );
}

// ── メインモーダル ────────────────────────────────────────
function detectPanelType(code: number): PanelType {
  if (code >= 0x2000 && code <= 0x4FFF) return 'ホールド';  // MT / LT
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

  const entry = findKeycode(currentCode);
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
          {(['通常', 'ホールド', 'カスタム'] as PanelType[]).map(t => (
            <button key={t} className={`tab ${panel === t ? 'tab--active' : ''}`} onClick={() => setPanel(t)}>{t}</button>
          ))}
        </div>

        <div className="modal-body">
          {panel === '通常'    && <NormalPanel currentCode={currentCode} keyLayout={keyLayout} onSelect={handleSelect} />}
          {panel === 'ホールド' && <HoldPanel   currentCode={currentCode} keyLayout={keyLayout} onSelect={handleSelect} />}
          {panel === 'カスタム' && <CustomPanel currentCode={currentCode} keyLayout={keyLayout} onSelect={handleSelect} />}
        </div>
      </div>
    </div>
  );
}
