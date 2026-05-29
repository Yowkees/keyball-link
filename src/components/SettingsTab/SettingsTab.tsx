import { useState } from 'react';
import type { KbSettings } from '../../lib/protocol';

interface SettingsTabProps {
  settings: KbSettings;
  isConnected: boolean;
  onChange: (s: KbSettings) => Promise<void>;
}

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, desc, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className={`setting-row ${disabled ? 'setting-row--disabled' : ''}`}>
      <div className="setting-row__text">
        <span className="setting-row__label">{label}</span>
        <span className="setting-row__desc">{desc}</span>
      </div>
      <button
        className={`toggle-btn ${checked ? 'toggle-btn--on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        aria-pressed={checked}
      >
        {checked ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export function SettingsTab({ settings, isConnected, onChange }: SettingsTabProps) {
  const [saving, setSaving] = useState(false);

  const apply = async (patch: Partial<KbSettings>) => {
    setSaving(true);
    try {
      await onChange({ ...settings, ...patch });
    } finally {
      setSaving(false);
    }
  };

  const disabled = !isConnected || saving;

  return (
    <div className="settings-tab">
      {!isConnected && (
        <div className="settings-notice">
          キーボードに接続すると設定を変更できます。
        </div>
      )}

      <section className="settings-card">
        <h2>Tapping Term <span className="settings-unit">長押し判定時間</span></h2>
        <p className="settings-desc">
          タップとホールドを区別する時間です。短くするとホールドが素早く反応し、長くするとタップが誤判定されにくくなります。
          タップダンス・Mod-Tap・Auto Shift すべてに影響します。
        </p>
        <div className="tapping-term-row">
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={settings.tappingTerm}
            disabled={disabled}
            onChange={e => apply({ tappingTerm: Number(e.target.value) })}
            className="tapping-term-slider"
          />
          <span className="tapping-term-value">{settings.tappingTerm} ms</span>
        </div>
        <div className="tapping-term-hints">
          <span>50ms（素早く）</span>
          <span>デフォルト: 200ms</span>
          <span>500ms（ゆっくり）</span>
        </div>
      </section>

      <section className="settings-card">
        <h2>キー動作オプション</h2>
        <div className="setting-rows">
          <ToggleRow
            label="Auto Shift"
            desc="対応キーを長押しすると自動でShiftが効いた文字を入力します（例: aを長押し→A）。Tapping Term より長く押すと発動します。"
            checked={settings.autoShift}
            disabled={disabled}
            onChange={v => apply({ autoShift: v })}
          />
          <ToggleRow
            label="Permissive Hold"
            desc="Mod-Tap / タップダンスのホールド判定を厳密にします。Tapping Term 内でも別キーを押した場合にホールドと判定します。"
            checked={settings.permissiveHold}
            disabled={disabled}
            onChange={v => apply({ permissiveHold: v })}
          />
          <ToggleRow
            label="Retro Tapping"
            desc="Mod-Tap キーをホールドして離したとき（他のキーを押さなかった場合）にタップも送信します。"
            checked={settings.retroTapping}
            disabled={disabled}
            onChange={v => apply({ retroTapping: v })}
          />
        </div>
        {saving && <p className="td-saving" style={{ marginTop: 8 }}>保存中…</p>}
      </section>
    </div>
  );
}
