import { useState, useEffect } from 'react';
import type { KbSettings, GestureConfig } from '../../lib/protocol';
import { FIRMWARE_FEATURES } from '../../lib/firmwareFeatures';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { CollapsibleCard } from '../Collapsible/CollapsibleCard';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';

// ドラッグ中はローカルで滑らかに動かし、離したときだけ保存するスライダー
function SliderControl({ value, min, max, step, disabled, unit, onCommit }: {
  value: number; min: number; max: number; step: number;
  disabled: boolean; unit: string; onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  const commit = () => { if (local !== value) onCommit(local); };

  return (
    <div className="tapping-term-row">
      <input
        type="range" min={min} max={max} step={step} value={local} disabled={disabled}
        onChange={e => setLocal(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        className="tapping-term-slider"
      />
      <span className="tapping-term-value">{local} {unit}</span>
    </div>
  );
}

interface SettingsTabProps {
  settings: KbSettings;
  isConnected: boolean;
  onChange: (s: KbSettings) => Promise<void>;
  gesture: GestureConfig | null;
  onGestureChange: (g: GestureConfig) => Promise<void>;
  keyLayout: KeyLayout;
  onKeyLayoutChange: (layout: KeyLayout) => void;
  children?: React.ReactNode;
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

// macOS用キーボードタイプ設定セクション
// plistのキー: "ProductID-VendorID-0" (Keyball39: 512-22871-0)
const MACOS_PLIST_JIS_CMD =
  'sudo /usr/libexec/PlistBuddy -c "Set :keyboardtype:512-22871-0 42" ' +
  '/Library/Preferences/com.apple.keyboardtype.plist 2>/dev/null || ' +
  'sudo /usr/libexec/PlistBuddy -c "Add :keyboardtype:512-22871-0 integer 42" ' +
  '/Library/Preferences/com.apple.keyboardtype.plist && ' +
  'echo "設定完了。Macを再起動してください。"';

const MACOS_PLIST_US_CMD =
  'sudo /usr/libexec/PlistBuddy -c "Set :keyboardtype:512-22871-0 40" ' +
  '/Library/Preferences/com.apple.keyboardtype.plist 2>/dev/null || ' +
  'sudo /usr/libexec/PlistBuddy -c "Add :keyboardtype:512-22871-0 integer 40" ' +
  '/Library/Preferences/com.apple.keyboardtype.plist && ' +
  'echo "設定完了。Macを再起動してください。"';

function MacOSKeyboardSetup({ defaultLayout }: { defaultLayout: KeyLayout }) {
  const [layout, setLayout] = useState<KeyLayout>(defaultLayout);
  const [copied, setCopied] = useState(false);

  const command = layout === 'JIS' ? MACOS_PLIST_JIS_CMD : MACOS_PLIST_US_CMD;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <p className="settings-desc">
        macOSはKeyballの配列（JIS/US）を自動判定できない場合があります。<br />
        以下のコマンドを一度実行することで、@キーなどの記号が正しく入力できるようになります。
      </p>

      <div className="macos-layout-toggle">
        <span className="macos-layout-label">使用する配列：</span>
        <button
          className={`layout-toggle-btn macos-toggle-btn ${layout === 'JIS' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => setLayout('JIS')}
        >
          JIS配列
          <span className="layout-toggle-example">@ は独立キー</span>
        </button>
        <button
          className={`layout-toggle-btn macos-toggle-btn ${layout === 'US' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => setLayout('US')}
        >
          US配列
          <span className="layout-toggle-example">@ は Shift+2</span>
        </button>
      </div>

      <div className="macos-steps">
        <div className="macos-step">
          <span className="macos-step__num">①</span>
          <span>ターミナルを開く（Finder → アプリケーション → ユーティリティ → ターミナル）</span>
        </div>
        <div className="macos-step">
          <span className="macos-step__num">②</span>
          <span>以下のコマンドをコピーして貼り付け、Enterを押す</span>
        </div>
      </div>

      <div className="macos-command-block">
        <code className="macos-command-text">{command}</code>
        <button
          className={`macos-copy-btn ${copied ? 'macos-copy-btn--done' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✅ コピー済み' : '📋 コピー'}
        </button>
      </div>

      <div className="macos-step" style={{ marginTop: 8 }}>
        <span className="macos-step__num">③</span>
        <span>Macを再起動する（再起動後から有効になります）</span>
      </div>

      <p className="macos-setup-note">
        ※ 一度設定すれば次回以降は不要です。JIS/USを切り替えたい場合は配列を選び直してコマンドを再実行してください。
      </p>
    </div>
  );
}

export function SettingsTab({ settings, isConnected, onChange, gesture, onGestureChange, keyLayout, onKeyLayoutChange, children }: SettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const [editDir, setEditDir] = useState<keyof GestureConfig | null>(null);

  const apply = async (patch: Partial<KbSettings>) => {
    setSaving(true);
    try {
      await onChange({ ...settings, ...patch });
    } finally {
      setSaving(false);
    }
  };

  const disabled = !isConnected || saving;
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X/i.test(navigator.userAgent);

  return (
    <div className="settings-tab">
      {!isConnected && (
        <div className="settings-notice">
          キーボードに接続すると設定を変更できます。
        </div>
      )}

      <CollapsibleCard title={<>Tapping Term <span className="settings-unit">長押し判定時間</span></>}>
        <p className="settings-desc">
          タップとホールドを区別する時間です。短くするとホールドが素早く反応し、長くするとタップが誤判定されにくくなります。
          Mod-Tap{FIRMWARE_FEATURES.tapDance ? '・タップダンス' : ''}{FIRMWARE_FEATURES.autoShift ? '・Auto Shift' : ''} の判定に影響します。
        </p>
        <SliderControl
          value={settings.tappingTerm} min={50} max={500} step={10}
          disabled={disabled} unit="ms"
          onCommit={v => apply({ tappingTerm: v })}
        />
        <div className="tapping-term-hints">
          <span>50ms（素早く）</span>
          <span>デフォルト: 200ms</span>
          <span>500ms（ゆっくり）</span>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="キー動作オプション">
        <div className="setting-rows">
          {FIRMWARE_FEATURES.autoShift && (
            <ToggleRow
              label="Auto Shift"
              desc="対応キーを長押しすると自動でShiftが効いた文字を入力します（例: aを長押し→A）。Tapping Term より長く押すと発動します。"
              checked={settings.autoShift} disabled={disabled}
              onChange={v => apply({ autoShift: v })}
            />
          )}
          <ToggleRow
            label="Permissive Hold"
            desc="Mod-Tap のホールド判定を厳密にします。Tapping Term 内でも別キーを押した場合にホールドと判定します。"
            checked={settings.permissiveHold} disabled={disabled}
            onChange={v => apply({ permissiveHold: v })}
          />
          <ToggleRow
            label="Retro Tapping"
            desc="Mod-Tap キーをホールドして離したとき（他のキーを押さなかった場合）にタップも送信します。"
            checked={settings.retroTapping} disabled={disabled}
            onChange={v => apply({ retroTapping: v })}
          />
        </div>
        {saving && <p className="td-saving" style={{ marginTop: 8 }}>保存中…</p>}
      </CollapsibleCard>

      <CollapsibleCard title={<>自動マウスレイヤー <span className="settings-unit">トラックボール操作で自動レイヤー切替</span></>}>
        <p className="settings-desc">
          トラックボールを動かすと自動で指定レイヤーに切り替わり、操作をやめて一定時間たつと元に戻ります。
          マウス操作用のキー（クリックなど）を別レイヤーに置いている場合に便利です。
        </p>
        <div className="setting-rows">
          <ToggleRow
            label="自動マウスレイヤーを使う"
            desc="トラックボールを動かしたとき、自動的に下記のレイヤーへ切り替えます。"
            checked={settings.autoMouseEnable}
            disabled={disabled}
            onChange={v => apply({ autoMouseEnable: v })}
          />
          <div className={`setting-row ${disabled || !settings.autoMouseEnable ? 'setting-row--disabled' : ''}`}>
            <div className="setting-row__text">
              <span className="setting-row__label">切り替わるレイヤー</span>
              <span className="setting-row__desc">トラックボール操作中に有効になるレイヤーです。</span>
            </div>
            <select
              className="trackball-bar__select"
              value={settings.autoMouseLayer}
              disabled={disabled || !settings.autoMouseEnable}
              onChange={e => apply({ autoMouseLayer: Number(e.target.value) })}
            >
              <option value={1}>Layer 1</option>
              <option value={2}>Layer 2</option>
              <option value={3}>Layer 3</option>
            </select>
          </div>
        </div>
        <div style={{ opacity: disabled || !settings.autoMouseEnable ? 0.5 : 1 }}>
          <SliderControl
            value={settings.autoMouseTimeout} min={100} max={2000} step={50}
            disabled={disabled || !settings.autoMouseEnable} unit="ms"
            onCommit={v => apply({ autoMouseTimeout: v })}
          />
        </div>
        <div className="tapping-term-hints">
          <span>100ms（すぐ戻る）</span>
          <span>デフォルト: 650ms</span>
          <span>2000ms（長く維持）</span>
        </div>

        <p className="settings-desc" style={{ marginTop: 16 }}>
          <strong>切り替わり感度</strong>：トラックボールをどれくらい動かしたらレイヤーが切り替わるかです。小さいほど少しの動きで切り替わり（敏感）、大きいほど大きく動かさないと切り替わりません（鈍感）。
        </p>
        <div style={{ opacity: disabled || !settings.autoMouseEnable ? 0.5 : 1 }}>
          <SliderControl
            value={settings.autoMouseThreshold} min={1} max={40} step={1}
            disabled={disabled || !settings.autoMouseEnable} unit=""
            onCommit={v => apply({ autoMouseThreshold: v })}
          />
        </div>
        <div className="tapping-term-hints">
          <span>1（とても敏感）</span>
          <span>デフォルト: 10</span>
          <span>40（鈍感）</span>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title={<>ジェスチャー <span className="settings-unit">トラックボールを振って操作</span></>}>
        {gesture === null ? (
          <p className="settings-desc">
            このファーム（機種・バージョン）は<strong>ジェスチャー非対応</strong>です。対応版を書き込むと設定できます。
          </p>
        ) : (
          <>
            <p className="settings-desc">
              パレットの「Keyball」にある<strong>「ジェスチャー」キー</strong>をキーマップに置き、<strong>押しながらトラックボールを上下左右に振る</strong>と、各方向に割り当てた操作が実行されます（押している間は何度でも反応）。
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
              初期設定: 左=戻る / 右=進む / 上=前のタブ / 下=次のタブ（macブラウザ標準）
            </p>
          </>
        )}
      </CollapsibleCard>

      <CollapsibleCard title={<>キー表示の配列設定 <span className="settings-unit">表示のみ・入力文字は変わりません</span></>}>
        <p className="settings-desc">
          キーマップ画面のキーに表示される文字を切り替えます。<br />
          実際にキーボードから入力される文字は変わりません。入力文字を変えるには下の「macOS キーボードタイプ設定」をご利用ください。
        </p>
        <div className="layout-toggle-row">
          <button
            className={`layout-toggle-btn ${keyLayout === 'JIS' ? 'layout-toggle-btn--active' : ''}`}
            onClick={() => onKeyLayoutChange('JIS')}
          >
            JIS配列<span className="layout-toggle-example">Shift+2 = "</span>
          </button>
          <button
            className={`layout-toggle-btn ${keyLayout === 'US' ? 'layout-toggle-btn--active' : ''}`}
            onClick={() => onKeyLayoutChange('US')}
          >
            US配列<span className="layout-toggle-example">Shift+2 = @</span>
          </button>
        </div>
        <p className="layout-toggle-note">
          現在: <strong>{keyLayout === 'JIS' ? 'JIS配列（日本語キーボード）' : 'US配列（英語キーボード）'}</strong>
          　→ キーマップ画面の表示に反映されます
        </p>
      </CollapsibleCard>

      {isMacOS && (
        <CollapsibleCard title={<>macOS キーボードタイプ設定 <span className="settings-unit">初回のみ必要</span></>}>
          <MacOSKeyboardSetup defaultLayout={keyLayout} />
        </CollapsibleCard>
      )}

      {children}

      {editDir && gesture && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={gesture[editDir]}
          keyLayout={keyLayout}
          defaultPanel="カスタム"
          onSelect={async (kc) => { await onGestureChange({ ...gesture, [editDir]: kc }); setEditDir(null); }}
          onClose={() => setEditDir(null)}
        />
      )}
    </div>
  );
}
