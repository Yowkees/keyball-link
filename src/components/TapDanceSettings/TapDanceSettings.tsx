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
      <option value={0}>（なし）</option>
      {BASIC_KEYS.map(k => (
        <option key={k.code} value={k.code}>{k.label} ({k.short})</option>
      ))}
      {includeLayer && (
        <>
          <option disabled>── レイヤー ──</option>
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
      <h2>タップダンス設定</h2>
      <p className="settings-desc">
        各スロットにタップ・ホールド・ダブルタップの動作を設定します。<br />
        キーマップでキーに <strong>TD(n)</strong> を割り当てると、そのスロットの設定が使われます。
      </p>

      <div className="td-slots">
        {Array.from({ length: TD_SLOT_COUNT }, (_, idx) => {
          const slot = slots[idx] ?? { tap: 0, hold: 0, dtap: 0, flags: 0 };
          const tapLabel  = slot.tap  ? findKeycode(slot.tap).short  : '—';
          const holdLabel = slot.hold ? findKeycode(slot.hold).short : '—';

          return (
            <div key={idx} className="td-slot">
              <div className="td-slot__header">
                <span className="td-slot__label">TD({idx})</span>
                <span className="td-slot__summary">
                  タップ:{tapLabel} / ホールド:{holdLabel}
                </span>
                {onAssignToKey && (
                  <button
                    className="btn btn--sm"
                    onClick={() => onAssignToKey(makeTdKeycode(idx))}
                    title="選択中のキーにこのスロットを割り当てる"
                  >
                    選択キーに割り当て
                  </button>
                )}
              </div>

              <div className="td-slot__body">
                <label className="td-row">
                  <span>タップ（1回押し）</span>
                  <KeycodeSelect
                    value={slot.tap}
                    onChange={v => handleChange(idx, { tap: v })}
                  />
                </label>
                <label className="td-row">
                  <span>ホールド（長押し）</span>
                  <KeycodeSelect
                    value={slot.hold}
                    onChange={v => handleChange(idx, { hold: v })}
                    includeLayer
                  />
                </label>
                <label className="td-row">
                  <span>ダブルタップ（2回押し）</span>
                  <KeycodeSelect
                    value={slot.dtap}
                    onChange={v => handleChange(idx, { dtap: v })}
                  />
                </label>
                {saving === idx && <span className="td-saving">保存中…</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
