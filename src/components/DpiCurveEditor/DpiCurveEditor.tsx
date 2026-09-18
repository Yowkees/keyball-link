import { useMemo, useRef, useState } from 'react';
import { DPI_CURVE_X, DPI_CURVE_Y_MAX, defaultDpiCurvePoints, computeDpiCurveLut } from '../../lib/protocol';

interface DpiCurveEditorProps {
  points: number[];  // 長さDPI_CURVE_X.length。各点の出力値(0-255)
  disabled: boolean;
  onCommit?: (points: number[]) => void;  // ドラッグを離した/リセットした時だけ呼ばれる
  // false時: 点のドラッグ・「直線にリセット」ボタンを無効化した読み取り専用表示にする
  // （加速度スライダーから算出したカーブをプレビューする用途）。disabledとは別軸の概念
  // （disabled＝グレーアウトして触れない、interactive=false＝はっきり見えるが編集できない）。
  interactive?: boolean;
  // グラフのY軸上限（省略時はDPI_CURVE_Y_MAX=255）。加速度プレビュー表示では
  // 実際の値が127までしか到達しないため127を渡し、上半分の余白をなくす。
  yMax?: number;
}

// SVGのviewBoxを0-100の正方形にして、pointerの座標をそのまま%換算で扱えるようにする
// （preserveAspectRatio="none"でCSS側の縦横比にぴったり引き伸ばす）。
const VB = 100;

function xToPercent(x: number): number {
  return (x / DPI_CURVE_X[DPI_CURVE_X.length - 1]) * VB;
}
function yToPercent(y: number, yMax: number): number {
  return VB - (y / yMax) * VB;
}
function percentToY(py: number, yMax: number): number {
  const v = Math.round(((VB - py) / VB) * yMax);
  return Math.max(0, Math.min(yMax, v));
}

// Photoshopのトーンカーブと同じ考え方のエディタ。
// X軸（動きの速さ、入力）は5点固定・Y軸（実際に送る速さ、出力）だけドラッグで変えられる。
export function DpiCurveEditor({ points, disabled, onCommit, interactive = true, yMax = DPI_CURVE_Y_MAX }: DpiCurveEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [local, setLocal] = useState<number[]>(points);
  const [prevPoints, setPrevPoints] = useState(points);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  if (prevPoints !== points) {
    setPrevPoints(points);
    if (dragIndex === null) setLocal(points);
  }

  const valueFromEvent = (e: React.PointerEvent, idx: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const py = ((e.clientY - rect.top) / rect.height) * VB;
    const next = [...local];
    next[idx] = percentToY(py, yMax);
    setLocal(next);
    return next;
  };

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    if (disabled || !interactive) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragIndex(idx);
    valueFromEvent(e, idx);
  };
  const handlePointerMove = (idx: number) => (e: React.PointerEvent) => {
    if (disabled || !interactive || dragIndex !== idx) return;
    valueFromEvent(e, idx);
  };
  const handlePointerUp = (idx: number) => (e: React.PointerEvent) => {
    if (disabled || !interactive || dragIndex !== idx) return;
    const next = valueFromEvent(e, idx);
    setDragIndex(null);
    if (next) onCommit?.(next);
  };

  const handleReset = () => {
    const next = defaultDpiCurvePoints();
    setLocal(next);
    onCommit?.(next);
  };

  // ファームウェアが実際に使う曲線（単調3次エルミート補間）と同じ計算で、
  // 見た目の線もカクカクの直線つなぎではなく滑らかな曲線にする。
  const linePath = useMemo(() => {
    const lut = computeDpiCurveLut(local);
    return lut.map((y, x) => `${xToPercent(x)},${yToPercent(y, yMax)}`).join(' ');
  }, [local, yMax]);
  const diagonalPath = DPI_CURVE_X.map(x => `${xToPercent(x)},${yToPercent(x, yMax)}`).join(' ');

  return (
    <div className="dpi-curve" style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
      <div className="dpi-curve__graph">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB} ${VB}`}
          preserveAspectRatio="none"
          className="dpi-curve__svg"
        >
          {[25, 50, 75].map(p => (
            <line key={`h${p}`} x1={0} y1={p} x2={VB} y2={p} className="dpi-curve__grid" />
          ))}
          {[25, 50, 75].map(p => (
            <line key={`v${p}`} x1={p} y1={0} x2={p} y2={VB} className="dpi-curve__grid" />
          ))}
          <polyline points={diagonalPath} className="dpi-curve__diagonal" />
          <polyline points={linePath} className="dpi-curve__line" />
          {DPI_CURVE_X.map((x, i) => (
            <circle
              key={i}
              cx={xToPercent(x)}
              cy={yToPercent(local[i], yMax)}
              r={dragIndex === i ? 3.2 : 2.4}
              className={`dpi-curve__point ${dragIndex === i ? 'dpi-curve__point--active' : ''} ${!interactive ? 'dpi-curve__point--preview' : ''}`}
              onPointerDown={handlePointerDown(i)}
              onPointerMove={handlePointerMove(i)}
              onPointerUp={handlePointerUp(i)}
            />
          ))}
        </svg>
        <div className="dpi-curve__axis-y">
          <span>速い</span>
          <span>出力の速さ</span>
          <span>遅い</span>
        </div>
      </div>
      <div className="dpi-curve__axis-x">
        <span>遅い</span>
        <span>動きの速さ（入力）</span>
        <span>速い</span>
      </div>
      <div className="dpi-curve__values">
        {DPI_CURVE_X.map((x, i) => (
          <span key={x} className={dragIndex === i ? 'dpi-curve__value--active' : undefined}>{local[i]}</span>
        ))}
      </div>
      {interactive && (
        <button className="btn btn--ghost btn--small" onClick={handleReset} disabled={disabled} style={{ marginTop: 8 }}>
          直線にリセット
        </button>
      )}
    </div>
  );
}
