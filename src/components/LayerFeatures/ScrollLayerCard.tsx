import type { KbSettings, ScrollInertiaConfig, TrackballConfig } from '../../lib/protocol';
import { LAYER_NONE, SCROLL_MODE, SCROLL_INERTIA_STRENGTH_MIN, SCROLL_INERTIA_STRENGTH_MAX, SCROLL_INERTIA_FLICK_MULT_MIN, SCROLL_INERTIA_FLICK_MULT_MAX } from '../../lib/protocol';
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
  onScrollInvertChange: (v: boolean, h: boolean) => void;
}

export function ScrollLayerCard({ settings, disabled, switchableLayers, layerWarn, changeScrollLayer, scrollInertia, onScrollInertiaChange, trackball, onTrackballChange, onScrollInvertChange }: ScrollLayerCardProps) {
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
          <div className="setting-row scroll-card__row">
            <span className="settings-desc scroll-card__label">スクロール方向</span>
            <select
              className="trackball-bar__select"
              value={trackball.scrollMode}
              disabled={disabled}
              onChange={e => onTrackballChange({ ...trackball, scrollMode: Number(e.target.value) })}
            >
              <option value={SCROLL_MODE.VERTICAL}>縦のみ</option>
              <option value={SCROLL_MODE.HORIZONTAL}>横のみ</option>
              <option value={SCROLL_MODE.FREE}>自由（縦横）</option>
            </select>
          </div>
          <div className="setting-row scroll-card__row">
            <span className="settings-desc scroll-card__label">反転</span>
            <button
              className={`btn btn--small btn--layer ${settings.scrollInvertV ? 'btn--layer-active' : ''}`}
              disabled={disabled}
              onClick={() => onScrollInvertChange(!settings.scrollInvertV, settings.scrollInvertH)}
            >
              縦 {settings.scrollInvertV ? 'ON' : 'OFF'}
            </button>
            <button
              className={`btn btn--small btn--layer ${settings.scrollInvertH ? 'btn--layer-active' : ''}`}
              disabled={disabled}
              onClick={() => onScrollInvertChange(settings.scrollInvertV, !settings.scrollInvertH)}
            >
              横 {settings.scrollInvertH ? 'ON' : 'OFF'}
            </button>
          </div>
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
