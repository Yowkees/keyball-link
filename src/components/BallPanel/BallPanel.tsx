import { useState } from 'react';
import type { KbSettings, ScrollInertiaConfig, TrackballConfig, PrecisionConfig, GestureConfig, GestureModeConfig, GestureThreshold, GestureWaveColor } from '../../lib/protocol';
import type { KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import { getKeyDisplayLabel, isGestureExcludedKeycode } from '../../lib/keycodes';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';
import {
  LAYER_NONE, PRECISION_DIV_MIN, PRECISION_DIV_MAX, SCROLL_MODE, cpiIndexToValue, computeAccelCurvePoints,
  SCROLL_INERTIA_STRENGTH_MIN, SCROLL_INERTIA_STRENGTH_MAX, SCROLL_INERTIA_FLICK_MULT_MIN, SCROLL_INERTIA_FLICK_MULT_MAX,
} from '../../lib/protocol';
import { DpiCurveEditor } from '../DpiCurveEditor/DpiCurveEditor';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { buildHueGradient } from '../../lib/hueGradient';

// キーマップのトラックボールを押した時に、右側に出すトラックボールの設定（2026-10-27、本人希望）。
// LED設定パネル（LedPanel）と同じ作り: 上に「動き」の選択欄、その下にスイッチとスライダー。
// 対象のレイヤーはキー配列の上で選んでいるレイヤー（LED設定も同じ。2026-10-27、本人希望）。
// 動きを選ぶと、そのレイヤーの連動設定（スクロールレイヤー・精密モードの連動レイヤー・
// ジェスチャーnの連動レイヤー）を書き換える。別のレイヤーで使っている機能は、そちらで外すまで
// 選べない（本人希望。勝手に移すと分かりにくいため）。
// ここには選んだ動きに関係するものだけを出す（シェイクなどは「トラックボール設定」タブ）。

const MAX_CPI_INDEX = 17;   // TrackballSettings.tsxと同じ
const MAX_ACCEL = 10;
const SCROLL_DIV_MAX = 7;   // ScrollLayerCard.tsxと同じ

interface BallPanelProps {
  layer: number;   // キー配列で選んでいるレイヤー
  disabled: boolean;
  settings: KbSettings;
  onChange: (s: KbSettings) => Promise<void>;
  trackball: TrackballConfig | null;
  onTrackballChange: (cfg: TrackballConfig) => Promise<void>;
  accelAvailable: boolean;  // LED版の44/61では加速度が無効
  scrollInertia: ScrollInertiaConfig | null;  // 非対応ファームではnull
  onScrollInertiaChange: (c: ScrollInertiaConfig) => Promise<void>;
  precision: PrecisionConfig | null;
  onPrecisionChange: (p: PrecisionConfig) => Promise<void>;
  gesture: GestureConfig | null;
  onGestureChange: (g: GestureConfig) => Promise<void>;
  gestureModes: GestureModeConfig[] | null;
  onGestureModeChange: (mode: number, g: GestureModeConfig) => Promise<void>;
  gestureThreshold: GestureThreshold | null;
  onGestureThresholdChange: (t: GestureThreshold) => Promise<void>;
  // ジェスチャーウェーブ（ジェスチャー発動時にLEDを流す）。nullなら非対応ファーム
  gestureWaveEnable: boolean | null;
  onGestureWaveEnableChange: (v: boolean) => Promise<void>;
  gestureWaveStyle: number[] | null;
  onGestureWaveStyleChange: (mode: number, style: number) => Promise<void>;
  gestureWaveColor: GestureWaveColor[] | null;
  onGestureWaveColorChange: (mode: number, c: GestureWaveColor) => Promise<void>;
  gestureWaveSpeed: number[] | null;
  onGestureWaveSpeedChange: (mode: number, speed: number) => Promise<void>;
  onOpenTab: () => void;
  keyLayout: KeyLayout;
  avail: FirmwareAvail;
}

export function BallPanel(p: BallPanelProps) {
  const layer = p.layer;
  const [busy, setBusy] = useState(false);
  const disabled = p.disabled || busy;
  const L = layer;
  const { settings, precision, gesture, gestureModes } = p;

  // 今の動き（カーソル・スクロール・ジェスチャーn）。精密モードはカーソル・スクロールに
  // 付けられる別のON/OFF（2026-10-27、本人希望で詳細設定側に移した）
  const motionOf = (l: number): string => {
    const gi = gestureModes ? gestureModes.findIndex(m => m.layer === l) : -1;
    if (settings.scrollLayer === l) return 'scroll';
    if (gi >= 0) return `g${gi}`;
    if (!gestureModes && gesture?.layer === l) return 'g';
    return 'cursor';
  };
  const motion = motionOf(L);
  const isGesture = motion.startsWith('g');
  const precisionOn = precision?.layer === L;
  const amlHere = settings.autoMouseEnable && settings.autoMouseLayer === L;

  // 選択肢には全ての機能を並べ、別のレイヤーで使っている機能はグレーにして「（レイヤー○）」と添える（本人希望）。
  // スクロールはレイヤー0とオートマウスのレイヤーでは、ジェスチャーはオートマウスのレイヤーでは選べない。
  const usedElsewhere = (l: number) => l !== LAYER_NONE && l !== L;
  const opt = (key: string, label: string, used: number, blocked: boolean) => ({
    key,
    label: usedElsewhere(used) ? `${label}（レイヤー${used}）` : label,
    disabled: usedElsewhere(used) || blocked,
  });
  const options: { key: string; label: string; disabled: boolean }[] = [
    { key: 'cursor', label: 'カーソル', disabled: false },
    opt('scroll', 'スクロール', settings.scrollLayer, L === 0 || amlHere),
    ...(gestureModes
      ? gestureModes.map((m, i) => opt(`g${i}`, `ジェスチャー${i + 1}`, m.layer, amlHere))
      : gesture ? [opt('g', 'ジェスチャー', gesture.layer, amlHere)] : []),
  ];
  const precElsewhere = precision ? usedElsewhere(precision.layer) : false;
  const [editDir, setEditDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  // このレイヤーの動きを key にする（このレイヤーに付いていた他の動きの連動は外す）。
  // ジェスチャーと精密モードは同時に使えないので、ジェスチャーにした時は精密モードを外す。
  const chooseMotion = (key: string) => run(async () => {
    if (settings.scrollLayer === L && key !== 'scroll') await p.onChange({ ...settings, scrollLayer: LAYER_NONE });
    if (key === 'scroll' && settings.scrollLayer !== L) await p.onChange({ ...settings, scrollLayer: L });
    if (gestureModes) {
      for (let i = 0; i < gestureModes.length; i++) {
        const m = gestureModes[i];
        if (key === `g${i}` && m.layer !== L) await p.onGestureModeChange(i, { ...m, layer: L });
        else if (key !== `g${i}` && m.layer === L) await p.onGestureModeChange(i, { ...m, layer: LAYER_NONE });
      }
    } else if (gesture) {
      if (key === 'g' && gesture.layer !== L) await p.onGestureChange({ ...gesture, layer: L });
      else if (key !== 'g' && gesture.layer === L) await p.onGestureChange({ ...gesture, layer: LAYER_NONE });
    }
    if (key.startsWith('g') && precision && precision.layer === L) await p.onPrecisionChange({ ...precision, layer: LAYER_NONE });
  });

  const togglePrecision = (on: boolean) => run(async () => {
    if (!precision) return;
    await p.onPrecisionChange({ ...precision, layer: on ? L : LAYER_NONE });
  });

  const tb = p.trackball;
  return (
    <>
      <div className="led-panel__title">トラックボール設定</div>
      <div className="led-panel ball-panel">
        <div className="led-panel__toprow">
          <select
            className="trackball-bar__select led-panel__effect-select"
            value={motion}
            disabled={disabled}
            onChange={e => chooseMotion(e.target.value)}
          >
            {options.map(o => <option key={o.key} value={o.key} disabled={o.disabled}>{o.label}</option>)}
          </select>
        </div>


        <div className="led-panel__sliders ball-panel__sliders">
          {tb && motion === 'cursor' && (
            <>
              <span className="ball-panel__label">速さ（CPI）</span>
              <SliderControl value={tb.cpiIndex} min={0} max={MAX_CPI_INDEX} step={1} disabled={disabled} unit=""
                format={v => String(cpiIndexToValue(v))} onCommit={v => p.onTrackballChange({ ...tb, cpiIndex: v })} />
              <span className="ball-panel__label">加速度</span>
              <SliderControl value={tb.accel} min={0} max={MAX_ACCEL} step={1} disabled={disabled || !p.accelAvailable} unit=""
                format={v => (!p.accelAvailable ? '—' : v === 0 ? 'オフ' : String(v))} onCommit={v => p.onTrackballChange({ ...tb, accel: v })} />
              {!p.accelAvailable && <p className="settings-desc">この版（LED版）では加速度は使用できません</p>}
              <div className="ball-panel__curve">
                <DpiCurveEditor points={computeAccelCurvePoints(tb.accel)} disabled={!p.accelAvailable} interactive={false} yMax={127} />
              </div>
            </>
          )}
          {tb && motion === 'scroll' && (
            <>
              <span className="ball-panel__label">スクロール速度</span>
              <SliderControl value={tb.scrollDiv} min={0} max={SCROLL_DIV_MAX} step={1} disabled={disabled} unit="" invert
                onCommit={v => p.onTrackballChange({ ...tb, scrollDiv: v })} />
              <ToggleRow label="縦スクロールを反転" desc="" checked={settings.scrollInvertV} disabled={disabled}
                onChange={v => run(() => p.onChange({ ...settings, scrollInvertV: v }))} />
              <ToggleRow label="横スクロールを反転" desc="" checked={settings.scrollInvertH} disabled={disabled}
                onChange={v => run(() => p.onChange({ ...settings, scrollInvertH: v }))} />
              <span className="ball-panel__label">スクロール方向</span>
              <select className="trackball-bar__select" value={tb.scrollMode} disabled={disabled}
                onChange={e => p.onTrackballChange({ ...tb, scrollMode: Number(e.target.value) })}>
                <option value={SCROLL_MODE.VERTICAL}>縦のみ</option>
                <option value={SCROLL_MODE.HORIZONTAL}>横のみ</option>
                <option value={SCROLL_MODE.FREE}>自由（縦横）</option>
              </select>
              {p.scrollInertia && (() => {
                const si = p.scrollInertia;
                return (
                  <>
                    <ToggleRow label="慣性スクロール" desc="" checked={si.enable} disabled={disabled}
                      onChange={v => run(() => p.onScrollInertiaChange({ ...si, enable: v }))} />
                    <span className="ball-panel__label">慣性レベル</span>
                    <SliderControl value={si.strength} min={SCROLL_INERTIA_STRENGTH_MIN} max={SCROLL_INERTIA_STRENGTH_MAX} step={1}
                      disabled={disabled || !si.enable} unit="" onCommit={v => p.onScrollInertiaChange({ ...si, strength: v })} />
                    <span className="ball-panel__label">発動しやすさ</span>
                    <SliderControl value={si.flickMult} min={SCROLL_INERTIA_FLICK_MULT_MIN} max={SCROLL_INERTIA_FLICK_MULT_MAX} step={1}
                      disabled={disabled || !si.enable} unit="" invert onCommit={v => p.onScrollInertiaChange({ ...si, flickMult: v })} />
                  </>
                );
              })()}
            </>
          )}
          {precision && !isGesture && (
            <>
              <ToggleRow
                label="精密モード"
                desc="" checked={precisionOn} disabled={disabled || precElsewhere} onChange={togglePrecision}
              />
              {precisionOn && (
                <>
                  <span className="ball-panel__label">減速レベル</span>
                  <SliderControl value={precision.div} min={PRECISION_DIV_MIN} max={PRECISION_DIV_MAX} step={1} disabled={disabled} unit="分の1"
                    onCommit={div => p.onPrecisionChange({ ...precision, div })} />
                </>
              )}
            </>
          )}
          {isGesture && (() => {
            const gm = gestureModes && isGesture && motion !== 'g' ? gestureModes[Number(motion.slice(1))] : null;
            const cfg = gm ?? (motion === 'g' ? gesture : null);
            if (!cfg) return null;
            const dirs = [['up', '上 ↑', 'continuousUp'], ['down', '下 ↓', 'continuousDown'],
              ['left', '左 ←', 'continuousLeft'], ['right', '右 →', 'continuousRight']] as const;
            const mi = gm ? Number(motion.slice(1)) : -1;
            return (
              <div className="ball-panel__gesture">
                {dirs.map(([dir, label, contKey]) => (
                  <div key={dir} className="gesture-row">
                    <span className="gesture-dir">{label}</span>
                    <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditDir(dir)}>
                      {getKeyDisplayLabel(cfg[dir], p.keyLayout) || '未設定'}
                    </button>
                    {gm && (
                      <label className="ball-panel__cont">
                        <input type="checkbox" disabled={disabled} checked={gm[contKey]}
                          onChange={e => p.onGestureModeChange(mi, { ...gm, [contKey]: e.target.checked })} />
                        連続入力
                      </label>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
          {p.gestureThreshold && isGesture && (
            <>
              <span className="ball-panel__label">感度（横）</span>
              <SliderControl value={p.gestureThreshold.h} min={10} max={200} step={5} disabled={disabled} unit="" invert
                onCommit={h => p.onGestureThresholdChange({ ...p.gestureThreshold!, h })} />
              <span className="ball-panel__label">感度（縦）</span>
              <SliderControl value={p.gestureThreshold.v} min={10} max={200} step={5} disabled={disabled} unit="" invert
                onCommit={v => p.onGestureThresholdChange({ ...p.gestureThreshold!, v })} />
            </>
          )}
          {isGesture && motion !== 'g' && p.gestureWaveEnable !== null && (() => {
            const i = Number(motion.slice(1));
            const off = disabled || !p.gestureWaveEnable;
            const color = p.gestureWaveColor?.[i];
            return (
              <>
                <ToggleRow label="ジェスチャーウェーブ" desc="" checked={p.gestureWaveEnable} disabled={disabled}
                  onChange={v => run(() => p.onGestureWaveEnableChange(v))} />
                {p.gestureWaveStyle && (
                  <select className="trackball-bar__select" value={p.gestureWaveStyle[i]} disabled={off}
                    onChange={e => p.onGestureWaveStyleChange(i, Number(e.target.value))}>
                    <option value={0}>シャープ（瞬間的に光る）</option>
                    <option value={1}>ブリージング（柔らかく流れる）</option>
                  </select>
                )}
                {color && (
                  <>
                    <span className="ball-panel__label">色相</span>
                    <HueBar key={i} color={color} disabled={off} onCommit={hue => p.onGestureWaveColorChange(i, { ...color, hue })} />
                    <span className="ball-panel__label">彩度</span>
                    <SliderControl value={color.sat} min={0} max={255} step={1} disabled={off} unit=""
                      onCommit={sat => p.onGestureWaveColorChange(i, { ...color, sat })} />
                    <span className="ball-panel__label">明るさ</span>
                    <SliderControl value={color.val} min={0} max={255} step={1} disabled={off} unit=""
                      onCommit={val => p.onGestureWaveColorChange(i, { ...color, val })} />
                  </>
                )}
                {p.gestureWaveSpeed && (
                  <>
                    <span className="ball-panel__label">ウェーブの速さ</span>
                    <SliderControl value={p.gestureWaveSpeed[i]} min={1} max={255} step={1} disabled={off} unit=""
                      onCommit={v => p.onGestureWaveSpeedChange(i, v)} />
                  </>
                )}
              </>
            );
          })()}
        </div>
        {editDir && isGesture && (
          <KeyConfigModal
            keyIndex={-1}
            currentCode={(motion === 'g' ? gesture![editDir] : gestureModes![Number(motion.slice(1))][editDir])}
            keyLayout={p.keyLayout}
            defaultPanel="通常"
            hideHold
            avail={p.avail}
            excludeCode={isGestureExcludedKeycode}
            onSelect={async kc => {
              if (motion === 'g') await p.onGestureChange({ ...gesture!, [editDir]: kc });
              else {
                const i = Number(motion.slice(1));
                await p.onGestureModeChange(i, { ...gestureModes![i], [editDir]: kc });
              }
              setEditDir(null);
            }}
            onClose={() => setEditDir(null)}
          />
        )}

      </div>
    </>
  );
}

// 虹色のバーそのものをドラッグして色相を選ぶ（トラックボール設定タブのジェスチャーと同じ見た目）
function HueBar({ color, disabled, onCommit }: { color: GestureWaveColor; disabled: boolean; onCommit: (hue: number) => void }) {
  const [hue, setHue] = useState(color.hue);
  const shown = { ...color, hue };
  return (
    <div className="tapping-term-row hue-bar-row">
      <div className={`led-panel__bar hue-bar ${disabled ? 'hue-bar--disabled' : ''}`}>
        <div className="led-panel__bar-fill" style={{ background: buildHueGradient(shown) }} />
        <div className="led-panel__marker" style={{ left: `${(hue / 255 * 100).toFixed(1)}%` }} />
        <input
          type="range" min={0} max={255} step={1}
          className="hue-bar__input"
          aria-label="色相"
          value={hue}
          disabled={disabled}
          onChange={e => setHue(Number(e.target.value))}
          onPointerUp={e => onCommit(Number((e.target as HTMLInputElement).value))}
          onKeyUp={e => onCommit(Number((e.target as HTMLInputElement).value))}
        />
      </div>
      <span className="tapping-term-value">{hue}</span>
    </div>
  );
}
