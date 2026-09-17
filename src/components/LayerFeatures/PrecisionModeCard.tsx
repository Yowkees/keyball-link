import type { PrecisionConfig } from '../../lib/protocol';
import { LAYER_NONE, PRECISION_DIV_MIN, PRECISION_DIV_MAX, PRECISION_DIV_DEFAULT } from '../../lib/protocol';
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
  return (
    <>
      <p className="settings-desc">
        パレットの<strong>「精密モード」キー</strong>を押している間だけ感度が下がります。
      </p>
      <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>減速の強さ</p>
      <SliderControl
        value={precision.div} min={PRECISION_DIV_MIN} max={PRECISION_DIV_MAX} step={1}
        disabled={disabled} unit="分の1"
        onCommit={div => onPrecisionChange({ ...precision, div })}
      />
      <div className="tapping-term-hints">
        <span>{PRECISION_DIV_MIN}（少し遅い）</span>
        <span>デフォルト: {PRECISION_DIV_DEFAULT}</span>
        <span>{PRECISION_DIV_MAX}（かなり遅い）</span>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__label">精密モードになるレイヤー</span>
          </div>
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
      </div>
    </>
  );
}
