import { useState } from 'react';
import type {
  KbSettings, TrackballConfig, GestureConfig, GestureModeConfig, GestureThreshold,
  PrecisionConfig, ScrollInertiaConfig, ShakeConfig, DFlickConfig, DpiCurveConfig,
} from '../../lib/protocol';
import { useLayerConflict } from '../../hooks/useLayerConflict';
import { TrackballSettings } from '../TrackballSettings/TrackballSettings';
import { AutoMouseLayerCard } from '../LayerFeatures/AutoMouseLayerCard';
import { ScrollLayerCard } from '../LayerFeatures/ScrollLayerCard';
import { GestureCard } from '../LayerFeatures/GestureCard';
import { ShakeCard } from '../LayerFeatures/ShakeCard';
import { DoubleFlickCard } from '../LayerFeatures/DoubleFlickCard';
import { PrecisionModeCard } from '../LayerFeatures/PrecisionModeCard';
import { DpiCurveCard } from '../LayerFeatures/DpiCurveCard';
import type { KeyLayout } from '../../lib/keycodes';

interface TrackballSettingsTabProps {
  isConnected: boolean;
  layerCount: number;
  trackball: TrackballConfig | null;
  onTrackballChange: (cfg: TrackballConfig) => Promise<void>;
  onSave: () => Promise<void>;
  settings: KbSettings;
  onChange: (s: KbSettings) => Promise<void>;
  accelAvailable: boolean;
  dpiCurve: DpiCurveConfig | null;
  onDpiCurveChange: (c: DpiCurveConfig) => Promise<void>;
  gesture: GestureConfig | null;
  onGestureChange: (g: GestureConfig) => Promise<void>;
  gestureModes: GestureModeConfig[] | null;
  onGestureModeChange: (mode: number, g: GestureModeConfig) => Promise<void>;
  gestureThreshold: GestureThreshold | null;
  onGestureThresholdChange: (t: GestureThreshold) => Promise<void>;
  gestureWaveSpeed: number | null;
  onGestureWaveSpeedChange: (speed: number) => Promise<void>;
  gestureWaveEnable: boolean | null;
  onGestureWaveEnableChange: (v: boolean) => Promise<void>;
  shake: ShakeConfig | null;
  onShakeChange: (s: ShakeConfig) => Promise<void>;
  dflick: DFlickConfig | null;
  onDFlickChange: (d: DFlickConfig) => Promise<void>;
  precision: PrecisionConfig | null;
  onPrecisionChange: (p: PrecisionConfig) => Promise<void>;
  scrollInertia: ScrollInertiaConfig | null;
  onScrollInertiaChange: (c: ScrollInertiaConfig) => Promise<void>;
  keyLayout: KeyLayout;
}

type TbSection = 'ball' | 'automouse' | 'scroll' | 'gesture' | 'dpicurve' | 'precision' | 'shake' | 'dflick';

