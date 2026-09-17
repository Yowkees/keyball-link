import { useState } from 'react';
import type { DFlickConfig } from '../../lib/protocol';
import { DFLICK_WINDOW_MS_MIN, DFLICK_WINDOW_MS_MAX, DFLICK_WINDOW_MS_DEFAULT, DFLICK_WINDOW_MS_STEP, DFLICK_FLICK_THRESHOLD_MIN, DFLICK_FLICK_THRESHOLD_MAX, DFLICK_FLICK_THRESHOLD_DEFAULT, DFLICK_MAX_DURATION_MS_MIN, DFLICK_MAX_DURATION_MS_MAX, DFLICK_MAX_DURATION_MS_DEFAULT, DFLICK_MAX_DURATION_MS_STEP } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';

interface DoubleFlickCardProps {
  dflick: DFlickConfig | null;
  onDFlickChange: (d: DFlickConfig) => Promise<void>;
  disabled: boolean;
  keyLayout: KeyLayout;
}

export function DoubleFlickCard({ dflick, onDFlickChange, disabled, keyLayout }: DoubleFlickCardProps) {
  const [editDir, setEditDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  if (!dflick) {
    return <p className="settings-desc">このファームは非対応です。</p>;
  }

  return (
    <>
      <ToggleRow
        label="ダブルフリックを有効化"
        desc=""
        checked={dflick.enable} disabled={disabled}
        onChange={v => onDFlickChange({ ...dflick, enable: v })}
      />
      <div className="gesture-grid" style={{ marginTop: 12 }}>
        {([['up', '上 ↑'], ['down', '下 ↓'], ['left', '左 ←'], ['right', '右 →']] as const).map(([dir, label]) => (
          <div key={dir} className="gesture-row">
            <span className="gesture-dir">{label}</span>
            <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditDir(dir)}>
              {dflick[dir] ? getKeyDisplayLabel(dflick[dir], keyLayout) : '未設定'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>フリック判定の感度</p>
        <SliderControl
          value={dflick.flickThreshold} min={DFLICK_FLICK_THRESHOLD_MIN} max={DFLICK_FLICK_THRESHOLD_MAX} step={5}
          disabled={disabled} unit=""
          onCommit={v => onDFlickChange({ ...dflick, flickThreshold: v })}
        />
        <div className="tapping-term-hints">
          <span>{DFLICK_FLICK_THRESHOLD_MIN}（敏感）</span>
          <span>デフォルト: {DFLICK_FLICK_THRESHOLD_DEFAULT}</span>
          <span>{DFLICK_FLICK_THRESHOLD_MAX}（鈍感）</span>
        </div>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>フリックとみなす動作時間の上限</p>
        <SliderControl
          value={dflick.maxDurationMs} min={DFLICK_MAX_DURATION_MS_MIN} max={DFLICK_MAX_DURATION_MS_MAX} step={DFLICK_MAX_DURATION_MS_STEP}
          disabled={disabled} unit="ms"
          onCommit={v => onDFlickChange({ ...dflick, maxDurationMs: v })}
        />
        <div className="tapping-term-hints">
          <span>{DFLICK_MAX_DURATION_MS_MIN}ms（短い動きだけ）</span>
          <span>デフォルト: {DFLICK_MAX_DURATION_MS_DEFAULT}ms</span>
          <span>{DFLICK_MAX_DURATION_MS_MAX}ms（長い動きも許容）</span>
        </div>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>時間窓</p>
        <SliderControl
          value={dflick.windowMs} min={DFLICK_WINDOW_MS_MIN} max={DFLICK_WINDOW_MS_MAX} step={DFLICK_WINDOW_MS_STEP}
          disabled={disabled} unit="ms"
          onCommit={v => onDFlickChange({ ...dflick, windowMs: v })}
        />
        <div className="tapping-term-hints">
          <span>{DFLICK_WINDOW_MS_MIN}ms（素早く）</span>
          <span>デフォルト: {DFLICK_WINDOW_MS_DEFAULT}ms</span>
          <span>{DFLICK_WINDOW_MS_MAX}ms（ゆっくり）</span>
        </div>
      </div>

      {editDir && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={dflick[editDir]}
          keyLayout={keyLayout}
          defaultPanel="カスタム"
          hideHold
          onSelect={async (kc) => { await onDFlickChange({ ...dflick, [editDir]: kc }); setEditDir(null); }}
          onClose={() => setEditDir(null)}
        />
      )}
    </>
  );
}
