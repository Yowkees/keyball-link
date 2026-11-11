import { translate, translateLabel } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useState } from 'react';
import { KEYCODES, KEYCODE_GROUPS, findKeycode } from '../../lib/keycodes';
import type { KeycodeEntry } from '../../lib/keycodes';
import { makeModTapKeycode, MOD_TAP_MODS, makeLtKeycode, getLayerTapLayers } from '../../lib/protocol';

interface KeyPickerProps {
  currentCode: number;
  onSelect: (keycode: number) => void;
  layerCount?: number;
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
            {translateLabel(g)}
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
      <p className="mt-builder__desc">{translate(TextKey.KeyPickerTapSendsANormalKeyHolding)}</p>
      <div className="mt-builder__row">
        <label>{translate(TextKey.KeyPickerModifierWhenHeld)}</label>
        <select value={mod} onChange={e => setMod(Number(e.target.value))}>
          {MOD_TAP_MODS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__row">
        <label>{translate(TextKey.KeyConfigModalKeyWhenTapped)}</label>
        <select value={baseKc} onChange={e => setBaseKc(Number(e.target.value))}>
          <option value={0}>{translate(TextKey.KeyPickerNone)}</option>
          {TAP_KEYS.map(k => (
            <option key={k.code} value={k.code}>{k.short}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__preview">
        <span>{translate(TextKey.KeyPickerPreviewTap)}{tapLabel}{translate(TextKey.KeyPickerHold)}{modLabel}</span>
      </div>
      <button
        className="btn btn--primary mt-builder__set"
        disabled={baseKc === 0}
        onClick={() => onSelect(preview)}
      >{translate(TextKey.KeyPickerAssignThisModTap)}</button>
    </div>
  );
}

// Layer-Tap ビルダーパネル
function LayerTapPanel({ currentCode, onSelect, layerCount }: KeyPickerProps) {
  const isLT = currentCode >= 0x4000 && currentCode <= 0x43FF;
  const [layer, setLayer] = useState(isLT ? (currentCode >> 8) & 0x0F : 1);
  const [baseKc, setBaseKc] = useState(isLT ? currentCode & 0xFF : 0x00);
  const layerTapLayers = getLayerTapLayers(layerCount);

  const preview = makeLtKeycode(layer, baseKc);
  const tapLabel   = findKeycode(baseKc).short || '—';
  const layerLabel = layerTapLayers.find(l => l.value === layer)?.label ?? translate(TextKey.KeyConfigModalLayer, { p0: layer });

  return (
    <div className="mt-builder">
      <p className="mt-builder__desc">{translate(TextKey.KeyPickerTapSendsANormalKeyHolding2)}</p>
      <div className="mt-builder__row">
        <label>{translate(TextKey.KeyPickerLayerWhenHeld)}</label>
        <select value={layer} onChange={e => setLayer(Number(e.target.value))}>
          {layerTapLayers.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__row">
        <label>{translate(TextKey.KeyConfigModalKeyWhenTapped)}</label>
        <select value={baseKc} onChange={e => setBaseKc(Number(e.target.value))}>
          <option value={0}>{translate(TextKey.KeyPickerNone)}</option>
          {TAP_KEYS.map(k => (
            <option key={k.code} value={k.code}>{k.short}</option>
          ))}
        </select>
      </div>
      <div className="mt-builder__preview">
        <span>{translate(TextKey.KeyPickerPreviewTap)}{tapLabel}{translate(TextKey.KeyPickerHold)}{layerLabel}</span>
      </div>
      <button
        className="btn btn--primary mt-builder__set"
        disabled={baseKc === 0}
        onClick={() => onSelect(preview)}
      >{translate(TextKey.KeyPickerAssignThisLayerTap)}</button>
    </div>
  );
}

type KeyType = '通常' | 'Mod-Tap' | 'Layer-Tap';

function detectKeyType(code: number): KeyType {
  if (code >= 0x2000 && code <= 0x2FFF) return 'Mod-Tap';
  if (code >= 0x4000 && code <= 0x43FF) return 'Layer-Tap';
  return '通常';
}

export function KeyPicker({ currentCode, onSelect, layerCount }: KeyPickerProps) {
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
            {translateLabel(t)}
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
        <LayerTapPanel currentCode={currentCode} onSelect={onSelect} layerCount={layerCount} />
      )}
    </div>
  );
}
