import { translate, translateLabel } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useState } from 'react';
import type { KbSettings } from '../../lib/protocol';
import { OS_VARIANT_NAMES } from '../../lib/protocol';
import { firmwareFeaturesForChip } from '../../lib/firmwareFeatures';
import { chipForProductId } from '../../lib/deviceIds';
import type { KeyLayout } from '../../lib/keycodes';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { KeyDisplaySection, MacOSSetupSection, isMacOSPlatform } from '../KeyLayoutCards/KeyLayoutCards';
import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';
import type { ModelKey } from '../../layouts';
import { TIPS } from '../../lib/tips';

interface SettingsTabProps {
  settings: KbSettings;
  isConnected: boolean;
  onChange: (s: KbSettings) => Promise<void>;
  detectedOs: number | null;  // OS自動判別の検出結果（0-4）。null = 非対応ファーム
  oledAnimEnabled: boolean | null;  // OLEDのアニメーションのON/OFF。null = 非対応ファーム（項目を出さない）
  onOledAnimChange: (v: boolean) => Promise<void>;
  bootAnimEnabled: boolean | null;  // 起動アニメーションのON/OFF。null = 非対応ファーム（項目を出さない）
  onBootAnimChange: (v: boolean) => Promise<void>;
  keyLayout: KeyLayout;
  onKeyLayoutChange: (layout: KeyLayout) => void;
  model: ModelKey | null;
  productId: number | null;
  onTestLed?: (index: number) => Promise<void>;  // LED物理位置実測用の診断コマンド。未対応ファームではundefined
  ledCount?: number;  // 実測対象のLED総数（未指定時は46）
  children?: React.ReactNode;  // テストマトリクス（MatrixTestPanel）をApp.tsx側から差し込む
}

