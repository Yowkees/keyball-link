import { useState } from 'react';
import type { DFlickConfig } from '../../lib/protocol';
import { DFLICK_WINDOW_MS_MIN, DFLICK_WINDOW_MS_MAX, DFLICK_WINDOW_MS_STEP, DFLICK_FLICK_THRESHOLD_MIN, DFLICK_FLICK_THRESHOLD_MAX, DFLICK_MAX_DURATION_MS_MIN, DFLICK_MAX_DURATION_MS_MAX, DFLICK_MAX_DURATION_MS_STEP } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { SliderControl } from '../SettingsControls/SettingsControls';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';
import { TIPS } from '../../lib/tips';

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
      <div className="gesture-grid dflick-keys" style={{ marginTop: 0 }}>
        {([['up', '上 ↑'], ['down', '下 ↓'], ['left', '左 ←'], ['right', '右 →']] as const).map(([dir, label]) => (
          <div key={dir} className="gesture-row">
            <span className="gesture-dir" data-tip={TIPS.dflickKeys}><span className="gesture-dir__word">{label.slice(0, 1)}</span>{label.slice(1)}</span>
            <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditDir(dir)}>
              {dflick[dir] ? getKeyDisplayLabel(dflick[dir], keyLayout) : '未設定'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.dflickSens}>フリック判定の感度</p>
        <SliderControl
          value={dflick.flickThreshold} min={DFLICK_FLICK_THRESHOLD_MIN} max={DFLICK_FLICK_THRESHOLD_MAX} step={5}
          disabled={disabled} unit="" invert
          onCommit={v => onDFlickChange({ ...dflick, flickThreshold: v })}
        />
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.dflickDuration}>フリック受付動作時間</p>
        <SliderControl
          value={dflick.maxDurationMs} min={DFLICK_MAX_DURATION_MS_MIN} max={DFLICK_MAX_DURATION_MS_MAX} step={DFLICK_MAX_DURATION_MS_STEP}
          disabled={disabled} unit="ms"
          onCommit={v => onDFlickChange({ ...dflick, maxDurationMs: v })}
        />
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.dflickWindow}>2回目の受付時間</p>
        <SliderControl
          value={dflick.windowMs} min={DFLICK_WINDOW_MS_MIN} max={DFLICK_WINDOW_MS_MAX} step={DFLICK_WINDOW_MS_STEP}
          disabled={disabled} unit="ms"
          onCommit={v => onDFlickChange({ ...dflick, windowMs: v })}
        />
      </div>

      {editDir && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={dflick[editDir]}
          keyLayout={keyLayout}
          defaultPanel="通常"
          hideHold
          onSelect={async (kc) => { await onDFlickChange({ ...dflick, [editDir]: kc }); setEditDir(null); }}
          onClose={() => setEditDir(null)}
        />
      )}
    </>
  );
}
