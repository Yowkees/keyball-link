import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LedConfig } from '../../lib/protocol';
import { LED_EFFECTS, LED_FIXED_HUE_EFFECT_IDS, LED_NO_SPEED_EFFECT_IDS } from '../../lib/protocol';

interface LEDSettingsProps {
  config: LedConfig;
  onChange: (cfg: LedConfig) => void;
  headerLeft?: ReactNode;   // エフェクト選択の左隣に表示する要素（レイヤー選択タブなど）
  extraRow?: ReactNode;     // エフェクト選択の下・色相バーの上に追加する行
  allowedEffectIds?: readonly number[];  // 指定時、選択肢をこのIDのみに絞る（AVR接続時など）
  offPreview?: LedConfig;   // 「オフ」の時に代わりに見せる設定（レイヤー1以降でレイヤー0の光り方を見せる）
}

// スライダー操作のたびにonChange（EEPROM書き込みを伴うHIDコマンド）を即送信すると、
// 素早くドラッグした時に大量の書き込みが連続発生し、キーボードが応答不能になる不具合が
// あった（速度スライダーを最速までドラッグして発生を確認）。表示はローカルstateで即座に
// 更新しつつ、実際の送信は操作が止まってから150msデバウンスする。
const COMMIT_DELAY_MS = 150;

// エフェクトの種類に関わらず常に全色相(360°)を表示する色相環バー。
// 現在の彩度・明度を反映しつつ、色相スライダーの位置を視覚的に把握するためのもの。
function buildGradient(cfg: LedConfig): string {
  const sat = Math.round((cfg.sat / 255) * 100);
  const light = Math.max(6, Math.min(62, Math.round((cfg.val / 200) * 62)));
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const hDeg = Math.round((360 * i) / 12);
    stops.push(`hsl(${hDeg} ${sat}% ${light}%) ${(i * 100 / 12).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

// hidden の時も場所は取っておき、エフェクトによってパネルの高さが変わらないようにする
function LedSlider({ label, value, max, onChange, hidden, disabled }: {
  label: string; value: number; max: number; onChange: (v: number) => void; hidden?: boolean; disabled?: boolean;
}) {
  return (
    <div className="led-panel__slider" style={hidden ? { visibility: 'hidden' } : undefined}>
      <span className="led-panel__slider-label">{label}</span>
      <input
        type="range" min={0} max={max} value={value} disabled={disabled || hidden}
        onChange={e => onChange(Number(e.target.value))}
        className="slider"
      />
      <span className="led-panel__slider-value">{value}</span>
    </div>
  );
}

export function LEDSettings({ config, onChange, headerLeft, extraRow, allowedEffectIds, offPreview }: LEDSettingsProps) {
  const [local, setLocal] = useState(config);
  const effects = allowedEffectIds
    ? LED_EFFECTS.filter(e => allowedEffectIds.includes(e.id))
    : LED_EFFECTS;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // プリセット読み込みなど外部要因でconfigが変わった場合は表示に反映する
  useEffect(() => {
    setLocal(config);
  }, [config]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // エフェクト切り替えなど、離散的な操作は即座に反映する
  const commitNow = (next: LedConfig) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLocal(next);
    onChange(next);
  };

  // スライダーのドラッグ中の連続した変更は、止まってからまとめて1回だけ送信する
  const commitDebounced = (next: LedConfig) => {
    setLocal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onChange(next);
    }, COMMIT_DELAY_MS);
  };

  // 「オフ」でレイヤー0の光り方を見せる時は、その値をグレーで表示するだけにする（操作不可）
  const previewing = local.effectId === 0 && !!offPreview;
  const view = previewing ? offPreview : local;
  const isFixedHue = (LED_FIXED_HUE_EFFECT_IDS as readonly number[]).includes(view.effectId);
  const showColor = view.effectId !== 0;
  const showHue   = showColor && !isFixedHue;  // クリスマス・ハロウィン・イースターは色相固定
  const showSpeed = view.effectId >= 2 && !(LED_NO_SPEED_EFFECT_IDS as readonly number[]).includes(view.effectId);

  return (
    <div className="led-panel led-settings">
      <div className="led-panel__toprow">
        {headerLeft}
        <select
          className="trackball-bar__select led-panel__effect-select"
          value={local.effectId}
          onChange={e => {
            const effectId = Number(e.target.value);
            // イースター(13)は彩度255だとパステル感が薄れるため、選択時の初期値として185にする
            // （既にイースターを選んでいた状態からの変更ではないので、彩度を上書きしても事故にならない）
            const sat = effectId === 13 && local.effectId !== 13 ? 185 : local.sat;
            commitNow({ ...local, effectId, sat });
          }}
        >
          {effects.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      {extraRow}

      <div className={`led-settings__body ${previewing ? 'led-settings__body--preview' : ''}`}>
        <div className="led-panel__bar">
          <div className="led-panel__bar-fill" style={{ background: buildGradient(view) }} />
          {showHue && (
            <div className="led-panel__marker" style={{ left: `${(view.hue / 255 * 100).toFixed(1)}%` }} />
          )}
        </div>

        {/* 説明の行は常に場所を取っておき、パネルの高さを変えない */}
        <p className="settings-desc led-settings__note">
          {previewing ? 'オフの間はレイヤー0の光り方で光ります'
            : isFixedHue ? '色相固定のエフェクトです（彩度・明度は調整できます）' : '\u00a0'}
        </p>

        <div className="led-panel__sliders">
          <LedSlider label="色相" value={view.hue} max={255} hidden={!showHue} disabled={previewing}
            onChange={v => commitDebounced({ ...local, hue: v })} />
          <LedSlider label="彩度" value={view.sat} max={255} hidden={!showColor} disabled={previewing}
            onChange={v => commitDebounced({ ...local, sat: v })} />
          <LedSlider label="明度" value={view.val} max={200} hidden={!showColor} disabled={previewing}
            onChange={v => commitDebounced({ ...local, val: v })} />
          <LedSlider label="速度" value={view.speed} max={255} hidden={!showSpeed} disabled={previewing}
            onChange={v => commitDebounced({ ...local, speed: v })} />
        </div>
      </div>
    </div>
  );
}
