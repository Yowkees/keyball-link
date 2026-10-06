import type { KbSettings, ScrollInertiaConfig, TrackballConfig } from '../../lib/protocol';
import { LAYER_NONE, SCROLL_INERTIA_STRENGTH_MIN, SCROLL_INERTIA_STRENGTH_MAX, SCROLL_INERTIA_FLICK_MULT_MIN, SCROLL_INERTIA_FLICK_MULT_MAX } from '../../lib/protocol';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';

const SCROLL_DIV_MAX = 7;

interface ScrollLayerCardProps {
  settings: KbSettings;
  disabled: boolean;
  switchableLayers: number[];
  layerWarn: LayerWarn | null;
  changeScrollLayer: (v: number) => void;
  scrollInertia: ScrollInertiaConfig | null;
  onScrollInertiaChange: (c: ScrollInertiaConfig) => Promise<void>;
  trackball: TrackballConfig | null;  // スクロール速度(scrollDiv)はトラックボール設定の一部として保存される
  onTrackballChange: (cfg: TrackballConfig) => Promise<void>;
}

export function ScrollLayerCard({ settings, disabled, switchableLayers, layerWarn, changeScrollLayer, scrollInertia, onScrollInertiaChange, trackball, onTrackballChange }: ScrollLayerCardProps) {
  // 「レイヤー・速度」と「慣性スクロール」の2ブロック。横長カードでは左右に並べる（index.css）
  return (
    <div className="scroll-card">
      <div className="scroll-card__basic">
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

      {trackball && (
        <div style={{ marginTop: 14 }}>
          <p className="settings-desc" style={{ fontWeight: 600 }}>スクロール速度</p>
          <SliderControl
            value={trackball.scrollDiv} min={0} max={SCROLL_DIV_MAX} step={1}
            disabled={disabled} unit="" invert
            onCommit={v => onTrackballChange({ ...trackball, scrollDiv: v })}
          />
        </div>
      )}
      </div>

      <div className="scroll-card__inertia">
        {scrollInertia === null ? (
          <p className="settings-desc">このファームは非対応です。</p>
        ) : (
          <>
            <ToggleRow
              label="慣性スクロール"
              desc=""
              checked={scrollInertia.enable}
              disabled={disabled}
              onChange={v => onScrollInertiaChange({ ...scrollInertia, enable: v })}
            />
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>慣性レベル</p>
            <SliderControl
              value={scrollInertia.strength} min={SCROLL_INERTIA_STRENGTH_MIN} max={SCROLL_INERTIA_STRENGTH_MAX} step={1}
              disabled={disabled || !scrollInertia.enable} unit=""
              onCommit={v => onScrollInertiaChange({ ...scrollInertia, strength: v })}
            />
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>発動しやすさ</p>
            <SliderControl
              value={scrollInertia.flickMult} min={SCROLL_INERTIA_FLICK_MULT_MIN} max={SCROLL_INERTIA_FLICK_MULT_MAX} step={1}
              disabled={disabled || !scrollInertia.enable} unit="" invert
              onCommit={v => onScrollInertiaChange({ ...scrollInertia, flickMult: v })}
            />
          </>
        )}
      </div>
    </div>
  );
}
