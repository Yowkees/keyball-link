import type { KbSettings } from '../../lib/protocol';
import { LAYER_NONE } from '../../lib/protocol';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl } from '../SettingsControls/SettingsControls';

interface AutoMouseLayerCardProps {
  settings: KbSettings;
  disabled: boolean;
  switchableLayers: number[];
  layerWarn: LayerWarn | null;
  changeAmlLayer: (v: number) => void;
  apply: (patch: Partial<KbSettings>) => Promise<void>;
}

export function AutoMouseLayerCard({ settings, disabled, switchableLayers, layerWarn, changeAmlLayer, apply }: AutoMouseLayerCardProps) {
  return (
    <>
      <div className="setting-rows">
        <div className={`setting-row setting-row--compact ${disabled ? 'setting-row--disabled' : ''}`}>
          <div className="setting-row__text">
            <span className="setting-row__label">切り替わるレイヤー</span>
          </div>
          <select
            className="trackball-bar__select"
            value={settings.autoMouseEnable ? settings.autoMouseLayer : LAYER_NONE}
            disabled={disabled}
            onChange={e => changeAmlLayer(Number(e.target.value))}
          >
            <option value={LAYER_NONE}>なし</option>
            {switchableLayers.map(l => (
              <option key={l} value={l}>Layer {l}</option>
            ))}
          </select>
        </div>
        {layerWarn?.target === 'aml' && (
          <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
        )}
      </div>

      {/* 2つのスライダー。横長カードでは左右に並べる（index.css） */}
      <div className="aml-card__sliders">
      <div>
      <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>自動で戻るまでの時間</p>
      <div style={{ opacity: disabled || !settings.autoMouseEnable ? 0.5 : 1 }}>
        <SliderControl
          value={settings.autoMouseTimeout} min={100} max={2000} step={50}
          disabled={disabled || !settings.autoMouseEnable} unit="ms"
          onCommit={v => apply({ autoMouseTimeout: v })}
        />
      </div>
      </div>

      <div>
      <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>感度</p>
      <div style={{ opacity: disabled || !settings.autoMouseEnable ? 0.5 : 1 }}>
        <SliderControl
          value={settings.autoMouseThreshold} min={1} max={40} step={1}
          disabled={disabled || !settings.autoMouseEnable} unit="" invert
          onCommit={v => apply({ autoMouseThreshold: v })}
        />
      </div>
      </div>
      </div>
    </>
  );
}
