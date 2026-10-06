import type { KeyLayout } from '../../lib/keycodes';
import type { MacroSlot, TdSlot, ComboSlot } from '../../lib/protocol';
import { MacroEditor } from './MacroEditor';
import { TapDanceSection } from './TapDanceSection';
import { ComboSection } from './ComboSection';
import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';

interface MacroTabProps {
  macroAvailable: boolean;   // マクロ機能自体が使えるファームか（LED版はメディアキーと引き換えに廃止）
  tapDanceAvailable: boolean; // タップダンス機能自体が使えるファームか（AVR版は非対応）
  comboAvailable: boolean;    // コンボ機能自体が使えるファームか（AVR版は非対応）
  macroSlots: MacroSlot[];
  onMacroSave: (idx: number, slot: MacroSlot) => Promise<void>;
  macroBufferSize: number;  // 接続中機種の実際のマクロバッファ容量（Keyball61は他機種より小さい）
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
// 共通のジャンルなので1つのタブにまとめる。トラックボール設定・詳細設定タブと同じく、
// 左にタブ・右に選んだ項目を表示する形（2026-10-06〜）。
export function MacroTab({
  macroAvailable, tapDanceAvailable, comboAvailable, macroSlots, onMacroSave, macroBufferSize, isConnected, keyLayout,
  tdSlots, onTdSlotChange, comboSlots, comboEnabled, onComboEnabledChange, onComboSlotChange,
}: MacroTabProps) {
  const cards: BoardCard[] = [
    {
      key: 'macro', title: 'マクロ', note: '複数キー入力をまとめて1キーで実行',
      render: () => (
        macroAvailable ? (
          <MacroEditor slots={macroSlots} keyLayout={keyLayout} isConnected={isConnected} onSave={onMacroSave} bufferSize={macroBufferSize} />
        ) : (
          <p className="settings-desc" style={{ color: 'var(--red)' }}>
            ⚠ この版（LED版）ではマクロは使用できません（v1.1.0でメディアキーと引き換えに廃止されました）。<br />
            通常版のファームを書き込むとマクロが使えます。「ファームウェア」タブから書き込めます。
          </p>
        )
      ),
    },
    ...(tapDanceAvailable ? [{
      key: 'td', title: 'タップダンス', note: '叩く回数・長押しで動作を変える',
      render: () => <TapDanceSection tdSlots={tdSlots} onTdSlotChange={onTdSlotChange} keyLayout={keyLayout} disabled={!isConnected} />,
    }] : []),
    ...(comboAvailable ? [{
      key: 'combo', title: 'コンボ', note: '複数キー同時押しで別の動作を実行',
      render: () => (
        <ComboSection
          comboSlots={comboSlots} comboEnabled={comboEnabled}
          onComboEnabledChange={onComboEnabledChange} onComboSlotChange={onComboSlotChange}
          keyLayout={keyLayout} disabled={!isConnected}
        />
      ),
    }] : []),
  ];

  // 左にタブ、右に選んだ項目を表示する（トラックボール設定と同じ形。2026-10-06、本人希望）
  return (
    <div className="settings-tab">
      <SettingsSidebarBoard cards={cards} />
    </div>
  );
}
