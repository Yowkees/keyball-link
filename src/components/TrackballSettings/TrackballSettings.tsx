import { useState, useEffect, useRef } from 'react';
import type { TrackballConfig, DpiCurveConfig } from '../../lib/protocol';
import { cpiIndexToValue, computeAccelCurvePoints } from '../../lib/protocol';
import { DpiCurveEditor } from '../DpiCurveEditor/DpiCurveEditor';

interface TrackballSettingsProps {
  config: TrackballConfig;
  onChange: (cfg: TrackballConfig) => void;
  accelAvailable?: boolean;  // LED版の44/61では加速度が無効 → グレーアウト
  dpiCurve: DpiCurveConfig | null;  // 非対応ファーム(AVR版等)ではnull
  onDpiCurveChange: (c: DpiCurveConfig) => Promise<void>;
  children?: React.ReactNode;
}

const MAX_CPI_INDEX = 17;
const MAX_ACCEL = 10;

// スライダーはドラッグ中にローカル表示のみ更新し、離したときだけ親に通知する
function TrackballSlider({
  label,
  value,
  min,
  max,
  renderLabel,
  onCommit,
  dimmed = false,
  dimmedReason,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  renderLabel: (v: number) => string;
  onCommit: (v: number) => void;
  dimmed?: boolean;
  dimmedReason?: string;
}) {
  const [local, setLocal] = useState(value);
  // 親から新しい値が来たらローカル値を追従させる（レンダー中の比較更新）
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  return (
    <div className="trackball-bar__item" style={dimmed ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
      title={dimmed ? (dimmedReason ?? 'このファーム版（LED版）では加速度は使用できません') : undefined}>
      <span className="trackball-bar__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={local}
        disabled={dimmed}
        onChange={e => setLocal(Number(e.target.value))}
        onPointerUp={e => onCommit(Number((e.target as HTMLInputElement).value))}
        onKeyUp={e => onCommit(Number((e.target as HTMLInputElement).value))}
        className="slider"
      />
      {/* 数値は他の設定バーと同じくバーの右隣に表示する（2026-10-06、本人希望） */}
      <span className="tapping-term-value">{dimmed ? '—' : renderLabel(local)}</span>
      {dimmed && <span className="trackball-bar__scale">この版では無効</span>}
    </div>
  );
}

export function TrackballSettings({ config, onChange, accelAvailable = true, dpiCurve, onDpiCurveChange, children }: TrackballSettingsProps) {
  // カーブの自由編集機能はUIから廃止し、常に加速度スライダーの内容をそのまま
  // 使う設計にした。以前のセッションでDPIカーブを有効化したまま残っている
  // 実機がある場合、そのままだとスライダーを動かしても実際の動作には反映
  // されない（ファームは有効な間カーブを優先するため）ので、ここで自動的に
  // 無効化しておく。
  const resetOnce = useRef(false);
  useEffect(() => {
    if (dpiCurve?.enable && !resetOnce.current) {
      resetOnce.current = true;
      onDpiCurveChange({ ...dpiCurve, enable: false });
    }
  }, [dpiCurve, onDpiCurveChange]);

  return (
    <div className="trackball-bar">
      <span className="trackball-bar__title">トラックボール</span>

      <TrackballSlider
        label="CPI"
        value={config.cpiIndex}
        min={0}
        max={MAX_CPI_INDEX}
        renderLabel={i => String(cpiIndexToValue(i))}
        onCommit={v => onChange({ ...config, cpiIndex: v })}
      />

      <TrackballSlider
        label="加速度"
        value={config.accel}
        min={0}
        max={MAX_ACCEL}
        renderLabel={v => v === 0 ? 'オフ' : String(v)}
        onCommit={v => onChange({ ...config, accel: v })}
        dimmed={!accelAvailable}
      />

      {/* 加速度の下に置く追加項目（精密モード）。スクロール方向・反転はスクロール設定へ移した（2026-10-06） */}
      {children && <div className="trackball-bar__extra">{children}</div>}

      {/* 2026-09-25: このプレビューはconfig.accelのみから計算する純粋なグラフ表示で、
          加速度の計算式自体はAVR・RP2040で共通（lib/keyball/keyball.c）のため、
          以前のように dpiCurve（RP2040限定の内部状態）の有無では出し分けない。
          AVR接続時にも表示し、ボール動作タブの見た目をRP2040版と統一する。 */}
      <div className="trackball-bar__dpicurve">
        <DpiCurveEditor
          points={computeAccelCurvePoints(config.accel)}
          disabled={!accelAvailable}
          interactive={false}
          yMax={127}
        />
      </div>

    </div>
  );
}
