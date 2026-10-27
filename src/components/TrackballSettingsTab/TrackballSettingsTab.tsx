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
import { HeaderToggle } from '../SettingsControls/SettingsControls';
import { TIPS } from '../../lib/tips';

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
  // キーマップタブの右側の狭いパネルに出す時はtrue。上に小さなタブを並べ、選んだ項目だけを表示する
  compact?: boolean;
  compactLayer?: number;  // compactの時に設定するレイヤー（キーマップで表示中のレイヤー）
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
  precision, onPrecisionChange, scrollInertia, onScrollInertiaChange, keyLayout, compact = false, compactLayer = 0,
}: TrackballSettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const [compactMsg, setCompactMsg] = useState<string | null>(null);
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
              <span className="motion-col__title" data-tip={TIPS.shake}>シェイク</span>
              {shake && <HeaderToggle checked={shake.enable} disabled={disabled} onChange={v => onShakeChange({ ...shake, enable: v })} />}
            </div>
            <ShakeCard shake={shake} onShakeChange={onShakeChange} disabled={disabled} keyLayout={keyLayout} />
          </section>
          <section className="motion-col">
            <div className="motion-col__head">
              <span className="motion-col__title" data-tip={TIPS.dflick}>ダブルフリック</span>
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
  if (compact) {
    // キーマップのトラックボールから開いた時の表示（2026-10-27、本人希望）。まず「このレイヤーで
    // ボールを何として動かすか」を選び、その下に選んだ機能の詳細設定を出す。選ぶと、そのレイヤーの
    // 連動設定（スクロールレイヤー・ジェスチャーnの連動レイヤー・精密モードの連動レイヤー）を書き換える。
    const L = compactLayer;
    const gmIndex = gestureModes ? gestureModes.findIndex(m => m.layer === L) : -1;
    const legacyGesture = !gestureModes && gesture?.layer === L;
    const motion: string = settings.scrollLayer === L ? 'scroll' : gmIndex >= 0 ? `g${gmIndex}` : legacyGesture ? 'g' : 'cursor';
    const precisionOn = precision?.layer === L;
    const amlHere = settings.autoMouseEnable && settings.autoMouseLayer === L;
    const options: { key: string; label: string; note?: string; disabled?: string }[] = [
      { key: 'cursor', label: 'カーソル' },
      {
        key: 'scroll', label: 'スクロール',
        note: settings.scrollLayer !== LAYER_NONE && settings.scrollLayer !== L ? `今はLayer ${settings.scrollLayer}。選ぶとこちらに移ります` : undefined,
        disabled: L === 0 ? 'Layer 0では選べません（「スクロール」キーで切り替えられます）' : amlHere ? 'オートマウスレイヤーと同じレイヤーには設定できません' : undefined,
      },
      ...(gestureModes
        ? gestureModes.map((m, i) => ({
            key: `g${i}`, label: `ジェスチャー${i + 1}`,
            note: m.layer !== LAYER_NONE && m.layer !== L ? `今はLayer ${m.layer}。選ぶとこちらに移ります` : undefined,
            disabled: amlHere ? 'オートマウスレイヤーと同じレイヤーには設定できません' : undefined,
          }))
        : gesture ? [{ key: 'g', label: 'ジェスチャー', disabled: amlHere ? 'オートマウスレイヤーと同じレイヤーには設定できません' : undefined }] : []),
    ];

    const run = async (fn: () => Promise<void>) => {
      setSaving(true);
      setCompactMsg(null);
      try { await fn(); } finally { setSaving(false); }
    };
    // このレイヤーに付いている動きの連動を外してから、選んだものを付ける
    const chooseMotion = (key: string) => run(async () => {
      if (key === motion) return;
      if (settings.scrollLayer === L && key !== 'scroll') await onChange({ ...settings, scrollLayer: LAYER_NONE });
      if (gestureModes) {
        for (let i = 0; i < gestureModes.length; i++) {
          if (gestureModes[i].layer === L && key !== `g${i}`) await onGestureModeChange(i, { ...gestureModes[i], layer: LAYER_NONE });
        }
      }
      if (gesture && gesture.layer === L && key !== 'g') await onGestureChange({ ...gesture, layer: LAYER_NONE });
      const toGesture = key.startsWith('g');
      if (toGesture && precision && precision.layer === L) {
        await onPrecisionChange({ ...precision, layer: LAYER_NONE });
        setCompactMsg('ジェスチャーと精密モードは同時に使えないため、精密モードをOFFにしました');
      }
      if (key === 'scroll') await onChange({ ...settings, scrollLayer: L });
      else if (key === 'g' && gesture) await onGestureChange({ ...gesture, layer: L });
      else if (toGesture && gestureModes) {
        const i = Number(key.slice(1));
        await onGestureModeChange(i, { ...gestureModes[i], layer: L });
      }
    });
    const togglePrecision = (on: boolean) => run(async () => {
      if (!precision) return;
      await onPrecisionChange({ ...precision, layer: on ? L : LAYER_NONE });
    });

    const detail = (() => {
      if (motion === 'scroll') return cards.find(c => c.key === 'scroll');
      if (motion.startsWith('g')) return null;  // 下でモードを指定して表示する
      return cards.find(c => c.key === 'ball');
    })();
    return (
      <div className="tb-compact">
        <div className="tb-compact__header">Layer {L} のトラックボール</div>
        <div className="tb-compact__body">
          <div className="tb-compact__title">① 動き</div>
          <div className="tb-compact__choices">
            {options.map(o => (
              <label key={o.key} className={`tb-compact__choice ${motion === o.key ? 'tb-compact__choice--active' : ''} ${o.disabled ? 'tb-compact__choice--disabled' : ''}`} title={o.disabled}>
                <input type="radio" name="tb-motion" checked={motion === o.key} disabled={disabled || !!o.disabled} onChange={() => chooseMotion(o.key)} />
                <span>{o.label}</span>
                {o.note && motion !== o.key && <span className="tb-compact__note">{o.note}</span>}
              </label>
            ))}
          </div>
          {precision && (
            <>
              <div className="tb-compact__title">② 精密モード</div>
              <label className={`tb-compact__choice ${motion.startsWith('g') ? 'tb-compact__choice--disabled' : ''}`}>
                <input type="checkbox" checked={precisionOn} disabled={disabled || motion.startsWith('g')} onChange={e => togglePrecision(e.target.checked)} />
                <span>ゆっくり動かす（精密モード）</span>
                {precision.layer !== LAYER_NONE && precision.layer !== L && <span className="tb-compact__note">今はLayer {precision.layer}。ONにするとこちらに移ります</span>}
              </label>
            </>
          )}
          {compactMsg && <p className="tb-compact__msg">{compactMsg}</p>}
          <div className="tb-compact__title">③ 詳細設定</div>
          {detail ? detail.render(0) : (
            <GestureCard
              key={motion}
              initialModeTab={motion.startsWith('g') && motion.length > 1 ? Number(motion.slice(1)) : 0}
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
          )}
          <p className="tb-compact__more">オートマウスレイヤー・シェイク・ダブルフリックは「トラックボール設定」タブで設定できます</p>
        </div>
      </div>
    );
  }
  return (
    <div className="settings-tab">
      <SettingsSidebarBoard cards={ordered} />
    </div>
  );
}