export function SettingsTab({
  settings, isConnected, onChange, detectedOs, oledAnimEnabled, onOledAnimChange, bootAnimEnabled, onBootAnimChange,
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
      key: 'keyopt', get title() { return translate(TextKey.SettingsTabKeyBehaviorOptions); }, className: 'board-card--narrow', tip: TIPS.keyopt,
      render: () => (
        <div>
          <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.tappingTerm}>{translate(TextKey.SettingsTabHoldDetectionTime)}</p>
          <SliderControl
            value={settings.tappingTerm} min={50} max={500} step={10}
            disabled={disabled} unit="ms"
            onCommit={v => apply({ tappingTerm: v })}
          />

          <div className="setting-rows" style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {fwFeatures.autoShift && (
              <ToggleRow
                label={translate(TextKey.SettingsTabAutoShift)}
                desc="" tip={TIPS.autoShift}
                checked={settings.autoShift} disabled={disabled}
                onChange={v => apply({ autoShift: v })}
              />
            )}
            <ToggleRow
              label={translate(TextKey.SettingsTabPermissiveHold)}
              desc="" tip={TIPS.permissiveHold}
              checked={settings.permissiveHold} disabled={disabled}
              onChange={v => apply({ permissiveHold: v })}
            />
          </div>
          {saving && <p className="td-saving" style={{ marginTop: 8 }}>{translate(TextKey.AppSaving)}</p>}
        </div>
      ),
    },
    ...(fwFeatures.osDetection ? [{
      key: 'os', get title() { return translate(TextKey.SettingsTabAutomaticOSDetection); }, className: 'board-card--narrow', tip: TIPS.osdetect,
      render: () => (
        <>
          <div className="setting-row">
            <div className="setting-row__text">
              <span className="setting-row__label" data-tip={TIPS.osResult}>{translate(TextKey.SettingsTabDetectedSystem)}</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: '1.05em' }}>
              {detectedOs == null
                ? (isConnected ? '—' : translate(TextKey.SettingsTabDisconnected))
                : translateLabel(OS_VARIANT_NAMES[detectedOs] ?? translate(TextKey.Unknown))}
            </span>
          </div>
          <div className="setting-rows">
            <ToggleRow
              label={translate(TextKey.SettingsTabAutomaticallySwapCmdAndCtrlFor)}
              desc="" tip={TIPS.osSwap}
              checked={settings.osAutoSwap} disabled={disabled}
              onChange={v => apply({ osAutoSwap: v })}
            />
          </div>
          {saving && <p className="td-saving" style={{ marginTop: 8 }}>{translate(TextKey.AppSaving)}</p>}
        </>
      ),
    }] : []),
    ...(oledAnimEnabled !== null || bootAnimEnabled !== null ? [{
      key: 'oled', get title() { return translate(TextKey.SettingsTabAnimations); }, className: 'board-card--narrow', tip: TIPS.oled,
      render: () => (
        <div className="setting-rows">
          {bootAnimEnabled !== null && (
            <ToggleRow
              label={translate(TextKey.SettingsTabStartupAnimation)}
              desc="" tip={TIPS.bootAnim}
              checked={bootAnimEnabled} disabled={disabled}
              onChange={async v => {
                setSaving(true);
                try { await onBootAnimChange(v); } finally { setSaving(false); }
              }}
            />
          )}
          {oledAnimEnabled !== null && (
            <ToggleRow
              label={translate(TextKey.SettingsTabOLEDAnimation)}
              desc="" tip={TIPS.oledAnim}
              checked={oledAnimEnabled} disabled={disabled}
              onChange={async v => {
                setSaving(true);
                try { await onOledAnimChange(v); } finally { setSaving(false); }
              }}
            />
          )}
        </div>
      ),
    }] : []),
    {
      key: 'layout', get title() { return translate(TextKey.SettingsTabDisplayedKeyLayout); }, className: 'board-card--narrow', tip: TIPS.keydisplay,
      render: () => <KeyDisplaySection keyLayout={keyLayout} onKeyLayoutChange={onKeyLayoutChange} />,
    },
    ...(isMacOSPlatform() ? [{
      key: 'macos', get title() { return translate(TextKey.SettingsTabMacOSKeyboardType); }, tip: TIPS.macos,
      render: () => <MacOSSetupSection defaultLayout={keyLayout} model={model} productId={productId} />,
    }] : []),
    ...(onTestLed ? [{
      key: 'led', get title() { return translate(TextKey.SettingsTabMeasureLEDPositionsDevelopment); }, className: 'board-card--narrow', tip: TIPS.ledtest,
      render: () => (
        <>
          <div className="tapping-term-row" style={{ gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn--small"
              disabled={disabled || testLedIndex === null}
              onClick={async () => {
                const next = Math.max(0, (testLedIndex ?? 0) - 1);
                setTestLedIndex(next);
                await onTestLed(next);
              }}
            >{translate(TextKey.LedTestPanelBack)}</button>
            <span className="tapping-term-value" style={{ minWidth: 80, textAlign: 'center' }}>
              {testLedIndex === null ? translate(TextKey.SettingsTabNotStarted) : `index ${testLedIndex} / ${ledCount - 1}`}
            </span>
            <button
              className="btn btn--small"
              disabled={disabled || (testLedIndex !== null && testLedIndex >= ledCount - 1)}
              onClick={async () => {
                const next = Math.min(ledCount - 1, (testLedIndex ?? -1) + 1);
                setTestLedIndex(next);
                await onTestLed(next);
              }}
            >{translate(TextKey.SettingsTabNext)}</button>
            {testLedIndex !== null && (
              <button
                className="btn btn--small"
                disabled={disabled}
                onClick={async () => {
                  setTestLedIndex(null);
                  await onTestLed(0xFF);
                }}
              >{translate(TextKey.LedTestPanelFinish)}</button>
            )}
          </div>
        </>
      ),
    }] : []),
    ...(children ? [{
      key: 'matrix', get title() { return translate(TextKey.SettingsTabKeyMatrixTest); }, tip: TIPS.matrix,
      render: () => children,
    }] : []),
  ];

  // 左にタブ、右に選んだ項目を表示する（トラックボール設定と同じ形。2026-10-06、本人希望）
  return (
    <div className="settings-tab">
      {!isConnected && (
        <div className="settings-notice">{translate(TextKey.SettingsTabConnectTheKeyboardToChangeSettings)}</div>
      )}
      <SettingsSidebarBoard cards={cards} />
    </div>
  );
}
