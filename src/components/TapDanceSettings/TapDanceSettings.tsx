import { translate } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useState } from 'react';
import { TD_SLOT_COUNT, makeTdKeycode } from '../../lib/protocol';
import type { TdSlot } from '../../lib/protocol';
import { findKeycode, KEYCODES } from '../../lib/keycodes';

interface TapDanceSettingsProps {
  slots: TdSlot[];
  onChangeSlot: (idx: number, slot: TdSlot) => Promise<void>;
  onAssignToKey?: (keycode: number) => void;
}

const BASIC_KEYS = KEYCODES.filter(k =>
  ['文字', '数字', '基本', '矢印', 'F', '修飾', '記号', 'Shift記号', '日本語'].includes(k.group)
);

const LAYER_KEYS = KEYCODES.filter(k => k.group === 'レイヤー');

function KeycodeSelect({ value, onChange, includeLayer }: { value: number; onChange: (v: number) => void; includeLayer?: boolean }) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="td-keycode-select"
    >
      <option value={0}>{translate(TextKey.KeyPickerNone)}</option>
      {BASIC_KEYS.map(k => (
        <option key={k.code} value={k.code}>{k.label} ({k.short})</option>
      ))}
      {includeLayer && (
        <>
          <option disabled>{translate(TextKey.TapDanceSettingsLayers)}</option>
          {LAYER_KEYS.map(k => (
            <option key={k.code} value={k.code}>{k.label} ({k.short})</option>
          ))}
        </>
      )}
    </select>
  );
}

export function TapDanceSettings({ slots, onChangeSlot, onAssignToKey }: TapDanceSettingsProps) {
  const [saving, setSaving] = useState<number | null>(null);

  const handleChange = async (idx: number, patch: Partial<TdSlot>) => {
    const current = slots[idx] ?? { tap: 0, hold: 0, dtap: 0, flags: 0 };
    const updated: TdSlot = { ...current, ...patch };
    setSaving(idx);
    try {
      await onChangeSlot(idx, updated);
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="settings-card">
      <h2>{translate(TextKey.TapDanceSettingsTapDanceSettings)}</h2>
      <p className="settings-desc">{translate(TextKey.TapDanceSettingsSetTapHoldAndDoubleTap)}<br />{translate(TextKey.TapDanceSettingsAssign)}<strong>TD(n)</strong>{translate(TextKey.TapDanceSettingsToAKeyOnTheKeymap)}</p>

      <div className="td-slots">
        {Array.from({ length: TD_SLOT_COUNT }, (_, idx) => {
          const slot = slots[idx] ?? { tap: 0, hold: 0, dtap: 0, flags: 0 };
          const tapLabel  = slot.tap  ? findKeycode(slot.tap).short  : '—';
          const holdLabel = slot.hold ? findKeycode(slot.hold).short : '—';

          return (
            <div key={idx} className="td-slot">
              <div className="td-slot__header">
                <span className="td-slot__label">TD({idx})</span>
                <span className="td-slot__summary">{translate(TextKey.KeyConfigModalTap)}{tapLabel}{translate(TextKey.TapDanceSettingsHold)}{holdLabel}
                </span>
                {onAssignToKey && (
                  <button
                    className="btn btn--sm"
                    onClick={() => onAssignToKey(makeTdKeycode(idx))}
                    title={translate(TextKey.TapDanceSettingsAssignThisSlotToTheSelected)}
                  >{translate(TextKey.TapDanceSettingsAssignToSelectedKey)}</button>
                )}
              </div>

              <div className="td-slot__body">
                <label className="td-row">
                  <span>{translate(TextKey.TapDanceSettingsTapOnePress)}</span>
                  <KeycodeSelect
                    value={slot.tap}
                    onChange={v => handleChange(idx, { tap: v })}
                  />
                </label>
                <label className="td-row">
                  <span>{translate(TextKey.TapDanceSettingsHoldLongPress)}</span>
                  <KeycodeSelect
                    value={slot.hold}
                    onChange={v => handleChange(idx, { hold: v })}
                    includeLayer
                  />
                </label>
                <label className="td-row">
                  <span>{translate(TextKey.TapDanceSettingsDoubleTapTwoPresses)}</span>
                  <KeycodeSelect
                    value={slot.dtap}
                    onChange={v => handleChange(idx, { dtap: v })}
                  />
                </label>
                {saving === idx && <span className="td-saving">{translate(TextKey.AppSaving)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
