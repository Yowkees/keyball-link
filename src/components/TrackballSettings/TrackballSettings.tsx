import type { TrackballConfig } from '../../lib/protocol';
import { cpiIndexToValue, SCROLL_MODE } from '../../lib/protocol';

interface TrackballSettingsProps {
  config: TrackballConfig;
  onChange: (cfg: TrackballConfig) => void;
  onSave: () => void;
  scrollInvertV: boolean;
  scrollInvertH: boolean;
  onScrollInvertChange: (v: boolean, h: boolean) => void;
}

const MAX_CPI_INDEX = 17;
const MAX_SCROLL_DIV = 7;
const MAX_ACCEL = 10;

export function TrackballSettings({ config, onChange, onSave, scrollInvertV, scrollInvertH, onScrollInvertChange }: TrackballSettingsProps) {
  const cpiValue = cpiIndexToValue(config.cpiIndex);

  return (
    <div className="trackball-bar">
      <span className="trackball-bar__title">トラックボール</span>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">CPI: <strong>{cpiValue}</strong></span>
        <input
          type="range"
          min={0}
          max={MAX_CPI_INDEX}
          value={config.cpiIndex}
          onChange={e => onChange({ ...config, cpiIndex: Number(e.target.value) })}
          className="slider"
        />
        <span className="trackball-bar__scale">100〜1800</span>
      </div>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">スクロール速度: <strong>{config.scrollDiv}</strong></span>
        <input
          type="range"
          min={0}
          max={MAX_SCROLL_DIV}
          value={config.scrollDiv}
          onChange={e => onChange({ ...config, scrollDiv: Number(e.target.value) })}
          className="slider"
        />
        <span className="trackball-bar__scale">速〜遅</span>
      </div>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">加速度: <strong>{config.accel === 0 ? 'オフ' : config.accel}</strong></span>
        <input
          type="range"
          min={0}
          max={MAX_ACCEL}
          value={config.accel}
          onChange={e => onChange({ ...config, accel: Number(e.target.value) })}
          className="slider"
        />
        <span className="trackball-bar__scale">オフ〜強</span>
      </div>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">スクロール方向</span>
        <select
          className="trackball-bar__select"
          value={config.scrollMode}
          onChange={e => onChange({ ...config, scrollMode: Number(e.target.value) })}
        >
          <option value={SCROLL_MODE.VERTICAL}>縦のみ</option>
          <option value={SCROLL_MODE.HORIZONTAL}>横のみ</option>
          <option value={SCROLL_MODE.FREE}>自由（縦横）</option>
        </select>
      </div>

      <div className="trackball-bar__item trackball-bar__item--invert">
        <span className="trackball-bar__label">反転</span>
        <button
          className={`btn btn--small btn--layer ${scrollInvertV ? 'btn--layer-active' : ''}`}
          onClick={() => onScrollInvertChange(!scrollInvertV, scrollInvertH)}
          title="縦スクロールの向きを逆にする"
        >
          縦 {scrollInvertV ? 'ON' : 'OFF'}
        </button>
        <button
          className={`btn btn--small btn--layer ${scrollInvertH ? 'btn--layer-active' : ''}`}
          onClick={() => onScrollInvertChange(scrollInvertV, !scrollInvertH)}
          title="横スクロールの向きを逆にする"
        >
          横 {scrollInvertH ? 'ON' : 'OFF'}
        </button>
      </div>

      <button className="btn btn--ghost btn--small" onClick={onSave}>保存</button>
    </div>
  );
}
