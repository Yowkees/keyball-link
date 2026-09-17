import { useState } from 'react';
import type { TdSlot } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';

interface TapDanceSectionProps {
  tdSlots: TdSlot[];
  onTdSlotChange: (idx: number, slot: TdSlot) => Promise<void>;
  keyLayout: KeyLayout;
  disabled: boolean;
}

const EMPTY_TD: TdSlot = { tap: 0, hold: 0, dtap: 0, flags: 0 };

export function TapDanceSection({ tdSlots, onTdSlotChange, keyLayout, disabled }: TapDanceSectionProps) {
  const [editTd, setEditTd] = useState<{ idx: number; field: 'tap' | 'hold' | 'dtap' } | null>(null);

  return (
    <>
      <p className="settings-desc">「TD(0)」〜「TD(7)」キーをキーマップに置くと使えます。</p>
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {Array.from({ length: 8 }, (_, idx) => {
          const slot = tdSlots[idx] ?? EMPTY_TD;
          return (
            <div key={idx} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="settings-unit" style={{ minWidth: 48 }}>TD({idx})</span>
              {([['tap', 'タップ'], ['dtap', 'ダブルタップ'], ['hold', '長押し']] as const).map(([field, label]) => (
                <span key={field} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span className="setting-row__desc">{label}</span>
                  <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditTd({ idx, field })}>
                    {slot[field] ? getKeyDisplayLabel(slot[field], keyLayout) : '—'}
                  </button>
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {editTd && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={(tdSlots[editTd.idx] ?? EMPTY_TD)[editTd.field]}
          keyLayout={keyLayout}
          defaultPanel="カスタム"
          hideHold
          onSelect={async (kc) => {
            const cur = tdSlots[editTd.idx] ?? EMPTY_TD;
            const updated: TdSlot = { ...cur, [editTd.field]: kc };
            updated.flags = (updated.tap || updated.hold || updated.dtap) ? (updated.flags | 1) : (updated.flags & ~1);
            await onTdSlotChange(editTd.idx, updated);
            setEditTd(null);
          }}
          onClose={() => setEditTd(null)}
        />
      )}
    </>
  );
}
