import type { PrecisionConfig } from '../../lib/protocol';
import { LAYER_NONE, PRECISION_DIV_MIN, PRECISION_DIV_MAX } from '../../lib/protocol';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl } from '../SettingsControls/SettingsControls';

interface PrecisionModeCardProps {
  precision: PrecisionConfig | null;
  onPrecisionChange: (p: PrecisionConfig) => Promise<void>;
  disabled: boolean;
  layersInclBase: number[];
  layerWarn: LayerWarn | null;
  changePrecisionLayer: (v: number) => void;
}

export function PrecisionModeCard({ precision, onPrecisionChange, disabled, layersInclBase, layerWarn, changePrecisionLayer }: PrecisionModeCardProps) {
  if (precision === null) {
    return <p className="settings-desc">このファームは非対応です。</p>;
  }
  // 1行目に「精密モード」の見出しと連動レイヤーの選択欄、その下に減速レベル（2026-10-06、本人希望）
  return (
    <div className="precision-card">
      <div className="precision-card__head">
        <span className="precision-card__title">精密モード</span>
        <select
          className="trackball-bar__select"
          value={precision.layer}
          disabled={disabled}
          onChange={e => changePrecisionLayer(Number(e.target.value))}
        >
          <option value={LAYER_NONE}>なし</option>
          {layersInclBase.map(l => (
            <option key={l} value={l}>Layer {l}</option>
          ))}
        </select>
      </div>
      {layerWarn?.target === 'precision' && (
        <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
      )}
      <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>減速レベル</p>
      <SliderControl
        value={precision.div} min={PRECISION_DIV_MIN} max={PRECISION_DIV_MAX} step={1}
        disabled={disabled} unit="分の1"
        onCommit={div => onPrecisionChange({ ...precision, div })}
      />
    </div>
  );
}