// トップレベル「トラックボール設定」タブ。詳細設定タブと同じ「左に項目一覧・右に詳細」の
// サイドバー形式に統一し、1機能ずつ切り替えて表示する。
export function TrackballSettingsTab({
  isConnected, layerCount, trackball, onTrackballChange, onSave,
  settings, onChange, accelAvailable, dpiCurve, onDpiCurveChange,
  gesture, onGestureChange, gestureModes, onGestureModeChange, gestureThreshold, onGestureThresholdChange,
  gestureWaveSpeed, onGestureWaveSpeedChange, gestureWaveEnable, onGestureWaveEnableChange,
  shake, onShakeChange, dflick, onDFlickChange,
  precision, onPrecisionChange, scrollInertia, onScrollInertiaChange, keyLayout,
}: TrackballSettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const disabled = !isConnected || saving;
  const switchableLayers = Array.from({ length: Math.max(layerCount - 1, 0) }, (_, i) => i + 1);
  const layersInclBase = Array.from({ length: Math.max(layerCount, 0) }, (_, i) => i);

  const apply = async (patch: Partial<KbSettings>) => {
    setSaving(true);
    try {
      await onChange({ ...settings, ...patch });
    } finally {
      setSaving(false);
    }
  };

  const { layerWarn, setLayerWarn, conflictName, changeLayer } = useLayerConflict(settings, gesture, gestureModes, precision);

  const changeAmlEnable = (v: boolean) => {
    if (v) {
      const c = conflictName('aml', settings.autoMouseLayer);
      if (c) {
        setLayerWarn({ target: 'aml', msg: `${c}と同じレイヤーのため有効にできません。先に「切り替わるレイヤー」を別のレイヤーに変更してください。` });
        return;
      }
    }
    setLayerWarn(null);
    apply({ autoMouseEnable: v });
  };

  const sections: { key: TbSection; title: string; note: string; render: () => React.ReactNode }[] = [
    ...(trackball ? [{
      key: 'ball' as const, title: 'ボール動作', note: 'CPI・速度・方向',
      render: () => (
        <TrackballSettings
          config={trackball}
          onChange={onTrackballChange}
          onSave={onSave}
          scrollInvertV={settings.scrollInvertV}
          scrollInvertH={settings.scrollInvertH}
          onScrollInvertChange={(v, h) => apply({ scrollInvertV: v, scrollInvertH: h })}
          accelAvailable={accelAvailable}
          dpiCurveActive={!!dpiCurve?.enable}
        />
      ),
    }] : []),
    {
      key: 'automouse', title: '自動マウスレイヤー', note: 'トラックボール操作で自動レイヤー切替',
      render: () => (
        <AutoMouseLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeAmlEnable={changeAmlEnable}
          changeAmlLayer={v => changeLayer('aml', v, () => apply({ autoMouseLayer: v }))}
          apply={apply}
        />
      ),
    },
    {
      key: 'scroll', title: 'スクロール設定', note: 'スクロールになるレイヤー・慣性',
      render: () => (
        <ScrollLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeScrollLayer={v => changeLayer('scroll', v, () => apply({ scrollLayer: v }))}
          scrollInertia={scrollInertia} onScrollInertiaChange={onScrollInertiaChange}
        />
      ),
    },
    {
      key: 'gesture', title: 'ジェスチャー', note: 'トラックボールを振って操作',
      render: () => (
        <GestureCard
          gesture={gesture} onGestureChange={onGestureChange}
          gestureModes={gestureModes} onGestureModeChange={onGestureModeChange}
          gestureThreshold={gestureThreshold} onGestureThresholdChange={onGestureThresholdChange}
          gestureWaveSpeed={gestureWaveSpeed} onGestureWaveSpeedChange={onGestureWaveSpeedChange}
          gestureWaveEnable={gestureWaveEnable} onGestureWaveEnableChange={onGestureWaveEnableChange}
          disabled={disabled} keyLayout={keyLayout} layersInclBase={layersInclBase} layerWarn={layerWarn}
          changeGestureLayer={v => changeLayer('gesture', v, () => onGestureChange({ ...gesture!, layer: v }))}
          changeGestureModeLayer={(mode, v) => changeLayer('gestureMode', v, () => onGestureModeChange(mode, { ...gestureModes![mode], layer: v }), mode)}
        />
      ),
    },
    {
      key: 'dpicurve', title: 'DPIカーブ', note: '動きの速さに応じた感度をトーンカーブ風に調整',
      render: () => <DpiCurveCard dpiCurve={dpiCurve} onDpiCurveChange={onDpiCurveChange} disabled={disabled} />,
    },
    {
      key: 'precision', title: '精密モード', note: 'トラックボールを精密操作',
      render: () => (
        <PrecisionModeCard
          precision={precision} onPrecisionChange={onPrecisionChange} disabled={disabled} layersInclBase={layersInclBase} layerWarn={layerWarn}
          changePrecisionLayer={v => changeLayer('precision', v, () => onPrecisionChange({ ...precision!, layer: v }))}
        />
      ),
    },
    {
      key: 'shake', title: 'シェイク', note: 'トラックボールを振って発動',
      render: () => <ShakeCard shake={shake} onShakeChange={onShakeChange} disabled={disabled} keyLayout={keyLayout} />,
    },
    {
      key: 'dflick', title: 'ダブルフリック', note: '同じ方向へ素早く2回振って発動',
      render: () => <DoubleFlickCard dflick={dflick} onDFlickChange={onDFlickChange} disabled={disabled} keyLayout={keyLayout} />,
    },
  ];

  const [section, setSection] = useState<TbSection>('ball');
  const active = sections.find(s => s.key === section) ?? sections[0];

  return (
    <div className="settings-tab">
      <div className="settings-sidebar-layout">
        <div className="settings-sidebar">
          {sections.map(s => (
            <button
              key={s.key}
              className={`settings-sidebar__item ${active.key === s.key ? 'settings-sidebar__item--active' : ''}`}
              onClick={() => setSection(s.key)}
            >
              <span className="settings-sidebar__title">{s.title}</span>
              {s.note && <span className="settings-sidebar__note">{s.note}</span>}
            </button>
          ))}
        </div>

        <div className="settings-detail">
          <div className="settings-detail__head">
            <span className="settings-detail__title">{active.title}</span>
            {active.note && <span className="settings-detail__note">{active.note}</span>}
          </div>
          <div className="settings-detail__body">
            {active.render()}
          </div>
        </div>
      </div>
    </div>
  );
}
