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

// カード見出しの右端に置く機能のON/OFF（2026-10-06〜。以前はカード内の
// 「〜を使う」「〜を有効化」の行だったが、本人希望で見出しの右に移した）
function HeaderToggle({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`toggle-btn ${checked ? 'toggle-btn--on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      {checked ? 'ON' : 'OFF'}
    </button>
  );
}

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

  const cards: BoardCard[] = [
    ...(trackball ? [{
      // 横2列分の横長カードにして、左に設定・右に速度カーブを並べる（タブで分けない）
      key: 'ball', title: 'ボール動作', className: 'board-card--ball',
      render: () => (
        <TrackballSettings
          config={trackball}
          onChange={onTrackballChange}
          scrollInvertV={settings.scrollInvertV}
          scrollInvertH={settings.scrollInvertH}
          onScrollInvertChange={(v, h) => apply({ scrollInvertV: v, scrollInvertH: h })}
          accelAvailable={accelAvailable}
          dpiCurve={dpiCurve}
          onDpiCurveChange={onDpiCurveChange}
        />
      ),
    }] : []),
    {
      // スクロール設定と精密モードは1枚にまとめ、縦2段分を使う（タブで分けない）
      key: 'scroll', title: 'スクロール設定・精密モード',
      render: () => (
        <>
          <ScrollLayerCard
            settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
            changeScrollLayer={v => changeLayer('scroll', v, () => apply({ scrollLayer: v }))}
            scrollInertia={scrollInertia} onScrollInertiaChange={onScrollInertiaChange}
            trackball={trackball} onTrackballChange={onTrackballChange}
          />
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <p className="settings-desc" style={{ fontWeight: 600 }}>精密モード</p>
            <PrecisionModeCard
              precision={precision} onPrecisionChange={onPrecisionChange} disabled={disabled} layersInclBase={layersInclBase} layerWarn={layerWarn}
              changePrecisionLayer={v => changeLayer('precision', v, () => onPrecisionChange({ ...precision!, layer: v }))}
            />
          </div>
        </>
      ),
    },
    {
      // 横2列分を使い、中を左右2列（割り当て・感度｜ウェーブ）に分ける
      key: 'gesture', title: 'ジェスチャー', className: 'board-card--gesture',
      render: () => (
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
        />
      ),
    },
    {
      key: 'aml', title: '自動マウスレイヤー',
      headerRight: <HeaderToggle checked={settings.autoMouseEnable} disabled={disabled} onChange={changeAmlEnable} />,
      render: () => (
        <AutoMouseLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeAmlLayer={v => changeLayer('aml', v, () => apply({ autoMouseLayer: v }))}
          apply={apply}
        />
      ),
    },
    {
      key: 'shake', title: 'シェイク',
      headerRight: shake ? <HeaderToggle checked={shake.enable} disabled={disabled} onChange={v => onShakeChange({ ...shake, enable: v })} /> : undefined,
      render: () => <ShakeCard shake={shake} onShakeChange={onShakeChange} disabled={disabled} keyLayout={keyLayout} />,
    },
    {
      key: 'dflick', title: 'ダブルフリック',
      headerRight: dflick ? <HeaderToggle checked={dflick.enable} disabled={disabled} onChange={v => onDFlickChange({ ...dflick, enable: v })} /> : undefined,
      render: () => <DoubleFlickCard dflick={dflick} onDFlickChange={onDFlickChange} disabled={disabled} keyLayout={keyLayout} />,
    },
  ];

  // 13〜14インチのノートPCで1画面に収まる配置（6列×2段、カード内のタブは使わず全部表示）。
  // ボール動作は横2列分、ジェスチャーは横2列×縦2段、スクロール設定（精密モード込み）と
  // ダブルフリックは縦2段、自動マウスレイヤーとシェイクはボール動作の下に1マスずつ。
  // 上段の高さはボール動作の中身に合わせ、残りを下段に回す。
  return (
    <div className="settings-tab">
      <SettingsBoard
        cards={cards}
        columns="repeat(6, minmax(0, 1fr))"
        rows="auto minmax(0, 1fr)"
        areas={[
          'ball ball gesture gesture scroll dflick',
          'aml shake gesture gesture scroll dflick',
        ]}
      />
    </div>
  );
}
