import type { LedConfig } from '../../lib/protocol';
import { LED_EFFECTS } from '../../lib/protocol';

interface LEDSettingsProps {
  config: LedConfig;
  onChange: (cfg: LedConfig) => void;
  onSave: () => void;
}

export function LEDSettings({ config, onChange, onSave }: LEDSettingsProps) {
  const showColor = config.effectId !== 0;
  const showSpeed = config.effectId >= 2;

  return (
    <div className="trackball-bar">
      <span className="trackball-bar__title">LED</span>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">エフェクト</span>
        <div className="led-effect-selector">
          {LED_EFFECTS.map(e => (
            <button
              key={e.id}
              className={`btn btn--small btn--layer ${config.effectId === e.id ? 'btn--layer-active' : ''}`}
              onClick={() => onChange({ ...config, effectId: e.id })}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {showColor && (
        <>
          <div className="trackball-bar__item">
            <span className="trackball-bar__label">色相: <strong>{config.hue}</strong></span>
            <input
              type="range" min={0} max={255} value={config.hue}
              onChange={e => onChange({ ...config, hue: Number(e.target.value) })}
              className="slider slider--hue"
              style={{ background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))` }}
            />
          </div>

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

      <button className="btn btn--ghost btn--small" onClick={onSave}>保存</button>
    </div>
  );
}
