import { useState } from 'react';
import type { ShakeConfig } from '../../lib/protocol';
import { SHAKE_THRESHOLD_MIN, SHAKE_THRESHOLD_MAX, SHAKE_REVERSALS_MIN, SHAKE_REVERSALS_MAX, SHAKE_RUN_MAX_MS_MIN, SHAKE_RUN_MAX_MS_MAX, SHAKE_RUN_MAX_MS_STEP } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { SliderControl } from '../SettingsControls/SettingsControls';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';
import { TIPS } from '../../lib/tips';

interface ShakeCardProps {
  shake: ShakeConfig | null;
  onShakeChange: (s: ShakeConfig) => Promise<void>;
  disabled: boolean;
  keyLayout: KeyLayout;
}

export function ShakeCard({ shake, onShakeChange, disabled, keyLayout }: ShakeCardProps) {
  const [editKey, setEditKey] = useState(false);

  if (!shake) {
    return <p className="settings-desc">このファームは非対応です。</p>;
  }

  return (
    <>
      <div className="gesture-row">
        <span className="gesture-dir" data-tip={TIPS.shakeKey}>発動キー</span>
        <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditKey(true)}>
          {shake.key ? getKeyDisplayLabel(shake.key, keyLayout) : '未設定'}
        </button>
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.shakeSens}>感度</p>
        <SliderControl
          value={shake.threshold} min={SHAKE_THRESHOLD_MIN} max={SHAKE_THRESHOLD_MAX} step={5}
          disabled={disabled || !shake.key} unit="" invert
          onCommit={v => onShakeChange({ ...shake, threshold: v })}
        />
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.shakeCount}>シェイク回数</p>
        <SliderControl
          value={shake.reversals} min={SHAKE_REVERSALS_MIN} max={SHAKE_REVERSALS_MAX} step={1}
          disabled={disabled || !shake.key} unit="回"
          onCommit={v => onShakeChange({ ...shake, reversals: v })}
        />
      </div>

      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }} data-tip={TIPS.shakeTime}>振り切る時間の上限</p>
        <SliderControl
          value={shake.runMaxMs} min={SHAKE_RUN_MAX_MS_MIN} max={SHAKE_RUN_MAX_MS_MAX} step={SHAKE_RUN_MAX_MS_STEP}
          disabled={disabled || !shake.key} unit="ms"
          onCommit={v => onShakeChange({ ...shake, runMaxMs: v })}
        />
      </div>

      {editKey && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={shake.key}
          keyLayout={keyLayout}
          defaultPanel="通常"
          hideHold
          onSelect={async (kc) => { await onShakeChange({ ...shake, key: kc }); setEditKey(false); }}
          onClose={() => setEditKey(false)}
        />
      )}
    </>
  );
}
