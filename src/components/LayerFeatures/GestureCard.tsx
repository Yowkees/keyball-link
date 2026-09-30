import { useEffect, useState } from 'react';
import type { GestureConfig, GestureModeConfig, GestureThreshold, GestureWaveColor } from '../../lib/protocol';
import { LAYER_NONE } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { KeyConfigModal, TapKeyPicker } from '../KeyConfigModal/KeyConfigModal';

// 色相スライダーの上に表示する虹色バー。現在の彩度・明度を反映した色で12段階に分けて描画する
// （LEDSettings.tsxのbuildGradientと同じ考え方）。どの色相がどの色になるか一目で分かるようにする。
function buildHueGradient(c: GestureWaveColor): string {
  const sat = Math.round((c.sat / 255) * 100);
  const light = Math.max(6, Math.min(62, Math.round((c.val / 255) * 62)));
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const hDeg = Math.round((360 * i) / 12);
    stops.push(`hsl(${hDeg} ${sat}% ${light}%) ${(i * 100 / 12).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

interface GestureCardProps {
  gesture: GestureConfig | null;
  onGestureChange: (g: GestureConfig) => Promise<void>;
  gestureModes: GestureModeConfig[] | null;
  onGestureModeChange: (mode: number, g: GestureModeConfig) => Promise<void>;
  gestureThreshold: GestureThreshold | null;
  onGestureThresholdChange: (t: GestureThreshold) => Promise<void>;
  // 速さ・見た目・色はモードごと（2026-09-30〜。本人希望で「ジェスチャー1〜4で
  // それぞれ違う光り方にしたい」に対応）。有効/無効だけは全モード共通のまま。
  gestureWaveSpeed: number[] | null;
  onGestureWaveSpeedChange: (mode: number, speed: number) => Promise<void>;
  gestureWaveEnable: boolean | null;
  onGestureWaveEnableChange: (v: boolean) => Promise<void>;
  gestureWaveStyle: number[] | null;
  onGestureWaveStyleChange: (mode: number, style: number) => Promise<void>;
  gestureWaveColor: GestureWaveColor[] | null;
  onGestureWaveColorChange: (mode: number, c: GestureWaveColor) => Promise<void>;
  disabled: boolean;
  keyLayout: KeyLayout;
  layersInclBase: number[];
  layerWarn: LayerWarn | null;
  changeGestureLayer: (v: number) => void;
  changeGestureModeLayer: (mode: number, v: number) => void;
}

export function GestureCard({
  gesture, onGestureChange, gestureModes, onGestureModeChange, gestureThreshold, onGestureThresholdChange,
  gestureWaveSpeed, onGestureWaveSpeedChange, gestureWaveEnable, onGestureWaveEnableChange,
  gestureWaveStyle, onGestureWaveStyleChange, gestureWaveColor, onGestureWaveColorChange,
  disabled, keyLayout, layersInclBase, layerWarn, changeGestureLayer, changeGestureModeLayer,
}: GestureCardProps) {
  const [gestureModeTab, setGestureModeTab] = useState(0);  // 複数ジェスチャーモードUIで編集中のモード(0-3)。ウェーブの速さ・見た目・色もこのタブに連動する
  const [editModeDir, setEditModeDir] = useState<{ mode: number; dir: 'up' | 'down' | 'left' | 'right' } | null>(null);
  const [editDir, setEditDir] = useState<keyof GestureConfig | null>(null);
  const [editTap, setEditTap] = useState(false);
  // 色相バーをスライダーのドラッグ中も追従させるためのローカル表示値（通常のLED色相バーと同じ考え方）。
  // 選択中のモード(gestureModeTab)が変わった時も、そのモードの色に追従させる。
  const [liveColor, setLiveColor] = useState<GestureWaveColor | null>(gestureWaveColor?.[gestureModeTab] ?? null);
  useEffect(() => { setLiveColor(gestureWaveColor?.[gestureModeTab] ?? null); }, [gestureWaveColor, gestureModeTab]);

  if (gestureModes && gestureThreshold) {
    const mode = gestureModes[gestureModeTab];
    const dirs = [
      ['up', '上 ↑', 'continuousUp'],
      ['down', '下 ↓', 'continuousDown'],
      ['left', '左 ←', 'continuousLeft'],
      ['right', '右 →', 'continuousRight'],
    ] as const;
    return (
      <>
        <p className="settings-desc">
          「ジェスチャー1〜4」キーを押しながらボールを上下左右に振ると操作できます。
        </p>
        <div className="led-effect-selector" style={{ marginTop: 8 }}>
          {[0, 1, 2, 3].map(m => (
            <button
              key={m}
              className={`btn btn--small btn--layer ${gestureModeTab === m ? 'btn--layer-active' : ''}`}
              onClick={() => setGestureModeTab(m)}
            >
              ジェスチャー{m + 1}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="gesture-grid">
            {dirs.map(([dir, label, contKey]) => (
              <div key={dir} className="gesture-row">
                <span className="gesture-dir">{label}</span>
                <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditModeDir({ mode: gestureModeTab, dir })}>
                  {getKeyDisplayLabel(mode[dir], keyLayout) || '未設定'}
                </button>
                <label className="setting-row__desc" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={mode[contKey]}
                    onChange={e => onGestureModeChange(gestureModeTab, { ...mode, [contKey]: e.target.checked })}
                  />
                  連続入力
                </label>
              </div>
            ))}
          </div>
          <p className="settings-desc" style={{ marginTop: 8 }}>
            連続入力ONの方向は回転速度に応じて連続タップします。
          </p>

          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div className="setting-row">
              <div className="setting-row__text">
                <span className="setting-row__label">連動レイヤー</span>
              </div>
              <select
                className="trackball-bar__select"
                value={mode.layer}
                disabled={disabled}
                onChange={e => changeGestureModeLayer(gestureModeTab, Number(e.target.value))}
              >
                <option value={LAYER_NONE}>なし</option>
                {layersInclBase.map(l => (
                  <option key={l} value={l}>Layer {l}</option>
                ))}
              </select>
            </div>
            {layerWarn?.target === 'gestureMode' && layerWarn.mode === gestureModeTab && (
              <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p className="settings-desc" style={{ fontWeight: 600 }}>感度（4モード共通）</p>
          <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>左右方向</p>
          <SliderControl
            value={gestureThreshold.h} min={10} max={200} step={5}
            disabled={disabled} unit=""
            onCommit={v => onGestureThresholdChange({ ...gestureThreshold, h: v })}
          />
          <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>上下方向</p>
          <SliderControl
            value={gestureThreshold.v} min={10} max={200} step={5}
            disabled={disabled} unit=""
            onCommit={v => onGestureThresholdChange({ ...gestureThreshold, v: v })}
          />
          <div className="tapping-term-hints">
            <span>10（敏感）</span>
            <span>デフォルト: 50</span>
            <span>200（鈍感）</span>
          </div>
        </div>

        {gestureWaveSpeed !== null && gestureWaveEnable !== null && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <ToggleRow
              label="ジェスチャーウェーブ"
              desc="キーが送出された瞬間、LEDが流れるように光ります（4モード共通のON/OFF）。"
              checked={gestureWaveEnable}
              disabled={disabled}
              onChange={onGestureWaveEnableChange}
            />
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>
              ジェスチャー{gestureModeTab + 1}の光り方
            </p>
            {gestureWaveStyle !== null && (
              <>
                <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>見た目</p>
                <select
                  className="trackball-bar__select"
                  value={gestureWaveStyle[gestureModeTab]}
                  disabled={disabled || !gestureWaveEnable}
                  onChange={e => onGestureWaveStyleChange(gestureModeTab, Number(e.target.value))}
                >
                  <option value={0}>シャープ（瞬間的に光る）</option>
                  <option value={1}>ブリージング（柔らかく呼吸するように流れる）</option>
                </select>
              </>
            )}
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>速さ</p>
            <SliderControl
              value={gestureWaveSpeed[gestureModeTab]} min={1} max={255} step={1}
              disabled={disabled || !gestureWaveEnable} unit=""
              onCommit={v => onGestureWaveSpeedChange(gestureModeTab, v)}
            />
            <div className="tapping-term-hints">
              <span>1（ゆっくり）</span>
              <span>デフォルト: 200</span>
              <span>255（速い）</span>
            </div>
            {gestureWaveColor !== null && (() => {
              const color = gestureWaveColor[gestureModeTab];
              const barColor = liveColor ?? color;
              return (
                <>
                  <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>色相</p>
                  <div className="led-panel__bar" style={{ marginBottom: 8 }}>
                    <div className="led-panel__bar-fill" style={{ background: buildHueGradient(barColor) }} />
                    <div className="led-panel__marker" style={{ left: `${(barColor.hue / 255 * 100).toFixed(1)}%` }} />
                  </div>
                  <SliderControl
                    value={color.hue} min={0} max={255} step={1}
                    disabled={disabled || !gestureWaveEnable} unit=""
                    onChange={v => setLiveColor({ ...barColor, hue: v })}
                    onCommit={v => onGestureWaveColorChange(gestureModeTab, { ...color, hue: v })}
                  />
                  <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>彩度</p>
                  <SliderControl
                    value={color.sat} min={0} max={255} step={1}
                    disabled={disabled || !gestureWaveEnable} unit=""
                    onChange={v => setLiveColor({ ...barColor, sat: v })}
                    onCommit={v => onGestureWaveColorChange(gestureModeTab, { ...color, sat: v })}
                  />
                  <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }}>明るさ</p>
                  <SliderControl
                    value={color.val} min={0} max={255} step={1}
                    disabled={disabled || !gestureWaveEnable} unit=""
                    onChange={v => setLiveColor({ ...barColor, val: v })}
                    onCommit={v => onGestureWaveColorChange(gestureModeTab, { ...color, val: v })}
                  />
                </>
              );
            })()}
          </div>
        )}

        {editModeDir && (
          <KeyConfigModal
            keyIndex={-1}
            currentCode={gestureModes[editModeDir.mode][editModeDir.dir]}
            keyLayout={keyLayout}
            defaultPanel="通常"
            hideHold
            onSelect={async (kc) => {
              await onGestureModeChange(editModeDir.mode, { ...gestureModes[editModeDir.mode], [editModeDir.dir]: kc });
              setEditModeDir(null);
            }}
            onClose={() => setEditModeDir(null)}
          />
        )}
      </>
    );
  }

  if (gesture === null) {
    return <p className="settings-desc">このファームは非対応です。</p>;
  }

  return (
    <>
      <p className="settings-desc">
        「ジェスチャー」キーを押しながらボールを上下左右に振ると操作できます。
      </p>
      <div className="gesture-grid">
        {([['up', '上 ↑'], ['down', '下 ↓'], ['left', '左 ←'], ['right', '右 →']] as const).map(([dir, label]) => (
          <div key={dir} className="gesture-row">
            <span className="gesture-dir">{label}</span>
            <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditDir(dir)}>
              {getKeyDisplayLabel(gesture[dir], keyLayout) || '未設定'}
            </button>
          </div>
        ))}
      </div>
      <p className="settings-desc" style={{ marginTop: 8 }}>
        初期設定: 左=戻る / 右=進む / 上=前のタブ / 下=次のタブ
      </p>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div className="gesture-row">
          <span className="gesture-dir">タップ</span>
          <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditTap(true)}>
            {gesture.tap ? getKeyDisplayLabel(gesture.tap, keyLayout) : 'なし（長押し専用）'}
          </button>
        </div>
        <p className="settings-desc" style={{ marginTop: 8 }}>
          サッと押して離した時のキー。「なし」で長押し専用。
        </p>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__label">ジェスチャーレイヤー</span>
          </div>
          <select
            className="trackball-bar__select"
            value={gesture.layer}
            disabled={disabled}
            onChange={e => changeGestureLayer(Number(e.target.value))}
          >
            <option value={LAYER_NONE}>なし</option>
            {layersInclBase.map(l => (
              <option key={l} value={l}>Layer {l}</option>
            ))}
          </select>
        </div>
        {layerWarn?.target === 'gesture' && (
          <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>感度</p>
        <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>左右方向</p>
        <SliderControl
          value={gesture.thresholdH} min={10} max={200} step={5}
          disabled={disabled} unit=""
          onCommit={v => onGestureChange({ ...gesture, thresholdH: v })}
        />
        <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>上下方向</p>
        <SliderControl
          value={gesture.thresholdV} min={10} max={200} step={5}
          disabled={disabled} unit=""
          onCommit={v => onGestureChange({ ...gesture, thresholdV: v })}
        />
        <div className="tapping-term-hints">
          <span>10（敏感）</span>
          <span>デフォルト: 50</span>
          <span>200（鈍感）</span>
        </div>
      </div>

      {editDir && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={gesture[editDir]}
          keyLayout={keyLayout}
          defaultPanel="通常"
          hideHold
          onSelect={async (kc) => { await onGestureChange({ ...gesture, [editDir]: kc }); setEditDir(null); }}
          onClose={() => setEditDir(null)}
        />
      )}

      {editTap && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditTap(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">ジェスチャーキーをタップした時のキー</span>
              <button className="modal-close" onClick={() => setEditTap(false)}>✕</button>
            </div>
            <div className="modal-body">
              <TapKeyPicker
                value={gesture.tap}
                keyLayout={keyLayout}
                onChange={async (kc) => { await onGestureChange({ ...gesture, tap: kc }); setEditTap(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
