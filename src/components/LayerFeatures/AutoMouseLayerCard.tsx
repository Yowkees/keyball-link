import type { KbSettings } from '../../lib/protocol';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';

interface AutoMouseLayerCardProps {
  settings: KbSettings;
  disabled: boolean;
  switchableLayers: number[];
  layerWarn: LayerWarn | null;
  changeAmlEnable: (v: boolean) => void;
  changeAmlLayer: (v: number) => void;
  apply: (patch: Partial<KbSettings>) => Promise<void>;
}

export function AutoMouseLayerCard({ settings, disabled, switchableLayers, layerWarn, changeAmlEnable, changeAmlLayer, apply }: AutoMouseLayerCardProps) {
  return (
    <>
      <div className="setting-rows">
        <ToggleRow
          label="自動マウスレイヤーを使う"
          desc=""
          checked={settings.autoMouseEnable}
          disabled={disabled}
          onChange={changeAmlEnable}
        />
        <div className={`setting-row ${disabled || !settings.autoMouseEnable ? 'setting-row--disabled' : ''}`}>
          <div className="setting-row__text">
            <span className="setting-row__label">切り替わるレイヤー</span>
          </div>
          <select
            className="trackball-bar__select"
            value={settings.autoMouseLayer}
            disabled={disabled || !settings.autoMouseEnable}
            onChange={e => changeAmlLayer(Number(e.target.value))}
          >
            {switchableLayers.map(l => (
              <option key={l} value={l}>Layer {l}</option>
            ))}
          </select>
        </div>
        {layerWarn?.target === 'aml' && (
          <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
        )}
      </div>

      <p className="settings-desc" style={{ marginTop: 16, fontWeight: 600 }}>自動で戻るまでの時間</p>
      <div style={{ opacity: disabled || !settings.autoMouseEnable ? 0.5 : 1 }}>
        <SliderControl
          value={settings.autoMouseTimeout} min={100} max={2000} step={50}
          disabled={disabled || !settings.autoMouseEnable} unit="ms"
          onCommit={v => apply({ autoMouseTimeout: v })}
        />
      </div>
      <div className="tapping-term-hints">
        <span>100ms（すぐ戻る）</span>
        <span>デフォルト: 650ms</span>
        <span>2000ms（長く維持）</span>
      </div>

      <p className="settings-desc" style={{ marginTop: 16, fontWeight: 600 }}>感度</p>
      <div style={{ opacity: disabled || !settings.autoMouseEnable ? 0.5 : 1 }}>
        <SliderControl
          value={settings.autoMouseThreshold} min={1} max={40} step={1}
          disabled={disabled || !settings.autoMouseEnable} unit=""
          onCommit={v => apply({ autoMouseThreshold: v })}
        />
      </div>
      <div className="tapping-term-hints">
        <span>1（とても敏感）</span>
        <span>デフォルト: 10</span>
        <span>40（鈍感）</span>
      </div>
    </>
  );
}
