import { useState } from 'react';
import type { KeyLayout } from '../../lib/keycodes';
import type { MacroSlot, TdSlot, ComboSlot } from '../../lib/protocol';
import { FIRMWARE_FEATURES } from '../../lib/firmwareFeatures';
import { MacroEditor } from './MacroEditor';
import { TapDanceSection } from './TapDanceSection';
import { ComboSection } from './ComboSection';

type MacroSection = 'macro' | 'tapdance' | 'combo';

interface MacroTabProps {
  macroAvailable: boolean;   // マクロ機能自体が使えるファームか（LED版はメディアキーと引き換えに廃止）
  macroSlots: MacroSlot[];
  onMacroSave: (idx: number, slot: MacroSlot) => Promise<void>;
  isConnected: boolean;
  keyLayout: KeyLayout;
  tdSlots: TdSlot[];
  onTdSlotChange: (idx: number, slot: TdSlot) => Promise<void>;
  comboSlots: ComboSlot[] | null;
  comboEnabled: boolean;
  onComboEnabledChange: (v: boolean) => Promise<void>;
  onComboSlotChange: (idx: number, slot: ComboSlot) => Promise<void>;
}

// マクロ・タップダンス・コンボは「1回のキー入力を条件によって複数の動作に振り分ける」という
// 共通のジャンルなので1つのタブにまとめる。詳細設定タブと同じ「左に項目一覧・右に詳細」の
// サイドバー形式に統一している。
export function MacroTab({
  macroAvailable, macroSlots, onMacroSave, isConnected, keyLayout,
  tdSlots, onTdSlotChange, comboSlots, comboEnabled, onComboEnabledChange, onComboSlotChange,
}: MacroTabProps) {
  const sections: { key: MacroSection; title: string; note: string; render: () => React.ReactNode }[] = [
    {
      key: 'macro', title: 'マクロ', note: '複数キー入力をまとめて1キーで実行',
      render: () => (
        macroAvailable ? (
          <MacroEditor slots={macroSlots} keyLayout={keyLayout} isConnected={isConnected} onSave={onMacroSave} />
        ) : (
          <p className="settings-desc" style={{ color: 'var(--red)' }}>
            ⚠ この版（LED版）ではマクロは使用できません（v1.1.0でメディアキーと引き換えに廃止されました）。<br />
            通常版のファームを書き込むとマクロが使えます。「ファームウェア」タブから書き込めます。
          </p>
        )
      ),
    },
    ...(FIRMWARE_FEATURES.tapDance ? [{
      key: 'tapdance' as const, title: 'タップダンス', note: '叩く回数・長押しで動作を変える',
      render: () => <TapDanceSection tdSlots={tdSlots} onTdSlotChange={onTdSlotChange} keyLayout={keyLayout} disabled={!isConnected} />,
    }] : []),
    ...(FIRMWARE_FEATURES.combo ? [{
      key: 'combo' as const, title: 'コンボ', note: '複数キー同時押しで別の動作を実行',
      render: () => (
        <ComboSection
          comboSlots={comboSlots} comboEnabled={comboEnabled}
          onComboEnabledChange={onComboEnabledChange} onComboSlotChange={onComboSlotChange}
          keyLayout={keyLayout} disabled={!isConnected}
        />
      ),
    }] : []),
  ];

  const [section, setSection] = useState<MacroSection>('macro');
  const active = sections.find(s => s.key === section) ?? sections[0];

  return (
    <div className="settings-tab">
      <div className="settings-sidebar-layout">
        <div className="settings-sidebar">
          {sections.map(s => (
            <button
              key={s.key}
              className={`settings-sidebar__item ${active.key === s.key ? 'settings-sidebar__item--active' : ''}`}
              onClick={() => setSection(s.key)}
            >
              <span className="settings-sidebar__title">{s.title}</span>
              {s.note && <span className="settings-sidebar__note">{s.note}</span>}
            </button>
          ))}
        </div>

        <div className="settings-detail">
          <div className="settings-detail__head">
            <span className="settings-detail__title">{active.title}</span>
            {active.note && <span className="settings-detail__note">{active.note}</span>}
          </div>
          <div className="settings-detail__body">
            {active.render()}
          </div>
        </div>
      </div>
    </div>
  );
}
