import { useEffect, useRef, useState } from 'react';
import type { LedConfig } from '../../lib/protocol';
import { LED_EFFECTS, LED_FIXED_HUE_EFFECT_IDS, LED_NO_SPEED_EFFECT_IDS } from '../../lib/protocol';

interface LEDSettingsProps {
  config: LedConfig;
  onChange: (cfg: LedConfig) => void;
  onSave?: () => void;
}

// スライダー操作のたびにonChange（EEPROM書き込みを伴うHIDコマンド）を即送信すると、
// 素早くドラッグした時に大量の書き込みが連続発生し、キーボードが応答不能になる不具合が
// あった（速度スライダーを最速までドラッグして発生を確認）。表示はローカルstateで即座に
// 更新しつつ、実際の送信は操作が止まってから150msデバウンスする。
const COMMIT_DELAY_MS = 150;

export function LEDSettings({ config, onChange, onSave }: LEDSettingsProps) {
  const [local, setLocal] = useState(config);
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

  const isFixedHue = (LED_FIXED_HUE_EFFECT_IDS as readonly number[]).includes(local.effectId);
  const showColor = local.effectId !== 0;
  const showHue   = showColor && !isFixedHue;  // クリスマス・ハロウィン・イースターは色相固定
  const showSpeed = local.effectId >= 2 && !(LED_NO_SPEED_EFFECT_IDS as readonly number[]).includes(local.effectId);

  return (
    <div className="trackball-bar">
      <span className="trackball-bar__title">LED</span>

      <div className="trackball-bar__item">
        <span className="trackball-bar__label">エフェクト</span>
        <select
          className="trackball-bar__select"
          value={local.effectId}
          onChange={e => {
            const effectId = Number(e.target.value);
            // イースター(13)は彩度255だとパステル感が薄れるため、選択時の初期値として185にする
            // （既にイースターを選んでいた状態からの変更ではないので、彩度を上書きしても事故にならない）
            const sat = effectId === 13 && local.effectId !== 13 ? 185 : local.sat;
            commitNow({ ...local, effectId, sat });
          }}
        >
          {LED_EFFECTS.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      {showColor && (
        <>
          {showHue && (
            <div className="trackball-bar__item">
              <span className="trackball-bar__label">色相: <strong>{local.hue}</strong></span>
              <input
                type="range" min={0} max={255} value={local.hue}
                onChange={e => commitDebounced({ ...local, hue: Number(e.target.value) })}
                className="slider slider--hue"
                style={{ background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))` }}
              />
            </div>
          )}
          {isFixedHue && (
            <p className="settings-desc">このエフェクトは色相固定（テーマカラー）です。彩度・明度は調整できます。</p>
          )}

          <div className="trackball-bar__item">
            <span className="trackball-bar__label">彩度: <strong>{local.sat}</strong></span>
            <input
              type="range" min={0} max={255} value={local.sat}
              onChange={e => commitDebounced({ ...local, sat: Number(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="trackball-bar__item">
            <span className="trackball-bar__label">明度: <strong>{local.val}</strong></span>
            <input
              type="range" min={0} max={200} value={local.val}
              onChange={e => commitDebounced({ ...local, val: Number(e.target.value) })}
              className="slider"
            />
          </div>
        </>
      )}

      {showSpeed && (
        <div className="trackball-bar__item">
          <span className="trackball-bar__label">速度: <strong>{local.speed}</strong></span>
          <input
            type="range" min={0} max={255} value={local.speed}
            onChange={e => commitDebounced({ ...local, speed: Number(e.target.value) })}
            className="slider"
          />
          <span className="trackball-bar__scale">遅〜速</span>
        </div>
      )}

      {onSave && <button className="btn btn--ghost btn--small" onClick={onSave}>保存</button>}
    </div>
  );
}
