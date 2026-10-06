import { useState } from 'react';
import type {
  KbSettings, TrackballConfig, GestureConfig, GestureModeConfig, GestureThreshold, GestureWaveColor,
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
import type { KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import { SettingsBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';

interface TrackballSettingsTabProps {
  isConnected: boolean;
  layerCount: number;
  avail: FirmwareAvail;
  trackball: TrackballConfig | null;
  onTrackballChange: (cfg: TrackballConfig) => Promise<void>;
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
  gestureWaveSpeed: number[] | null;
  onGestureWaveSpeedChange: (mode: number, speed: number) => Promise<void>;
  gestureWaveEnable: boolean | null;
  onGestureWaveEnableChange: (v: boolean) => Promise<void>;
  gestureWaveStyle: number[] | null;
  onGestureWaveStyleChange: (mode: number, style: number) => Promise<void>;
  gestureWaveColor: GestureWaveColor[] | null;
  onGestureWaveColorChange: (mode: number, c: GestureWaveColor) => Promise<void>;
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

// トップレベル「トラックボール設定」タブ。全項目をカードにして画面いっぱいに並べる
// （2026-10-06〜。以前は「左に項目一覧・右に詳細」のサイドバー形式）。
export function TrackballSettingsTab({
  isConnected, layerCount, avail, trackball, onTrackballChange,
  settings, onChange, accelAvailable, dpiCurve, onDpiCurveChange,
  gesture, onGestureChange, gestureModes, onGestureModeChange, gestureThreshold, onGestureThresholdChange,
  gestureWaveSpeed, onGestureWaveSpeedChange, gestureWaveEnable, onGestureWaveEnableChange,
  gestureWaveStyle, onGestureWaveStyleChange, gestureWaveColor, onGestureWaveColorChange,
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

  const hasWave = gestureModes !== null && gestureWaveSpeed !== null && gestureWaveEnable !== null;

  const cards: BoardCard[] = [
    ...(trackball ? [{
      key: 'ball', title: 'ボール動作', panes: ['基本', '速度カーブ'],
      render: (pane: number) => (
        <TrackballSettings
          config={trackball}
          onChange={onTrackballChange}
          scrollInvertV={settings.scrollInvertV}
          scrollInvertH={settings.scrollInvertH}
          onScrollInvertChange={(v, h) => apply({ scrollInvertV: v, scrollInvertH: h })}
          accelAvailable={accelAvailable}
          dpiCurve={dpiCurve}
          onDpiCurveChange={onDpiCurveChange}
          part={pane === 0 ? 'basic' : 'curve'}
        />
      ),
    }] : []),
    {
      key: 'scroll', title: 'スクロール設定', panes: ['基本', '慣性'],
      render: pane => (
        <ScrollLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeScrollLayer={v => changeLayer('scroll', v, () => apply({ scrollLayer: v }))}
          scrollInertia={scrollInertia} onScrollInertiaChange={onScrollInertiaChange}
          trackball={trackball} onTrackballChange={onTrackballChange}
          part={pane === 0 ? 'basic' : 'inertia'}
        />
      ),
    },
    {
      key: 'gesture', title: 'ジェスチャー',
      panes: hasWave ? ['キー割り当て', '感度', 'ウェーブ'] : ['キー割り当て', '感度'],
      render: pane => (
        <GestureCard
          gesture={gesture} onGestureChange={onGestureChange}
          gestureModes={gestureModes} onGestureModeChange={onGestureModeChange}
          gestureThreshold={gestureThreshold} onGestureThresholdChange={onGestureThresholdChange}
          gestureWaveSpeed={gestureWaveSpeed} onGestureWaveSpeedChange={onGestureWaveSpeedChange}
          gestureWaveEnable={gestureWaveEnable} onGestureWaveEnableChange={onGestureWaveEnableChange}
          gestureWaveStyle={gestureWaveStyle} onGestureWaveStyleChange={onGestureWaveStyleChange}
          gestureWaveColor={gestureWaveColor} onGestureWaveColorChange={onGestureWaveColorChange}
          disabled={disabled} keyLayout={keyLayout} avail={avail} layersInclBase={layersInclBase} layerWarn={layerWarn}
          changeGestureLayer={v => changeLayer('gesture', v, () => onGestureChange({ ...gesture!, layer: v }))}
          changeGestureModeLayer={(mode, v) => changeLayer('gestureMode', v, () => onGestureModeChange(mode, { ...gestureModes![mode], layer: v }), mode)}
          part={(['keys', 'sensitivity', 'wave'] as const)[pane]}
        />
      ),
    },
    {
      key: 'aml', title: '自動マウスレイヤー', panes: ['基本', '詳細'],
      render: pane => (
        <AutoMouseLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeAmlEnable={changeAmlEnable}
          changeAmlLayer={v => changeLayer('aml', v, () => apply({ autoMouseLayer: v }))}
          apply={apply}
          part={pane === 0 ? 'basic' : 'detail'}
        />
      ),
    },
    {
      key: 'precision', title: '精密モード', note: '押している間だけ感度を下げる',
      render: () => (
        <PrecisionModeCard
          precision={precision} onPrecisionChange={onPrecisionChange} disabled={disabled} layersInclBase={layersInclBase} layerWarn={layerWarn}
          changePrecisionLayer={v => changeLayer('precision', v, () => onPrecisionChange({ ...precision!, layer: v }))}
        />
      ),
    },
    {
      key: 'shake', title: 'シェイク', panes: shake ? ['基本', '詳細'] : undefined,
      render: pane => <ShakeCard shake={shake} onShakeChange={onShakeChange} disabled={disabled} keyLayout={keyLayout} part={pane === 0 ? 'basic' : 'detail'} />,
    },
    {
      key: 'dflick', title: 'ダブルフリック', panes: dflick ? ['キー割り当て', '詳細'] : undefined,
      render: pane => <DoubleFlickCard dflick={dflick} onDFlickChange={onDFlickChange} disabled={disabled} keyLayout={keyLayout} part={pane === 0 ? 'keys' : 'detail'} />,
    },
  ];

  // 13〜14インチのノートPCで1画面に収まる配置。ジェスチャーは中身が多いので
  // 縦2段分を使い、他は1段ずつ。ボール動作が無い（未接続）時は隣のカードが広がる。
  return (
    <div className="settings-tab">
      <SettingsBoard
        cards={cards}
        columns="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr)"
        areas={[
          'ball scroll gesture aml',
          'precision shake gesture dflick',
        ]}
      />
    </div>
  );
}
