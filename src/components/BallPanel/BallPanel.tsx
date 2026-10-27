import { useState } from 'react';
import type { KbSettings, TrackballConfig, PrecisionConfig, GestureConfig, GestureModeConfig, GestureThreshold } from '../../lib/protocol';
import { LAYER_NONE, PRECISION_DIV_MIN, PRECISION_DIV_MAX, cpiIndexToValue } from '../../lib/protocol';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';

// キーマップのトラックボールを押した時に、右側に出すトラックボールの設定（2026-10-27、本人希望）。
// LED設定パネル（LedPanel）と同じ作り: 上に「動き」の選択欄、その下にスイッチとスライダー。
// 対象のレイヤーはキー配列の上で選んでいるレイヤー（LED設定も同じ。2026-10-27、本人希望）。
// 動きを選ぶと、そのレイヤーの連動設定（スクロールレイヤー・精密モードの連動レイヤー・
// ジェスチャーnの連動レイヤー）を書き換える。別のレイヤーで使っている機能は、そちらで外すまで
// 選べない（本人希望。勝手に移すと分かりにくいため）。
// 細かい設定は「トラックボール設定」タブにあり、ここには選んだ動きに関係するものだけを出す。

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
  precision: PrecisionConfig | null;
  onPrecisionChange: (p: PrecisionConfig) => Promise<void>;
  gesture: GestureConfig | null;
  onGestureChange: (g: GestureConfig) => Promise<void>;
  gestureModes: GestureModeConfig[] | null;
  onGestureModeChange: (mode: number, g: GestureModeConfig) => Promise<void>;
  gestureThreshold: GestureThreshold | null;
  onGestureThresholdChange: (t: GestureThreshold) => Promise<void>;
  onOpenTab: () => void;
}

