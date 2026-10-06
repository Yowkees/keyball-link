import { useState } from 'react';
import type { KbSettings } from '../../lib/protocol';
import { OS_VARIANT_NAMES } from '../../lib/protocol';
import { firmwareFeaturesForChip } from '../../lib/firmwareFeatures';
import { chipForProductId } from '../../lib/deviceIds';
import type { KeyLayout } from '../../lib/keycodes';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { UsageGuide } from '../UsageGuide/UsageGuide';
import { KeyDisplaySection, MacOSSetupSection, isMacOSPlatform } from '../KeyLayoutCards/KeyLayoutCards';
import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';
import type { ModelKey } from '../../layouts';

interface SettingsTabProps {
  settings: KbSettings;
  isConnected: boolean;
  onChange: (s: KbSettings) => Promise<void>;
  detectedOs: number | null;  // OS自動判別の検出結果（0-4）。null = 非対応ファーム
  keyLayout: KeyLayout;
  onKeyLayoutChange: (layout: KeyLayout) => void;
  model: ModelKey | null;
  productId: number | null;
  onTestLed?: (index: number) => Promise<void>;  // LED物理位置実測用の診断コマンド。未対応ファームではundefined
  ledCount?: number;  // 実測対象のLED総数（未指定時は46）
  children?: React.ReactNode;  // テストマトリクス（MatrixTestPanel）をApp.tsx側から差し込む
}

export function SettingsTab({
  settings, isConnected, onChange, detectedOs,
  keyLayout, onKeyLayoutChange, model, productId, onTestLed, ledCount = 46, children,
}: SettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const [testLedIndex, setTestLedIndex] = useState<number | null>(null);  // LED実測中のインデックス（null=未実施）
  const chip = productId != null ? chipForProductId(productId) : undefined;
  const fwFeatures = firmwareFeaturesForChip(chip);

  const apply = async (patch: Partial<KbSettings>) => {
    setSaving(true);
    try {
      await onChange({ ...settings, ...patch });
    } finally {
      setSaving(false);
    }
  };

  const disabled = !isConnected || saving;

  const cards: BoardCard[] = [
    {
      key: 'keyopt', title: 'キー動作オプション', note: '長押し判定・Auto Shift・Permissive Hold',
      render: () => (
        <div>
          <p className="settings-desc">タップとホールドを区別する時間です。</p>
          <SliderControl
            value={settings.tappingTerm} min={50} max={500} step={10}
            disabled={disabled} unit="ms"
            onCommit={v => apply({ tappingTerm: v })}
          />
          <div className="tapping-term-hints">
            <span>50ms（素早く）</span>
            <span>デフォルト: 200ms</span>
            <span>500ms（ゆっくり）</span>
          </div>

          <div className="setting-rows" style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {fwFeatures.autoShift && (
              <ToggleRow
                label="Auto Shift"
                desc="長押しでShift文字を入力（例: aの長押し→A）。"
                checked={settings.autoShift} disabled={disabled}
                onChange={v => apply({ autoShift: v })}
              />
            )}
            <ToggleRow
              label="Permissive Hold"
              desc="Mod-Tapのホールド判定を厳密にします。"
              checked={settings.permissiveHold} disabled={disabled}
              onChange={v => apply({ permissiveHold: v })}
            />
          </div>
          {saving && <p className="td-saving" style={{ marginTop: 8 }}>保存中…</p>}
        </div>
      ),
    },
    ...(fwFeatures.osDetection ? [{
      key: 'os', title: 'OS自動判別', note: '接続先のOSを判定してキーを切り替え',
      render: () => (
        <>
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label">現在の判定結果</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: '1.05em' }}>
              {detectedOs == null
                ? (isConnected ? '—' : '未接続')
                : (OS_VARIANT_NAMES[detectedOs] ?? '不明')}
            </span>
          </div>
          <div className="setting-rows">
            <ToggleRow
              label="OSに合わせて ⌘(Cmd) と Ctrl を自動で入れ替える"
              desc="macOS/iOSでは入れ替え、Windows/Linuxではそのまま。"
              checked={settings.osAutoSwap} disabled={disabled}
              onChange={v => apply({ osAutoSwap: v })}
            />
          </div>
          {saving && <p className="td-saving" style={{ marginTop: 8 }}>保存中…</p>}
        </>
      ),
    }] : []),
    {
      key: 'layout', title: 'キー表示の配列設定', note: '表示のみ・入力文字は変わりません',
      render: () => <KeyDisplaySection keyLayout={keyLayout} onKeyLayoutChange={onKeyLayoutChange} />,
    },
    ...(isMacOSPlatform() ? [{
      key: 'macos', title: 'macOS キーボードタイプ設定',
      render: () => <MacOSSetupSection defaultLayout={keyLayout} model={model} productId={productId} />,
    }] : []),
    ...(onTestLed ? [{
      key: 'led', title: 'LED位置実測（開発用）',
      render: () => (
        <>
          <p className="settings-desc">
            LEDを1個ずつ点灯させて配線順を確認します。「終了」で通常表示に戻ります。
          </p>
          <div className="tapping-term-row" style={{ gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn--small"
              disabled={disabled || testLedIndex === null}
              onClick={async () => {
                const next = Math.max(0, (testLedIndex ?? 0) - 1);
                setTestLedIndex(next);
                await onTestLed(next);
              }}
            >
              ← 戻る
            </button>
            <span className="tapping-term-value" style={{ minWidth: 80, textAlign: 'center' }}>
              {testLedIndex === null ? '未実施' : `index ${testLedIndex} / ${ledCount - 1}`}
            </span>
            <button
              className="btn btn--small"
              disabled={disabled || (testLedIndex !== null && testLedIndex >= ledCount - 1)}
              onClick={async () => {
                const next = Math.min(ledCount - 1, (testLedIndex ?? -1) + 1);
                setTestLedIndex(next);
                await onTestLed(next);
              }}
            >
              次へ →
            </button>
            {testLedIndex !== null && (
              <button
                className="btn btn--small"
                disabled={disabled}
                onClick={async () => {
                  setTestLedIndex(null);
                  await onTestLed(0xFF);
                }}
              >
                終了
              </button>
            )}
          </div>
        </>
      ),
    }] : []),
    ...(children ? [{
      key: 'matrix', title: 'テストマトリクス', note: 'キーが正しく反応するか確認',
      render: () => children,
    }] : []),
    {
      key: 'guide', title: '使い方ガイド',
      render: () => <UsageGuide />,
    },
  ];

  // 左にタブ、右に選んだ項目を表示する（トラックボール設定と同じ形。2026-10-06、本人希望）
  return (
    <div className="settings-tab">
      {!isConnected && (
        <div className="settings-notice">
          キーボードに接続すると設定を変更できます。
        </div>
      )}
      <SettingsSidebarBoard cards={cards} />
    </div>
  );
}
