import type { KbSettings, ScrollInertiaConfig } from '../../lib/protocol';
import { LAYER_NONE, SCROLL_INERTIA_STRENGTH_MIN, SCROLL_INERTIA_STRENGTH_MAX, SCROLL_INERTIA_STRENGTH_DEFAULT, SCROLL_INERTIA_FLICK_MULT_MIN, SCROLL_INERTIA_FLICK_MULT_MAX, SCROLL_INERTIA_FLICK_MULT_DEFAULT } from '../../lib/protocol';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';

interface ScrollLayerCardProps {
  settings: KbSettings;
  disabled: boolean;
  switchableLayers: number[];
  layerWarn: LayerWarn | null;
  changeScrollLayer: (v: number) => void;
  scrollInertia: ScrollInertiaConfig | null;
  onScrollInertiaChange: (c: ScrollInertiaConfig) => Promise<void>;
}

export function ScrollLayerCard({ settings, disabled, switchableLayers, layerWarn, changeScrollLayer, scrollInertia, onScrollInertiaChange }: ScrollLayerCardProps) {
  return (
    <>
      <div className="setting-row">
        <div className="setting-row__text">
          <span className="setting-row__label">スクロールになるレイヤー</span>
        </div>
        <select
          className="trackball-bar__select"
          value={settings.scrollLayer}
          disabled={disabled}
          onChange={e => changeScrollLayer(Number(e.target.value))}
        >
          <option value={LAYER_NONE}>なし</option>
          {switchableLayers.map(l => (
            <option key={l} value={l}>Layer {l}</option>
          ))}
        </select>
      </div>
      {layerWarn?.target === 'scroll' && (
        <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
      )}

      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>慣性スクロール</p>
        {scrollInertia === null ? (
          <p className="settings-desc">このファームは非対応です。</p>
        ) : (
          <>
            <ToggleRow
              label="慣性スクロール"
              desc="弾いた後もしばらく滑ります。"
              checked={scrollInertia.enable}
              disabled={disabled}
              onChange={v => onScrollInertiaChange({ ...scrollInertia, enable: v })}
            />
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>強さ</p>
            <SliderControl
              value={scrollInertia.strength} min={SCROLL_INERTIA_STRENGTH_MIN} max={SCROLL_INERTIA_STRENGTH_MAX} step={1}
              disabled={disabled || !scrollInertia.enable} unit=""
              onCommit={v => onScrollInertiaChange({ ...scrollInertia, strength: v })}
            />
            <div className="tapping-term-hints">
              <span>0（すぐ止まる）</span>
              <span>デフォルト: {SCROLL_INERTIA_STRENGTH_DEFAULT}</span>
              <span>{SCROLL_INERTIA_STRENGTH_MAX}（長く滑る）</span>
            </div>
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>発動しやすさ</p>
            <SliderControl
              value={scrollInertia.flickMult} min={SCROLL_INERTIA_FLICK_MULT_MIN} max={SCROLL_INERTIA_FLICK_MULT_MAX} step={1}
              disabled={disabled || !scrollInertia.enable} unit=""
              format={v => `${(v / 10).toFixed(1)}倍`}
              onCommit={v => onScrollInertiaChange({ ...scrollInertia, flickMult: v })}
            />
            <div className="tapping-term-hints">
              <span>{(SCROLL_INERTIA_FLICK_MULT_MIN / 10).toFixed(1)}倍（発動しやすい）</span>
              <span>デフォルト: {(SCROLL_INERTIA_FLICK_MULT_DEFAULT / 10).toFixed(1)}倍</span>
              <span>{(SCROLL_INERTIA_FLICK_MULT_MAX / 10).toFixed(1)}倍（よほど速くないと発動しない）</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