export function BallPanel(p: BallPanelProps) {
  const layer = p.layer;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const disabled = p.disabled || busy;
  const L = layer;
  const { settings, precision, gesture, gestureModes } = p;

  // 今の動き
  const motionOf = (l: number): string => {
    const scroll = settings.scrollLayer === l;
    const prec = precision?.layer === l;
    const gi = gestureModes ? gestureModes.findIndex(m => m.layer === l) : -1;
    if (scroll && prec) return 'slowscroll';
    if (scroll) return 'scroll';
    if (gi >= 0) return `g${gi}`;
    if (!gestureModes && gesture?.layer === l) return 'g';
    if (prec) return 'precision';
    return 'cursor';
  };
  const motion = motionOf(L);
  const amlHere = settings.autoMouseEnable && settings.autoMouseLayer === L;
  // 別のレイヤーで使っている機能は選べない。選択欄には使っているレイヤーを書く
  const usedElsewhere = (l: number) => l !== LAYER_NONE && l !== L;
  const usedNote = (l: number) => (usedElsewhere(l) ? `（レイヤー${l}で使用中）` : '');
  const scrollBusy = usedElsewhere(settings.scrollLayer);
  const precBusy = precision ? usedElsewhere(precision.layer) : true;
  const options: { key: string; label: string; disabled?: boolean }[] = [
    { key: 'cursor', label: 'カーソル' },
    ...(precision ? [{ key: 'precision', label: `カーソル（ゆっくり）${usedNote(precision.layer)}`, disabled: precBusy }] : []),
    { key: 'scroll', label: `スクロール${usedNote(settings.scrollLayer)}${L === 0 ? '（レイヤー0は不可）' : ''}`, disabled: scrollBusy || L === 0 || amlHere },
    ...(precision ? [{
      key: 'slowscroll',
      label: `スクロール（ゆっくり）${scrollBusy ? usedNote(settings.scrollLayer) : precBusy ? usedNote(precision.layer) : ''}`,
      disabled: scrollBusy || precBusy || L === 0 || amlHere,
    }] : []),
    ...(gestureModes
      ? gestureModes.map((m, i) => ({ key: `g${i}`, label: `ジェスチャー${i + 1}${usedNote(m.layer)}`, disabled: usedElsewhere(m.layer) || amlHere }))
      : gesture ? [{ key: 'g', label: `ジェスチャー${usedNote(gesture.layer)}`, disabled: usedElsewhere(gesture.layer) || amlHere }] : []),
  ];
  const amlElsewhere = settings.autoMouseEnable && settings.autoMouseLayer !== L;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try { await fn(); } finally { setBusy(false); }
  };

  // このレイヤーの動きを key にする（他の機能のこのレイヤーへの連動は外し、選んだ機能が別の
  // レイヤーに付いていた場合はこのレイヤーへ移す）
  const chooseMotion = (key: string) => run(async () => {
    const wantScroll = key === 'scroll' || key === 'slowscroll';
    const wantPrec = key === 'precision' || key === 'slowscroll';
    const newScroll = wantScroll ? L : settings.scrollLayer === L ? LAYER_NONE : settings.scrollLayer;
    if (newScroll !== settings.scrollLayer) await p.onChange({ ...settings, scrollLayer: newScroll });
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
    if (precision) {
      const newPrec = wantPrec ? L : precision.layer === L ? LAYER_NONE : precision.layer;
      if (newPrec !== precision.layer) await p.onPrecisionChange({ ...precision, layer: newPrec });
    }
  });

  const toggleAml = (on: boolean) => run(async () => {
    if (on && (motion.startsWith('scroll') || motion === 'slowscroll' || motion.startsWith('g'))) {
      setMsg('スクロール・ジェスチャーのレイヤーはオートマウスにできません。先に動きを「カーソル」にしてください');
      return;
    }
    if (on) await p.onChange({ ...settings, autoMouseEnable: true, autoMouseLayer: L });
    else if (amlHere) await p.onChange({ ...settings, autoMouseEnable: false });
  });

  const tb = p.trackball;
  return (
    <>
      <div className="led-panel__title">トラックボール設定</div>
      <div className="led-panel ball-panel">
        <div className="led-panel__toprow">
          <span className="ball-panel__layer">レイヤー{L}</span>
          <select
            className="trackball-bar__select led-panel__effect-select"
            value={motion}
            disabled={disabled}
            onChange={e => chooseMotion(e.target.value)}
          >
            {options.map(o => <option key={o.key} value={o.key} disabled={o.disabled}>{o.label}</option>)}
          </select>
        </div>

        {L > 0 && (
          <ToggleRow
            label={amlElsewhere
              ? `ボールを動かすとこのレイヤーに切り替える（オートマウス。レイヤー${settings.autoMouseLayer}で使用中）`
              : 'ボールを動かすとこのレイヤーに切り替える（オートマウス）'}
            desc=""
            checked={amlHere}
            disabled={disabled || amlElsewhere}
            onChange={toggleAml}
          />
        )}
        {msg && <p className="settings-desc" style={{ color: 'var(--red)' }}>⚠ {msg}</p>}

        <div className="led-panel__sliders ball-panel__sliders">
          {tb && (motion === 'cursor' || motion === 'precision') && (
            <>
              <span className="ball-panel__label">速さ（CPI）</span>
              <SliderControl value={tb.cpiIndex} min={0} max={MAX_CPI_INDEX} step={1} disabled={disabled} unit=""
                format={v => String(cpiIndexToValue(v))} onCommit={v => p.onTrackballChange({ ...tb, cpiIndex: v })} />
              <span className="ball-panel__label">加速度</span>
              <SliderControl value={tb.accel} min={0} max={MAX_ACCEL} step={1} disabled={disabled} unit=""
                format={v => (v === 0 ? 'オフ' : String(v))} onCommit={v => p.onTrackballChange({ ...tb, accel: v })} />
            </>
          )}
          {tb && (motion === 'scroll' || motion === 'slowscroll') && (
            <>
              <span className="ball-panel__label">スクロール速度</span>
              <SliderControl value={tb.scrollDiv} min={0} max={SCROLL_DIV_MAX} step={1} disabled={disabled} unit="" invert
                onCommit={v => p.onTrackballChange({ ...tb, scrollDiv: v })} />
              <ToggleRow label="縦スクロールを反転" desc="" checked={settings.scrollInvertV} disabled={disabled}
                onChange={v => run(() => p.onChange({ ...settings, scrollInvertV: v }))} />
              <ToggleRow label="横スクロールを反転" desc="" checked={settings.scrollInvertH} disabled={disabled}
                onChange={v => run(() => p.onChange({ ...settings, scrollInvertH: v }))} />
            </>
          )}
          {precision && (motion === 'precision' || motion === 'slowscroll') && (
            <>
              <span className="ball-panel__label">ゆっくりの度合い（減速レベル）</span>
              <SliderControl value={precision.div} min={PRECISION_DIV_MIN} max={PRECISION_DIV_MAX} step={1} disabled={disabled} unit="分の1"
                onCommit={div => p.onPrecisionChange({ ...precision, div })} />
            </>
          )}
          {p.gestureThreshold && motion.startsWith('g') && (
            <>
              <span className="ball-panel__label">ジェスチャーの感度（横）</span>
              <SliderControl value={p.gestureThreshold.h} min={10} max={200} step={5} disabled={disabled} unit="" invert
                onCommit={h => p.onGestureThresholdChange({ ...p.gestureThreshold!, h })} />
              <span className="ball-panel__label">ジェスチャーの感度（縦）</span>
              <SliderControl value={p.gestureThreshold.v} min={10} max={200} step={5} disabled={disabled} unit="" invert
                onCommit={v => p.onGestureThresholdChange({ ...p.gestureThreshold!, v })} />
            </>
          )}
        </div>

        <button type="button" className="ball-panel__more" onClick={p.onOpenTab}>
          {motion.startsWith('g') ? 'ジェスチャーの割り当て' : 'その他の設定'}は「トラックボール設定」タブで →
        </button>
      </div>
    </>
  );
}
