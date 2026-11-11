import { translate } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useEffect, useState } from 'react';
import { buildHueGradient } from '../../lib/hueGradient';
import type { GestureConfig, GestureModeConfig, GestureThreshold, GestureWaveColor } from '../../lib/protocol';
import { LAYER_NONE } from '../../lib/protocol';
import type { KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import { getKeyDisplayLabel, isGestureExcludedKeycode } from '../../lib/keycodes';
import type { LayerWarn } from '../../hooks/useLayerConflict';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { KeyConfigModal, TapKeyPicker } from '../KeyConfigModal/KeyConfigModal';
import { TIPS } from '../../lib/tips';

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
  avail: FirmwareAvail;  // キー選択で、接続中ファームで使えないキーをグレーアウトする（キー設定パネルと同じ）
  layersInclBase: number[];
  layerWarn: LayerWarn | null;
  changeGestureLayer: (v: number) => void;
  changeGestureModeLayer: (mode: number, v: number) => void;
}

export function GestureCard({
  gesture, onGestureChange, gestureModes, onGestureModeChange, gestureThreshold, onGestureThresholdChange,
  gestureWaveSpeed, onGestureWaveSpeedChange, gestureWaveEnable, onGestureWaveEnableChange,
  gestureWaveStyle, onGestureWaveStyleChange, gestureWaveColor, onGestureWaveColorChange,
  disabled, keyLayout, avail, layersInclBase, layerWarn, changeGestureLayer, changeGestureModeLayer,
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
      ['up', translate(TextKey.BallPanelUp), 'continuousUp'],
      ['down', translate(TextKey.BallPanelDown), 'continuousDown'],
      ['left', translate(TextKey.BallPanelLeft), 'continuousLeft'],
      ['right', translate(TextKey.BallPanelRight), 'continuousRight'],
    ] as const;
    // 2026-10-06〜: 説明文は外し（本人希望）、モード切替の下を左右2列にする
    // （左=割り当てキー・連動レイヤー・感度、右=ジェスチャーウェーブ。画面が狭い時は縦1列。index.css参照）
    return (
      <>
        <div className="led-effect-selector gesture-mode-tabs" data-tip={TIPS.gestureMode}>
          {gestureModes.map((_, m) => (
            <button
              key={m}
              className={`btn btn--small btn--layer ${gestureModeTab === m ? 'btn--layer-active' : ''}`}
              onClick={() => setGestureModeTab(m)}
            >{translate(TextKey.Gesture)}{m + 1}
            </button>
          ))}
        </div>

        <div className="gesture-card__cols">
        <div className="gesture-card__col">
        <div className="card-sep">
          <div className="gesture-grid">
            {dirs.map(([dir, label, contKey]) => (
              <div key={dir} className="gesture-row">
                <span className="gesture-dir" data-tip={TIPS.gestureKeys}>{label}</span>
                <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditModeDir({ mode: gestureModeTab, dir })}>
                  {getKeyDisplayLabel(mode[dir], keyLayout) || translate(TextKey.BallPanelNotSet)}
                </button>
                <label className="setting-row__desc" data-tip={TIPS.gestureContinuous} style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={mode[contKey]}
                    onChange={e => onGestureModeChange(gestureModeTab, { ...mode, [contKey]: e.target.checked })}
                  />{translate(TextKey.BallPanelRepeatInput)}</label>
              </div>
            ))}
          </div>

          <div className="card-sep">
            <div className="setting-row">
              <div className="setting-row__text">
                <span className="setting-row__label" data-tip={TIPS.gestureLayer}>{translate(TextKey.GestureCardLinkedLayer)}</span>
              </div>
              <select
                className="trackball-bar__select"
                value={mode.layer}
                disabled={disabled}
                onChange={e => changeGestureModeLayer(gestureModeTab, Number(e.target.value))}
              >
                <option value={LAYER_NONE}>{translate(TextKey.KeyConfigModalNone)}</option>
                {layersInclBase.map(l => (
                  <option key={l} value={l}>{translate(TextKey.AppLayer)}{l}</option>
                ))}
              </select>
            </div>
            {layerWarn?.target === 'gestureMode' && layerWarn.mode === gestureModeTab && (
              <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
            )}
          </div>
        </div>

        <div className="card-sep">
          <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.gestureSens}>{translate(TextKey.GestureCardSensitivitySharedByModes)}</p>
          <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>{translate(TextKey.GestureCardHorizontal)}</p>
          <SliderControl
            value={gestureThreshold.h} min={10} max={200} step={5}
            disabled={disabled} unit="" invert
            onCommit={v => onGestureThresholdChange({ ...gestureThreshold, h: v })}
          />
          <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>{translate(TextKey.GestureCardVertical)}</p>
          <SliderControl
            value={gestureThreshold.v} min={10} max={200} step={5}
            disabled={disabled} unit="" invert
            onCommit={v => onGestureThresholdChange({ ...gestureThreshold, v: v })}
          />
        </div>
        </div>

        <div className="gesture-card__col">
        {gestureWaveSpeed !== null && gestureWaveEnable !== null && (
          <div className="card-sep">
            <ToggleRow
              label={translate(TextKey.BallPanelGestureWave)}
              tip={TIPS.gestureWave}
              desc=""
              checked={gestureWaveEnable}
              disabled={disabled}
              onChange={onGestureWaveEnableChange}
            />
            {gestureWaveStyle !== null && (
              <>
                <select
                  className="trackball-bar__select gesture-wave-style"
                  title={TIPS.gestureWaveStyle}
                  value={gestureWaveStyle[gestureModeTab]}
                  disabled={disabled || !gestureWaveEnable}
                  onChange={e => onGestureWaveStyleChange(gestureModeTab, Number(e.target.value))}
                >
                  <option value={0}>{translate(TextKey.BallPanelSharpBriefFlash)}</option>
                  <option value={1}>{translate(TextKey.GestureCardBreathingSoftBreathingFlow)}</option>
                </select>
              </>
            )}
            {gestureWaveColor !== null && (() => {
              const color = gestureWaveColor[gestureModeTab];
              const barColor = liveColor ?? color;
              return (
                <>
                  <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }} data-tip={TIPS.gestureHue}>{translate(TextKey.BallPanelHue)}</p>
                  {/* 虹色バーそのものをドラッグして色相を選ぶ（2026-10-06、本人希望で下の数値バーを廃止）。
                      バーの上に透明なスライダーを重ね、白い目印を動かす。右に数値を表示 */}
                  <div className="tapping-term-row hue-bar-row">
                    <div className={`led-panel__bar hue-bar ${disabled || !gestureWaveEnable ? 'hue-bar--disabled' : ''}`}>
                      <div className="led-panel__bar-fill" style={{ background: buildHueGradient(barColor) }} />
                      <div className="led-panel__marker" style={{ left: `${(barColor.hue / 255 * 100).toFixed(1)}%` }} />
                      <input
                        type="range" min={0} max={255} step={1}
                        className="hue-bar__input"
                        aria-label={translate(TextKey.BallPanelHue)}
                        value={barColor.hue}
                        disabled={disabled || !gestureWaveEnable}
                        onChange={e => setLiveColor({ ...barColor, hue: Number(e.target.value) })}
                        onPointerUp={e => onGestureWaveColorChange(gestureModeTab, { ...color, hue: Number((e.target as HTMLInputElement).value) })}
                        onKeyUp={e => onGestureWaveColorChange(gestureModeTab, { ...color, hue: Number((e.target as HTMLInputElement).value) })}
                      />
                    </div>
                    <span className="tapping-term-value">{barColor.hue}</span>
                  </div>
                  <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }} data-tip={TIPS.gestureSat}>{translate(TextKey.BallPanelSaturation)}</p>
                  <SliderControl
                    value={color.sat} min={0} max={255} step={1}
                    disabled={disabled || !gestureWaveEnable} unit=""
                    onChange={v => setLiveColor({ ...barColor, sat: v })}
                    onCommit={v => onGestureWaveColorChange(gestureModeTab, { ...color, sat: v })}
                  />
                  <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }} data-tip={TIPS.gestureVal}>{translate(TextKey.BallPanelBrightness)}</p>
                  <SliderControl
                    value={color.val} min={0} max={255} step={1}
                    disabled={disabled || !gestureWaveEnable} unit=""
                    onChange={v => setLiveColor({ ...barColor, val: v })}
                    onCommit={v => onGestureWaveColorChange(gestureModeTab, { ...color, val: v })}
                  />
                </>
              );
            })()}
            <p className="settings-desc" style={{ marginTop: 12, fontWeight: 600 }} data-tip={TIPS.gestureSpeed}>{translate(TextKey.GestureCardSpeed)}</p>
            <SliderControl
              value={gestureWaveSpeed[gestureModeTab]} min={1} max={255} step={1}
              disabled={disabled || !gestureWaveEnable} unit=""
              onCommit={v => onGestureWaveSpeedChange(gestureModeTab, v)}
            />
          </div>
        )}
        </div>
        </div>

        {editModeDir && (
          <KeyConfigModal
            keyIndex={-1}
            currentCode={gestureModes[editModeDir.mode][editModeDir.dir]}
            keyLayout={keyLayout}
            defaultPanel="通常"
            hideHold
            avail={avail}
            excludeCode={isGestureExcludedKeycode}
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
    return <p className="settings-desc">{translate(TextKey.DoubleFlickCardNotSupportedByThisFirmware)}</p>;
  }

  return (
    <>
      <div className="gesture-grid">
        {([['up', translate(TextKey.BallPanelUp)], ['down', translate(TextKey.BallPanelDown)], ['left', translate(TextKey.BallPanelLeft)], ['right', translate(TextKey.BallPanelRight)]] as const).map(([dir, label]) => (
          <div key={dir} className="gesture-row">
            <span className="gesture-dir">{label}</span>
            <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditDir(dir)}>
              {getKeyDisplayLabel(gesture[dir], keyLayout) || translate(TextKey.BallPanelNotSet)}
            </button>
          </div>
        ))}
      </div>

      <div className="card-sep">
        <div className="gesture-row">
          <span className="gesture-dir">{translate(TextKey.GestureCardTap)}</span>
          <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditTap(true)}>
            {gesture.tap ? getKeyDisplayLabel(gesture.tap, keyLayout) : translate(TextKey.GestureCardNoneHoldOnly)}
          </button>
        </div>
      </div>

      <div className="card-sep">
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__label" data-tip={TIPS.gestureLayer}>{translate(TextKey.GestureCardGestureLayer)}</span>
          </div>
          <select
            className="trackball-bar__select"
            value={gesture.layer}
            disabled={disabled}
            onChange={e => changeGestureLayer(Number(e.target.value))}
          >
            <option value={LAYER_NONE}>{translate(TextKey.KeyConfigModalNone)}</option>
            {layersInclBase.map(l => (
              <option key={l} value={l}>{translate(TextKey.AppLayer)}{l}</option>
            ))}
          </select>
        </div>
        {layerWarn?.target === 'gesture' && (
          <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
        )}
      </div>

      <div className="card-sep">
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.gestureSens}>{translate(TextKey.AutoMouseLayerCardSensitivity)}</p>
        <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>{translate(TextKey.GestureCardHorizontal)}</p>
        <SliderControl
          value={gesture.thresholdH} min={10} max={200} step={5}
          disabled={disabled} unit="" invert
          onCommit={v => onGestureChange({ ...gesture, thresholdH: v })}
        />
        <p className="settings-desc" style={{ marginTop: 8, fontWeight: 600 }}>{translate(TextKey.GestureCardVertical)}</p>
        <SliderControl
          value={gesture.thresholdV} min={10} max={200} step={5}
          disabled={disabled} unit="" invert
          onCommit={v => onGestureChange({ ...gesture, thresholdV: v })}
        />
      </div>

      {editDir && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={gesture[editDir]}
          keyLayout={keyLayout}
          defaultPanel="通常"
          hideHold
          avail={avail}
          excludeCode={isGestureExcludedKeycode}
          onSelect={async (kc) => { await onGestureChange({ ...gesture, [editDir]: kc }); setEditDir(null); }}
          onClose={() => setEditDir(null)}
        />
      )}

      {editTap && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditTap(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">{translate(TextKey.GestureCardKeySentWhenTappingTheGesture)}</span>
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
