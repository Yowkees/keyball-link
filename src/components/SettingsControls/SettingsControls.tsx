import { useState } from 'react';

// ドラッグ中はローカルで滑らかに動かし、離したときだけ保存するスライダー
export function SliderControl({ value, min, max, step, disabled, unit, onCommit, onChange, format, invert }: {
  value: number; min: number; max: number; step: number;
  disabled: boolean; unit: string; onCommit: (v: number) => void;
  onChange?: (v: number) => void;  // ドラッグ中の値をリアルタイムに受け取りたい場合（色相バーの追従表示など）
  format?: (v: number) => string;  // 表示用の値の整形（例: ×10保持の値を1桁小数で表示）
  // true時: ファームの値とは逆向きに表示する（スライダーを右へ・表示の数値を大きくするほど
  // ファームへ送る値は小さくなる）。「感度」など、数値を上げるほど敏感・速いと感じる向きに
  // 揃えるため（2026-10-06、本人希望）。表示値は min+max-実際の値。
  invert?: boolean;
}) {
  const [local, setLocal] = useState(value);
  // 親から新しい値が来たらローカル値を追従させる（レンダー中の比較更新）
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  const commit = () => { if (local !== value) onCommit(local); };
  const flip = (v: number) => (invert ? min + max - v : v);

  return (
    <div className="tapping-term-row">
      <input
        type="range" min={min} max={max} step={step} value={flip(local)} disabled={disabled}
        onChange={e => { const v = flip(Number(e.target.value)); setLocal(v); onChange?.(v); }}
        onPointerUp={commit}
        onKeyUp={commit}
        className="tapping-term-slider"
      />
      <span className="tapping-term-value">{format ? format(flip(local)) : `${flip(local)} ${unit}`}</span>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  tip?: string;  // 項目名にマウスを乗せた時の詳細説明
}

export function ToggleRow({ label, desc, checked, disabled, onChange, tip }: ToggleRowProps) {
  return (
    <div className={`setting-row ${disabled ? 'setting-row--disabled' : ''}`}>
      <div className="setting-row__text">
        <span className="setting-row__label" data-tip={tip}>{label}</span>
        <span className="setting-row__desc">{desc}</span>
      </div>
      <button
        className={`toggle-btn ${checked ? 'toggle-btn--on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        aria-pressed={checked}
      >
        {checked ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
