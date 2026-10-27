import { useState } from 'react';
import type { KbSettings, TrackballConfig, PrecisionConfig, GestureConfig, GestureModeConfig, GestureThreshold } from '../../lib/protocol';
import type { KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import { getKeyDisplayLabel, isGestureExcludedKeycode } from '../../lib/keycodes';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';
import { LAYER_NONE, PRECISION_DIV_MIN, PRECISION_DIV_MAX, cpiIndexToValue } from '../../lib/protocol';
import { HeaderToggle, SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';

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
  keyLayout: KeyLayout;
  avail: FirmwareAvail;
}

export function BallPanel(p: BallPanelProps) {
  const layer = p.layer;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
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
  const amlElsewhere = settings.autoMouseEnable && settings.autoMouseLayer !== L;
  const precElsewhere = precision ? usedElsewhere(precision.layer) : false;
  const [editDir, setEditDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
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

  const toggleAml = (on: boolean) => run(async () => {
    if (on && (motion === 'scroll' || isGesture)) {
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
          <select
            className="trackball-bar__select led-panel__effect-select"
            value={motion}
            disabled={disabled}
            onChange={e => chooseMotion(e.target.value)}
          >
            {options.map(o => <option key={o.key} value={o.key} disabled={o.disabled}>{o.label}</option>)}
          </select>
          {/* オートマウスのON/OFFは選択欄の横に置く。他のレイヤーに設定済みなら、そのレイヤーだけに出す（2026-10-27、本人希望） */}
          {L > 0 && !amlElsewhere && (
            <span className={`ball-panel__aml ${disabled ? 'ball-panel__aml--disabled' : ''}`}>
              オートマウス
              <HeaderToggle checked={amlHere} disabled={disabled} onChange={toggleAml} />
            </span>
          )}
        </div>

        {msg && <p className="settings-desc" style={{ color: 'var(--red)' }}>⚠ {msg}</p>}

        <div className="led-panel__sliders ball-panel__sliders">
          {tb && motion === 'cursor' && (
            <>
              <span className="ball-panel__label">速さ（CPI）</span>
              <SliderControl value={tb.cpiIndex} min={0} max={MAX_CPI_INDEX} step={1} disabled={disabled} unit=""
                format={v => String(cpiIndexToValue(v))} onCommit={v => p.onTrackballChange({ ...tb, cpiIndex: v })} />
              <span className="ball-panel__label">加速度</span>
              <SliderControl value={tb.accel} min={0} max={MAX_ACCEL} step={1} disabled={disabled} unit=""
                format={v => (v === 0 ? 'オフ' : String(v))} onCommit={v => p.onTrackballChange({ ...tb, accel: v })} />
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
            const dirs = [['up', '上 ↑'], ['down', '下 ↓'], ['left', '左 ←'], ['right', '右 →']] as const;
            return (
              <div className="ball-panel__gesture">
                {dirs.map(([dir, label]) => (
                  <div key={dir} className="gesture-row">
                    <span className="gesture-dir">{label}</span>
                    <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditDir(dir)}>
                      {getKeyDisplayLabel(cfg[dir], p.keyLayout) || '未設定'}
                    </button>
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

        <button type="button" className="ball-panel__more" onClick={p.onOpenTab}>
          その他の設定（連続入力・ジェスチャーウェーブ・シェイクなど）は「トラックボール設定」タブで →
        </button>
      </div>
    </>
  );
}
