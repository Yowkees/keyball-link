import { useState, useEffect, useRef } from 'react';
import type { TrackballConfig, DpiCurveConfig } from '../../lib/protocol';
import { cpiIndexToValue, SCROLL_MODE, computeAccelCurvePoints } from '../../lib/protocol';
import { DpiCurveEditor } from '../DpiCurveEditor/DpiCurveEditor';

interface TrackballSettingsProps {
  config: TrackballConfig;
  onChange: (cfg: TrackballConfig) => void;
  scrollInvertV: boolean;
  scrollInvertH: boolean;
  onScrollInvertChange: (v: boolean, h: boolean) => void;
  accelAvailable?: boolean;  // LED版の44/61では加速度が無効 → グレーアウト
  dpiCurve: DpiCurveConfig | null;  // 非対応ファーム(AVR版等)ではnull
  onDpiCurveChange: (c: DpiCurveConfig) => Promise<void>;
  // 設定ボードのカード内タブで表示を分ける時に指定する（未指定なら全部表示）。
  // 'basic'=CPI・加速度・スクロール方向・反転、'curve'=加速度の速度カーブ
  part?: 'basic' | 'curve';
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
  scale,
  onCommit,
  dimmed = false,
  dimmedReason,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  renderLabel: (v: number) => string;
  scale: string;
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
      <span className="trackball-bar__label">{label}: <strong>{dimmed ? '—' : renderLabel(local)}</strong></span>
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
      <span className="trackball-bar__scale">{dimmed ? 'この版では無効' : scale}</span>
    </div>
  );
}

export function TrackballSettings({ config, onChange, scrollInvertV, scrollInvertH, onScrollInvertChange, accelAvailable = true, dpiCurve, onDpiCurveChange, part }: TrackballSettingsProps) {
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

  const showBasic = part !== 'curve';
  const showCurve = part !== 'basic';

  return (
    <div className="trackball-bar">
      {!part && <span className="trackball-bar__title">トラックボール</span>}

      {showBasic && <TrackballSlider
        label="CPI"
        value={config.cpiIndex}
        min={0}
        max={MAX_CPI_INDEX}
        renderLabel={i => String(cpiIndexToValue(i))}
        scale="100〜1800"
        onCommit={v => onChange({ ...config, cpiIndex: v })}
      />}

      {/* 加速度はカーブのグラフと見比べられるよう、どちらのタブにも出す */}
      <TrackballSlider
        label="加速度"
        value={config.accel}
        min={0}
        max={MAX_ACCEL}
        renderLabel={v => v === 0 ? 'オフ' : String(v)}
        scale="オフ〜強"
        onCommit={v => onChange({ ...config, accel: v })}
        dimmed={!accelAvailable}
      />

      {/* 2026-09-25: このプレビューはconfig.accelのみから計算する純粋なグラフ表示で、
          加速度の計算式自体はAVR・RP2040で共通（lib/keyball/keyball.c）のため、
          以前のように dpiCurve（RP2040限定の内部状態）の有無では出し分けない。
          AVR接続時にも表示し、ボール動作タブの見た目をRP2040版と統一する。 */}
      {showCurve && <div className="trackball-bar__dpicurve">
        <p className="settings-desc">
          上の「加速度」が実際にどんな速度カーブになるかをグラフで確認できます（見るだけで編集はできません）。
        </p>
        <DpiCurveEditor
          points={computeAccelCurvePoints(config.accel)}
          disabled={!accelAvailable}
          interactive={false}
          yMax={127}
        />
      </div>}

      {showBasic && <>
      <div className="trackball-bar__item">
        <span className="trackball-bar__label">スクロール方向</span>
        <select
          className="trackball-bar__select"
          value={config.scrollMode}
          onChange={e => onChange({ ...config, scrollMode: Number(e.target.value) })}
        >
          <option value={SCROLL_MODE.VERTICAL}>縦のみ</option>
          <option value={SCROLL_MODE.HORIZONTAL}>横のみ</option>
          <option value={SCROLL_MODE.FREE}>自由（縦横）</option>
        </select>
      </div>

      <div className="trackball-bar__item trackball-bar__item--invert">
        <span className="trackball-bar__label">反転</span>
        <button
          className={`btn btn--small btn--layer ${scrollInvertV ? 'btn--layer-active' : ''}`}
          onClick={() => onScrollInvertChange(!scrollInvertV, scrollInvertH)}
          title="縦スクロールの向きを逆にする"
        >
          縦 {scrollInvertV ? 'ON' : 'OFF'}
        </button>
        <button
          className={`btn btn--small btn--layer ${scrollInvertH ? 'btn--layer-active' : ''}`}
          onClick={() => onScrollInvertChange(scrollInvertV, !scrollInvertH)}
          title="横スクロールの向きを逆にする"
        >
          横 {scrollInvertH ? 'ON' : 'OFF'}
        </button>
      </div>
      </>}
    </div>
  );
}
