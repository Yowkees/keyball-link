import { useState } from 'react';
import type { ComboSlot } from '../../lib/protocol';
import { COMBO_SLOT_COUNT, COMBO_MAX_KEYS, emptyComboSlot } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';
import { ToggleRow } from '../SettingsControls/SettingsControls';

interface ComboSectionProps {
  comboSlots: ComboSlot[] | null;   // null = 非対応ファーム
  comboEnabled: boolean;
  onComboEnabledChange: (v: boolean) => Promise<void>;
  onComboSlotChange: (idx: number, slot: ComboSlot) => Promise<void>;
  keyLayout: KeyLayout;
  disabled: boolean;
}

export function ComboSection({ comboSlots, comboEnabled, onComboEnabledChange, onComboSlotChange, keyLayout, disabled }: ComboSectionProps) {
  const [editCombo, setEditCombo] = useState<{ idx: number; field: number | 'output' } | null>(null);

  return (
    <>
      <ToggleRow
        label="コンボを有効化"
        desc=""
        checked={comboEnabled} disabled={disabled}
        onChange={onComboEnabledChange}
      />
      {comboSlots ? (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p className="settings-desc">同時押しするキー（2〜4個）と発動するキーを設定します。</p>
          {Array.from({ length: COMBO_SLOT_COUNT }, (_, idx) => {
            const slot = comboSlots[idx] ?? emptyComboSlot();
            return (
              <div key={idx} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="settings-unit" style={{ minWidth: 20 }}>{idx + 1}.</span>
                {Array.from({ length: COMBO_MAX_KEYS }, (_, k) => (
                  <button key={k} className="gesture-key-btn" disabled={disabled} onClick={() => setEditCombo({ idx, field: k })}>
                    {slot.keys[k] ? getKeyDisplayLabel(slot.keys[k], keyLayout) : '—'}
                  </button>
                ))}
                <span>→</span>
                <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditCombo({ idx, field: 'output' })}>
                  {slot.keycode ? getKeyDisplayLabel(slot.keycode, keyLayout) : '未設定'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="settings-desc" style={{ marginTop: 8 }}>このファーム（機種・バージョン）はコンボの編集に非対応です。</p>
      )}

      {editCombo && comboSlots && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={editCombo.field === 'output' ? comboSlots[editCombo.idx].keycode : comboSlots[editCombo.idx].keys[editCombo.field]}
          keyLayout={keyLayout}
          defaultPanel="カスタム"
          hideHold
          onSelect={async (kc) => {
            const slot = comboSlots[editCombo.idx];
            const updated: ComboSlot = editCombo.field === 'output'
              ? { ...slot, keycode: kc }
              : { ...slot, keys: slot.keys.map((k, i) => (i === editCombo.field ? kc : k)) };
            await onComboSlotChange(editCombo.idx, updated);
            setEditCombo(null);
          }}
          onClose={() => setEditCombo(null)}
        />
      )}
    </>
  );
}
