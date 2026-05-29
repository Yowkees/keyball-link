import { useState } from 'react';
import { KEYCODES, KEYCODE_GROUPS, findKeycode } from '../../lib/keycodes';
import type { KeycodeEntry } from '../../lib/keycodes';
import { makeModTapKeycode, MOD_TAP_MODS, makeLtKeycode, LAYER_TAP_LAYERS } from '../../lib/protocol';

interface KeyPickerProps {
  currentCode: number;
  onSelect: (keycode: number) => void;
}

// 通常キー選択パネル
function NormalKeyPanel({ currentCode, onSelect }: KeyPickerProps) {
  const normalGroups = KEYCODE_GROUPS.filter(g => g !== 'タップダンス');
  const [activeGroup, setActiveGroup] = useState(normalGroups[0]);
  const filtered = KEYCODES.filter(k => k.group === activeGroup);

  return (
    <>
      <div className="keypicker-panel__tabs">
        {normalGroups.map(g => (
          <button
            key={g}
            className={`tab ${activeGroup === g ? 'tab--active' : ''}`}
            onClick={() => setActiveGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="keypicker-panel__keys">
        {filtered.map((entry: KeycodeEntry) => (
          <button
            key={entry.code}
            className={`picker-key ${entry.code === currentCode ? 'picker-key--current' : ''}`}
            draggable
            onDragStart={e => e.dataTransfer.setData('text/plain', String(entry.code))}
            onClick={() => onSelect(entry.code)}
            title={entry.short}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </>
  );
}

const TAP_KEYS = KEYCODES.filter(k =>
  ['文字', '数字', '基本', '矢印', 'F', '修飾', '記号', 'Shift記号', '日本語'].includes(k.group)
);

// Mod-Tap ビルダーパネル
function ModTapPanel({ currentCode, onSelect }: KeyPickerProps) {
  const isMT = currentCode >= 0x2000 && currentCode <= 0x2FFF;
  const [mod, setMod] = useState(isMT ? (currentCode >> 8) & 0x1F : 0x02);
  const [baseKc, setBaseKc] = useState(isMT ? currentCode & 0xFF : 0x00);

  const preview = makeModTapKeycode(mod, baseKc);
  const tapLabel  = findKeycode(baseKc).short || '—';
  const modLabel  = MOD_TAP_MODS.find(m => m.value === mod)?.label ?? `Mod(${mod})`;

  return (
    <div className="mt-builder">
      <p className="mt-builder__desc">
        タップ → 通常キー / ホールド → 修飾キー として動作します。
      </p>
      <div className="mt-builder__row">
        <label>ホールド時の修飾キー</label>
        <select value={mod} onChange={e => setMod(Number(e.target.value))}>
          {MOD_TAP_MODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__row">
        <label>タップ時のキー</label>
        <select value={baseKc} onChange={e => setBaseKc(Number(e.target.value))}>
          <option value={0}>（なし）</option>
          {TAP_KEYS.map(k => (
            <option key={k.code} value={k.code}>{k.short}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__preview">
        <span>プレビュー: タップ={tapLabel} / ホールド={modLabel}</span>
      </div>
      <button
        className="btn btn--primary mt-builder__set"
        disabled={baseKc === 0}
        onClick={() => onSelect(preview)}
      >
        このMod-Tapを設定
      </button>
    </div>
  );
}

// Layer-Tap ビルダーパネル
function LayerTapPanel({ currentCode, onSelect }: KeyPickerProps) {
  const isLT = currentCode >= 0x4000 && currentCode <= 0x43FF;
  const [layer, setLayer] = useState(isLT ? (currentCode >> 8) & 0x0F : 1);
  const [baseKc, setBaseKc] = useState(isLT ? currentCode & 0xFF : 0x00);

  const preview = makeLtKeycode(layer, baseKc);
  const tapLabel   = findKeycode(baseKc).short || '—';
  const layerLabel = LAYER_TAP_LAYERS.find(l => l.value === layer)?.label ?? `レイヤー ${layer}`;

  return (
    <div className="mt-builder">
      <p className="mt-builder__desc">
        タップ → 通常キー / ホールド → レイヤー有効化 として動作します。
      </p>
      <div className="mt-builder__row">
        <label>ホールド時のレイヤー</label>
        <select value={layer} onChange={e => setLayer(Number(e.target.value))}>
          {LAYER_TAP_LAYERS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__row">
        <label>タップ時のキー</label>
        <select value={baseKc} onChange={e => setBaseKc(Number(e.target.value))}>
          <option value={0}>（なし）</option>
          {TAP_KEYS.map(k => (
            <option key={k.code} value={k.code}>{k.short}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__preview">
        <span>プレビュー: タップ={tapLabel} / ホールド={layerLabel}</span>
      </div>
      <button
        className="btn btn--primary mt-builder__set"
        disabled={baseKc === 0}
        onClick={() => onSelect(preview)}
      >
        このLayer-Tapを設定
      </button>
    </div>
  );
}

type KeyType = '通常' | 'Mod-Tap' | 'Layer-Tap';

function detectKeyType(code: number): KeyType {
  if (code >= 0x2000 && code <= 0x2FFF) return 'Mod-Tap';
  if (code >= 0x4000 && code <= 0x43FF) return 'Layer-Tap';
  return '通常';
}

export function KeyPicker({ currentCode, onSelect }: KeyPickerProps) {
  const [keyType, setKeyType] = useState<KeyType>(detectKeyType(currentCode));

  return (
    <div className="keypicker-panel">
      <div className="keypicker-panel__type-tabs">
        {(['通常', 'Mod-Tap', 'Layer-Tap'] as KeyType[]).map(t => (
          <button
            key={t}
            className={`tab ${keyType === t ? 'tab--active' : ''}`}
            onClick={() => setKeyType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {keyType === '通常' && (
        <NormalKeyPanel currentCode={currentCode} onSelect={onSelect} />
      )}
      {keyType === 'Mod-Tap' && (
        <ModTapPanel currentCode={currentCode} onSelect={onSelect} />
      )}
      {keyType === 'Layer-Tap' && (
        <LayerTapPanel currentCode={currentCode} onSelect={onSelect} />
      )}
    </div>
  );
}
