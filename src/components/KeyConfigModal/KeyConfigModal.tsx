import { useState, useEffect } from 'react';
import { KEYCODES, KEYCODE_GROUPS, findKeycode, JIS_TAP_KEYS } from '../../lib/keycodes';
import type { KeycodeEntry } from '../../lib/keycodes';
import { makeModTapKeycode, MOD_TAP_MODS, makeLtKeycode, LAYER_TAP_LAYERS } from '../../lib/protocol';

export type PanelType = '通常' | 'Mod-Tap' | 'Layer-Tap';

interface KeyConfigModalProps {
  keyIndex: number;
  currentCode: number;
  defaultPanel?: PanelType;
  onSelect: (keycode: number) => void;
  onClose: () => void;
}

// ── 通常キーパネル ──────────────────────────────────────
function NormalPanel({ currentCode, onSelect }: { currentCode: number; onSelect: (c: number) => void }) {
  const groups = KEYCODE_GROUPS.filter(g => g !== 'タップダンス');
  const [activeGroup, setActiveGroup] = useState(groups[0]);
  const filtered = KEYCODES.filter(k => k.group === activeGroup);

  return (
    <>
      <div className="modal-panel__tabs">
        {groups.map(g => (
          <button key={g} className={`tab ${activeGroup === g ? 'tab--active' : ''}`} onClick={() => setActiveGroup(g)}>
            {g}
          </button>
        ))}
      </div>
      <div className="modal-panel__keys">
        {filtered.map((e: KeycodeEntry) => (
          <button
            key={e.code}
            className={`picker-key ${e.code === currentCode ? 'picker-key--current' : ''}`}
            draggable
            onDragStart={ev => ev.dataTransfer.setData('text/plain', String(e.code))}
            onClick={() => onSelect(e.code)}
            title={e.short}
          >
            {e.label}
          </button>
        ))}
      </div>
    </>
  );
}

// Shift記号 (0x02xx) は 0xFF を超えるため MT/LT のタップキーには使用不可
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

// ── Mod-Tapパネル ────────────────────────────────────────
function ModTapPanel({ currentCode, onSelect }: { currentCode: number; onSelect: (c: number) => void }) {
  const isMT = currentCode >= 0x2000 && currentCode <= 0x2FFF;
  const [mod, setMod] = useState(isMT ? (currentCode >> 8) & 0x1F : 0x02);
  const [baseKc, setBaseKc] = useState(isMT ? currentCode & 0xFF : 0x00);

  const preview = makeModTapKeycode(mod, baseKc);
  const tapLabel = findKeycode(baseKc).short || '—';
  const modLabel = MOD_TAP_MODS.find(m => m.value === mod)?.label ?? `Mod(${mod})`;

  return (
    <div className="mt-builder">
      <p className="mt-builder__desc">タップ → 通常キー / ホールド → 修飾キー として動作します。</p>
      <div className="mt-builder__row">
        <label>ホールド時の修飾キー</label>
        <select value={mod} onChange={e => setMod(Number(e.target.value))}>
          {MOD_TAP_MODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div className="mt-builder__row">
        <label>タップ時のキー</label>
        <select value={baseKc} onChange={e => setBaseKc(Number(e.target.value))}>
          <option value={0}>（なし）</option>
          {TAP_KEY_GROUPS.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.keys.map(k => <option key={`${g.label}/${k.code}`} value={k.code}>{k.short}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="mt-builder__preview">
        <span>プレビュー: タップ={tapLabel} / ホールド={modLabel}</span>
      </div>
      <button className="btn btn--primary mt-builder__set" disabled={baseKc === 0} onClick={() => onSelect(preview)}>
        このMod-Tapを設定
      </button>
    </div>
  );
}

// ── Layer-Tapパネル ──────────────────────────────────────
function LayerTapPanel({ currentCode, onSelect }: { currentCode: number; onSelect: (c: number) => void }) {
  const isLT = currentCode >= 0x4000 && currentCode <= 0x43FF;
  const [layer, setLayer] = useState(isLT ? (currentCode >> 8) & 0x0F : 1);
  const [baseKc, setBaseKc] = useState(isLT ? currentCode & 0xFF : 0x00);

  const preview = makeLtKeycode(layer, baseKc);
  const tapLabel = findKeycode(baseKc).short || '—';
  const layerLabel = LAYER_TAP_LAYERS.find(l => l.value === layer)?.label ?? `レイヤー ${layer}`;

  return (
    <div className="mt-builder">
      <p className="mt-builder__desc">タップ → 通常キー / ホールド → レイヤー有効化 として動作します。</p>
      <div className="mt-builder__row">
        <label>ホールド時のレイヤー</label>
        <select value={layer} onChange={e => setLayer(Number(e.target.value))}>
          {LAYER_TAP_LAYERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div className="mt-builder__row">
        <label>タップ時のキー</label>
        <select value={baseKc} onChange={e => setBaseKc(Number(e.target.value))}>
          <option value={0}>（なし）</option>
          {TAP_KEY_GROUPS.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.keys.map(k => <option key={`${g.label}/${k.code}`} value={k.code}>{k.short}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="mt-builder__preview">
        <span>プレビュー: タップ={tapLabel} / ホールド={layerLabel}</span>
      </div>
      <button className="btn btn--primary mt-builder__set" disabled={baseKc === 0} onClick={() => onSelect(preview)}>
        このLayer-Tapを設定
      </button>
    </div>
  );
}

// ── メインモーダル ────────────────────────────────────────
function detectPanelType(code: number): PanelType {
  if (code >= 0x2000 && code <= 0x2FFF) return 'Mod-Tap';
  if (code >= 0x4000 && code <= 0x43FF) return 'Layer-Tap';
  return '通常';
}

export function KeyConfigModal({
  currentCode, defaultPanel, onSelect, onClose,
}: KeyConfigModalProps) {
  const [panel, setPanel] = useState<PanelType>(defaultPanel ?? detectPanelType(currentCode));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const entry = findKeycode(currentCode);

  const handleSelect = (code: number) => {
    onSelect(code);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-header">
          <span className="modal-title">キー設定 — 現在: <strong>{entry.short}</strong></span>
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
          {panel === '通常' && <NormalPanel currentCode={currentCode} onSelect={handleSelect} />}
          {panel === 'Mod-Tap' && <ModTapPanel currentCode={currentCode} onSelect={handleSelect} />}
          {panel === 'Layer-Tap' && <LayerTapPanel currentCode={currentCode} onSelect={handleSelect} />}
        </div>
      </div>
    </div>
  );
}
