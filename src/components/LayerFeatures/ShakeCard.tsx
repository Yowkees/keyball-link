import { useState } from 'react';
import type { ShakeConfig } from '../../lib/protocol';
import { SHAKE_THRESHOLD_MIN, SHAKE_THRESHOLD_MAX, SHAKE_THRESHOLD_DEFAULT, SHAKE_REVERSALS_MIN, SHAKE_REVERSALS_MAX, SHAKE_REVERSALS_DEFAULT, SHAKE_RUN_MAX_MS_MIN, SHAKE_RUN_MAX_MS_MAX, SHAKE_RUN_MAX_MS_DEFAULT, SHAKE_RUN_MAX_MS_STEP } from '../../lib/protocol';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { SliderControl, ToggleRow } from '../SettingsControls/SettingsControls';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';

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
      <ToggleRow
        label="シェイクを有効化"
        desc=""
        checked={shake.enable} disabled={disabled}
        onChange={v => onShakeChange({ ...shake, enable: v })}
      />
      <div className="gesture-row" style={{ marginTop: 12 }}>
        <span className="gesture-dir">発動キー</span>
        <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditKey(true)}>
          {shake.key ? getKeyDisplayLabel(shake.key, keyLayout) : '未設定'}
        </button>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>感度</p>
        <SliderControl
          value={shake.threshold} min={SHAKE_THRESHOLD_MIN} max={SHAKE_THRESHOLD_MAX} step={5}
          disabled={disabled || !shake.key} unit=""
          onCommit={v => onShakeChange({ ...shake, threshold: v })}
        />
        <div className="tapping-term-hints">
          <span>{SHAKE_THRESHOLD_MIN}（敏感）</span>
          <span>デフォルト: {SHAKE_THRESHOLD_DEFAULT}</span>
          <span>{SHAKE_THRESHOLD_MAX}（鈍感）</span>
        </div>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>反転回数</p>
        <SliderControl
          value={shake.reversals} min={SHAKE_REVERSALS_MIN} max={SHAKE_REVERSALS_MAX} step={1}
          disabled={disabled || !shake.key} unit="回"
          onCommit={v => onShakeChange({ ...shake, reversals: v })}
        />
        <div className="tapping-term-hints">
          <span>{SHAKE_REVERSALS_MIN}回（緩い）</span>
          <span>デフォルト: {SHAKE_REVERSALS_DEFAULT}回</span>
          <span>{SHAKE_REVERSALS_MAX}回（厳しい）</span>
        </div>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p className="settings-desc" style={{ fontWeight: 600 }}>振り切る時間の上限</p>
        <SliderControl
          value={shake.runMaxMs} min={SHAKE_RUN_MAX_MS_MIN} max={SHAKE_RUN_MAX_MS_MAX} step={SHAKE_RUN_MAX_MS_STEP}
          disabled={disabled || !shake.key} unit="ms"
          onCommit={v => onShakeChange({ ...shake, runMaxMs: v })}
        />
        <div className="tapping-term-hints">
          <span>{SHAKE_RUN_MAX_MS_MIN}ms（厳しい）</span>
          <span>デフォルト: {SHAKE_RUN_MAX_MS_DEFAULT}ms</span>
          <span>{SHAKE_RUN_MAX_MS_MAX}ms（緩い）</span>
        </div>
      </div>

      {editKey && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={shake.key}
          keyLayout={keyLayout}
          defaultPanel="カスタム"
          hideHold
          onSelect={async (kc) => { await onShakeChange({ ...shake, key: kc }); setEditKey(false); }}
          onClose={() => setEditKey(false)}
        />
      )}
    </>
  );
}
