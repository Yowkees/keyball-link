import { useState } from 'react';

// ドラッグ中はローカルで滑らかに動かし、離したときだけ保存するスライダー
export function SliderControl({ value, min, max, step, disabled, unit, onCommit, format }: {
  value: number; min: number; max: number; step: number;
  disabled: boolean; unit: string; onCommit: (v: number) => void;
  format?: (v: number) => string;  // 表示用の値の整形（例: ×10保持の値を1桁小数で表示）
}) {
  const [local, setLocal] = useState(value);
  // 親から新しい値が来たらローカル値を追従させる（レンダー中の比較更新）
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  const commit = () => { if (local !== value) onCommit(local); };

  return (
    <div className="tapping-term-row">
      <input
        type="range" min={min} max={max} step={step} value={local} disabled={disabled}
        onChange={e => setLocal(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        className="tapping-term-slider"
      />
      <span className="tapping-term-value">{format ? format(local) : `${local} ${unit}`}</span>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleRow({ label, desc, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className={`setting-row ${disabled ? 'setting-row--disabled' : ''}`}>
      <div className="setting-row__text">
        <span className="setting-row__label">{label}</span>
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
