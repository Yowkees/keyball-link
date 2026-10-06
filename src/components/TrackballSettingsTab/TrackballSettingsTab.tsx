import { useState } from 'react';
import type {
  KbSettings, TrackballConfig, GestureConfig, GestureModeConfig, GestureThreshold, GestureWaveColor,
  PrecisionConfig, ScrollInertiaConfig, ShakeConfig, DFlickConfig, DpiCurveConfig,
} from '../../lib/protocol';
import { LAYER_NONE } from '../../lib/protocol';
import { useLayerConflict } from '../../hooks/useLayerConflict';
import { TrackballSettings } from '../TrackballSettings/TrackballSettings';
import { AutoMouseLayerCard } from '../LayerFeatures/AutoMouseLayerCard';
import { ScrollLayerCard } from '../LayerFeatures/ScrollLayerCard';
import { GestureCard } from '../LayerFeatures/GestureCard';
import { ShakeCard } from '../LayerFeatures/ShakeCard';
import { DoubleFlickCard } from '../LayerFeatures/DoubleFlickCard';
import { PrecisionModeCard } from '../LayerFeatures/PrecisionModeCard';
import type { KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';

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

  const { layerWarn, setLayerWarn, changeLayer } = useLayerConflict(settings, gesture, gestureModes, precision);

  // オートマウスレイヤーはON/OFFを持たず、「切り替わるレイヤー」の「なし」で無効にする
  // （2026-10-06、本人希望）。ファームへはautoMouseEnable/autoMouseLayerの組で保存する。
  const changeAmlLayer = (v: number) => {
    if (v === LAYER_NONE) {
      setLayerWarn(null);
      apply({ autoMouseEnable: false });
      return;
    }
    changeLayer('aml', v, () => apply({ autoMouseEnable: true, autoMouseLayer: v }));
  };

  const cards: BoardCard[] = [
    ...(trackball ? [{
      // 左にCPI・加速度・精密モード、右に速度カーブ
      key: 'ball', title: 'ボール動作・精密モード', className: 'board-card--ball',
      render: () => (
        <>
        <TrackballSettings
          config={trackball}
          onChange={onTrackballChange}
          accelAvailable={accelAvailable}
          dpiCurve={dpiCurve}
          onDpiCurveChange={onDpiCurveChange}
        >
          <PrecisionModeCard
            precision={precision} onPrecisionChange={onPrecisionChange} disabled={disabled} layersInclBase={layersInclBase} layerWarn={layerWarn}
            changePrecisionLayer={v => changeLayer('precision', v, () => onPrecisionChange({ ...precision!, layer: v }))}
          />
        </TrackballSettings>
        </>
      ),
    }] : []),
    {
      // スクロール方向・反転もここに置く（2026-10-06、ボール動作から移動）
      key: 'scroll', title: 'スクロール設定', className: 'board-card--scroll',
      render: () => (
        <ScrollLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeScrollLayer={v => changeLayer('scroll', v, () => apply({ scrollLayer: v }))}
          scrollInertia={scrollInertia} onScrollInertiaChange={onScrollInertiaChange}
          trackball={trackball} onTrackballChange={onTrackballChange}
          onScrollInvertChange={(v, h) => apply({ scrollInvertV: v, scrollInvertH: h })}
        />
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
      key: 'aml', title: 'オートマウスレイヤー', className: 'board-card--aml',
      render: () => (
        <AutoMouseLayerCard
          settings={settings} disabled={disabled} switchableLayers={switchableLayers} layerWarn={layerWarn}
          changeAmlLayer={changeAmlLayer}
          apply={apply}
        />
      ),
    },
    {
      // シェイクとダブルフリックは1枚にまとめ、中を左右2列にする（ON/OFFは各小見出しの右）
      key: 'motion', title: 'シェイク・ダブルフリック', className: 'board-card--motion',
      render: () => (
        <div className="motion-cols">
          <section className="motion-col">
            <div className="motion-col__head">
              <span className="motion-col__title">シェイク</span>
              {shake && <HeaderToggle checked={shake.enable} disabled={disabled} onChange={v => onShakeChange({ ...shake, enable: v })} />}
            </div>
            <ShakeCard shake={shake} onShakeChange={onShakeChange} disabled={disabled} keyLayout={keyLayout} />
          </section>
          <section className="motion-col">
            <div className="motion-col__head">
              <span className="motion-col__title">ダブルフリック</span>
              {dflick && <HeaderToggle checked={dflick.enable} disabled={disabled} onChange={v => onDFlickChange({ ...dflick, enable: v })} />}
            </div>
            <DoubleFlickCard dflick={dflick} onDFlickChange={onDFlickChange} disabled={disabled} keyLayout={keyLayout} />
          </section>
        </div>
      ),
    },
  ];

  // 左に5つのカードのタブ、右に選んだカードを大きく表示する（2026-10-06〜、本人希望）。
  // 並び順: ボール動作・精密モード → スクロール設定 → ジェスチャー → オートマウスレイヤー → シェイク・ダブルフリック
  const order = ['ball', 'scroll', 'gesture', 'aml', 'motion'];
  const ordered = order.map(k => cards.find(c => c.key === k)).filter((c): c is BoardCard => !!c);
  return (
    <div className="settings-tab">
      <SettingsSidebarBoard cards={ordered} />
    </div>
  );
}
