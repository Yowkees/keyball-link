import type { DpiCurveConfig } from '../../lib/protocol';
import { ToggleRow } from '../SettingsControls/SettingsControls';
import { DpiCurveEditor } from '../DpiCurveEditor/DpiCurveEditor';

interface DpiCurveCardProps {
  dpiCurve: DpiCurveConfig | null;
  onDpiCurveChange: (c: DpiCurveConfig) => Promise<void>;
  disabled: boolean;
}

export function DpiCurveCard({ dpiCurve, onDpiCurveChange, disabled }: DpiCurveCardProps) {
  if (!dpiCurve) {
    return <p className="settings-desc">このファームは非対応です。</p>;
  }
  return (
    <>
      <p className="settings-desc">
        動かす速さ（横軸）に対する実際の速さ（縦軸）を、点をドラッグして自由に調整できます。
      </p>
      <ToggleRow
        label="DPIカーブを有効化"
        desc="ONで「加速度」設定より優先されます。"
        checked={dpiCurve.enable} disabled={disabled}
        onChange={v => onDpiCurveChange({ ...dpiCurve, enable: v })}
      />
      <div style={{ marginTop: 12 }}>
        <DpiCurveEditor
          points={dpiCurve.points}
          disabled={disabled || !dpiCurve.enable}
          onCommit={points => onDpiCurveChange({ ...dpiCurve, points })}
        />
      </div>
    </>
  );
}
