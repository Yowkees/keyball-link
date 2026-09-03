import type { LedConfig } from '../../lib/protocol';
import { LED_EFFECTS, LED_SEASONAL_EFFECT_IDS } from '../../lib/protocol';

interface LEDSettingsProps {
  config: LedConfig;
  onChange: (cfg: LedConfig) => void;
  onSave?: () => void;
}

export function LEDSettings({ config, onChange, onSave }: LEDSettingsProps) {
  const isSeasonal = (LED_SEASONAL_EFFECT_IDS as readonly number[]).includes(config.effectId);
  const showColor = config.effectId !== 0;
  const showHue   = showColor && !isSeasonal;  // 季節限定エフェクトは色相固定（テーマカラー）
  const showSpeed = config.effectId >= 2;

  return (
    <div className="trackball-bar">
      <span className="trackball-bar__title">LED</span>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">エフェクト</span>
        <select
          className="trackball-bar__select"
          value={config.effectId}
          onChange={e => onChange({ ...config, effectId: Number(e.target.value) })}
        >
          {LED_EFFECTS.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      {showColor && (
        <>
          {showHue && (
            <div className="trackball-bar__item">
              <span className="trackball-bar__label">色相: <strong>{config.hue}</strong></span>
              <input
                type="range" min={0} max={255} value={config.hue}
                onChange={e => onChange({ ...config, hue: Number(e.target.value) })}
                className="slider slider--hue"
                style={{ background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))` }}
              />
            </div>
          )}
          {isSeasonal && (
            <p className="settings-desc">このエフェクトは色相固定（テーマカラー）です。彩度・明度は調整できます。</p>
          )}

          <div className="trackball-bar__item">
            <span className="trackball-bar__label">彩度: <strong>{config.sat}</strong></span>
            <input
              type="range" min={0} max={255} value={config.sat}
              onChange={e => onChange({ ...config, sat: Number(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="trackball-bar__item">
            <span className="trackball-bar__label">明度: <strong>{config.val}</strong></span>
            <input
              type="range" min={0} max={200} value={config.val}
              onChange={e => onChange({ ...config, val: Number(e.target.value) })}
              className="slider"
            />
          </div>
        </>
      )}

      {showSpeed && (
        <div className="trackball-bar__item">
          <span className="trackball-bar__label">速度: <strong>{config.speed}</strong></span>
          <input
            type="range" min={0} max={255} value={config.speed}
            onChange={e => onChange({ ...config, speed: Number(e.target.value) })}
            className="slider"
          />
          <span className="trackball-bar__scale">遅〜速</span>
        </div>
      )}

      {onSave && <button className="btn btn--ghost btn--small" onClick={onSave}>保存</button>}
    </div>
  );
}
