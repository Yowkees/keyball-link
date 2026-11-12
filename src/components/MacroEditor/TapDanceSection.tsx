import { Fragment, useState } from 'react';
import type { TdSlot } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';
import { TIPS } from '../../lib/tips';
import { t, tk } from '../../lib/i18n';

interface TapDanceSectionProps {
  tdSlots: TdSlot[];
  onTdSlotChange: (idx: number, slot: TdSlot) => Promise<void>;
  keyLayout: KeyLayout;
  disabled: boolean;
}

const EMPTY_TD: TdSlot = { tap: 0, hold: 0, dtap: 0, flags: 0 };
const TD_FIELDS = [['tap', tk('タップ')], ['dtap', tk('ダブルタップ')], ['hold', tk('長押し')]] as const;
// ヒントは表示する時に読む（言語の切り替えに合わせて訳が変わるように）
const TD_TIP_KEYS = { tap: 'tdTap', dtap: 'tdDtap', hold: 'tdHold' } as const;

export function TapDanceSection({ tdSlots, onTdSlotChange, keyLayout, disabled }: TapDanceSectionProps) {
  const [editTd, setEditTd] = useState<{ idx: number; field: 'tap' | 'hold' | 'dtap' } | null>(null);

  return (
    <>
      {/* 見出し行（タップ／ダブルタップ／長押し）＋8行の表形式。以前は各行に見出しを
          並べていたが、カード表示（2026-10-06〜）の狭い幅だと折り返して縦に伸びるため表にした */}
      <div className="td-grid">
        <span />
        {TD_FIELDS.map(([field, label]) => <span key={field} className="td-grid__head"><span data-tip={TIPS[TD_TIP_KEYS[field]]}>{t(label)}</span></span>)}
        {Array.from({ length: 8 }, (_, idx) => {
          const slot = tdSlots[idx] ?? EMPTY_TD;
          return (
            <Fragment key={idx}>
              <span className="settings-unit td-grid__label">TD({idx})</span>
              {TD_FIELDS.map(([field]) => (
                <button key={field} className="gesture-key-btn td-grid__key" disabled={disabled} onClick={() => setEditTd({ idx, field })}>
                  {slot[field] ? getKeyDisplayLabel(slot[field], keyLayout) : '—'}
                </button>
              ))}
            </Fragment>
          );
        })}
      </div>

      {editTd && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={(tdSlots[editTd.idx] ?? EMPTY_TD)[editTd.field]}
          keyLayout={keyLayout}
          defaultPanel="通常"
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
