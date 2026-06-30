import { useState, useEffect } from 'react';
import type { TrackballConfig } from '../../lib/protocol';
import { cpiIndexToValue, SCROLL_MODE } from '../../lib/protocol';

interface TrackballSettingsProps {
  config: TrackballConfig;
  onChange: (cfg: TrackballConfig) => void;
  onSave: () => void;
  scrollInvertV: boolean;
  scrollInvertH: boolean;
  onScrollInvertChange: (v: boolean, h: boolean) => void;
  accelAvailable?: boolean;  // LED版の44/61では加速度が無効 → グレーアウト
}

const MAX_CPI_INDEX = 17;
const MAX_SCROLL_DIV = 7;
const MAX_ACCEL = 10;

// スライダーはドラッグ中にローカル表示のみ更新し、離したときだけ親に通知する
function TrackballSlider({
  label,
  value,
  min,
  max,
  renderLabel,
  scale,
  onCommit,
  dimmed = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  renderLabel: (v: number) => string;
  scale: string;
  onCommit: (v: number) => void;
  dimmed?: boolean;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="trackball-bar__item" style={dimmed ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
      title={dimmed ? 'このファーム版（LED版）では加速度は使用できません' : undefined}>
      <span className="trackball-bar__label">{label}: <strong>{dimmed ? '—' : renderLabel(local)}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        value={local}
        disabled={dimmed}
        onChange={e => setLocal(Number(e.target.value))}
        onPointerUp={e => onCommit(Number((e.target as HTMLInputElement).value))}
        onKeyUp={e => onCommit(Number((e.target as HTMLInputElement).value))}
        className="slider"
      />
      <span className="trackball-bar__scale">{dimmed ? 'この版では無効' : scale}</span>
    </div>
  );
}

export function TrackballSettings({ config, onChange, onSave, scrollInvertV, scrollInvertH, onScrollInvertChange, accelAvailable = true }: TrackballSettingsProps) {
  return (
    <div className="trackball-bar">
      <span className="trackball-bar__title">トラックボール</span>

      <TrackballSlider
        label="CPI"
        value={config.cpiIndex}
        min={0}
        max={MAX_CPI_INDEX}
        renderLabel={i => String(cpiIndexToValue(i))}
        scale="100〜1800"
        onCommit={v => onChange({ ...config, cpiIndex: v })}
      />

      <TrackballSlider
        label="スクロール速度"
        value={config.scrollDiv}
        min={0}
        max={MAX_SCROLL_DIV}
        renderLabel={v => String(v)}
        scale="速〜遅"
        onCommit={v => onChange({ ...config, scrollDiv: v })}
      />

      <TrackballSlider
        label="加速度"
        value={config.accel}
        min={0}
        max={MAX_ACCEL}
        renderLabel={v => v === 0 ? 'オフ' : String(v)}
        scale="オフ〜強"
        onCommit={v => onChange({ ...config, accel: v })}
        dimmed={!accelAvailable}
      />

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
