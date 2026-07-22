import { useState } from 'react';
import type { KbSettings, GestureConfig } from '../../lib/protocol';
import { LAYER_NONE } from '../../lib/protocol';
import { FIRMWARE_FEATURES } from '../../lib/firmwareFeatures';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import { CollapsibleCard } from '../Collapsible/CollapsibleCard';
import { KeyConfigModal, TapKeyPicker } from '../KeyConfigModal/KeyConfigModal';
import type { ModelKey } from '../../layouts';

// ドラッグ中はローカルで滑らかに動かし、離したときだけ保存するスライダー
function SliderControl({ value, min, max, step, disabled, unit, onCommit }: {
  value: number; min: number; max: number; step: number;
  disabled: boolean; unit: string; onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(value);
  // 親から新しい値が来たらローカル値を追従させる（レンダー中の比較更新）
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

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
  model: ModelKey | null;
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

// モデルごとのProductID（VendorIDは共通: 22871）
const MODEL_PIDS: Record<ModelKey, number> = {
  keyball39: 512,
  keyball44: 1024,
  keyball61: 256,
};
const KEYBALL_VID = 22871;

// Python1行コマンドでplistを安全に書き換える（型が必ず整数になる）
function buildMacOSCommand(pid: number, kbType: 40 | 42): string {
  const typeVal = kbType;
  const keys = [`${pid}-${KEYBALL_VID}-0`, `${pid}-${KEYBALL_VID}-15`];
  const assignments = keys.map(k => `d['keyboardtype']['${k}']=${typeVal}`).join(';');
  return (
    `sudo python3 -c "import plistlib,pathlib;` +
    `p=pathlib.Path('/Library/Preferences/com.apple.keyboardtype.plist');` +
    `d=plistlib.loads(p.read_bytes());d.setdefault('keyboardtype',{});` +
    `${assignments};` +
    `p.write_bytes(plistlib.dumps(d,fmt=plistlib.FMT_BINARY))" && ` +
    `sudo killall cfprefsd && ` +
    `echo "完了。キーボードを一度抜き差ししてください。"`
  );
}

function MacOSKeyboardSetup({ defaultLayout, model }: { defaultLayout: KeyLayout; model: ModelKey | null }) {
  const [layout, setLayout] = useState<KeyLayout>(defaultLayout);
  const [copied, setCopied] = useState(false);

  const pid = model ? MODEL_PIDS[model] : null;
  const command = pid ? buildMacOSCommand(pid, layout === 'JIS' ? 42 : 40) : null;

  const handleCopy = async () => {
    if (!command) return;
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

      {!model ? (
        <p className="settings-desc" style={{ marginTop: 8 }}>
          キーボードを接続すると、そのモデル専用のコマンドが表示されます。
        </p>
      ) : (
        <>
          <p className="settings-desc" style={{ marginTop: 4, marginBottom: 4 }}>
            対象モデル: <strong>{model}</strong>
          </p>

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
            <span>コマンド実行後、キーボードを一度抜き差しする（再起動は不要）</span>
          </div>

          <p className="macos-setup-note">
            ※ 一度設定すれば次回以降は不要です。JIS/USを切り替えたい場合は配列を選び直してコマンドを再実行してください。
          </p>
        </>
      )}
    </div>
  );
}

export function SettingsTab({ settings, isConnected, model, onChange, gesture, onGestureChange, keyLayout, onKeyLayoutChange, children }: SettingsTabProps) {
  const [saving, setSaving] = useState(false);
  const [editDir, setEditDir] = useState<keyof GestureConfig | null>(null);
  const [editTap, setEditTap] = useState(false);
  const [layerWarn, setLayerWarn] = useState<{ target: 'aml' | 'scroll' | 'gesture'; msg: string } | null>(null);

  const apply = async (patch: Partial<KbSettings>) => {
    setSaving(true);
    try {
      await onChange({ ...settings, ...patch });
    } finally {
      setSaving(false);
    }
  };

  const disabled = !isConnected || saving;
  // LED版に接続中（＝ジェスチャー非対応）。タッピング詳細設定はLED版では効かないので、
  // 非表示にはせず「表示はするが操作不可（グレーアウト）」にする。未接続時はグレーアウトしない。
  const tappingUnavail = isConnected && gesture === null;

  // 3つのトラックボール動作レイヤー（自動マウス/スクロール/ジェスチャー）の重複を検出。
  // target を val にしたとき、有効な他機能と同じレイヤーになっていたらその名前を返す。
  const conflictName = (target: 'aml' | 'scroll' | 'gesture', val: number): string | null => {
    if (val === LAYER_NONE) return null;  // 「なし」は重複しない
    const others: [string, number][] = [];
    if (target !== 'aml' && settings.autoMouseEnable)
      others.push(['自動マウスレイヤー', settings.autoMouseLayer]);
    if (target !== 'scroll' && settings.scrollLayer !== LAYER_NONE)
      others.push(['スクロールレイヤー', settings.scrollLayer]);
    if (target !== 'gesture' && gesture && gesture.layer !== LAYER_NONE)
      others.push(['ジェスチャーレイヤー', gesture.layer]);
    const hit = others.find(([, l]) => l === val);
    return hit ? hit[0] : null;
  };

  // レイヤー選択の共通ハンドラ。重複なら警告して保存しない。
  const changeLayer = (target: 'aml' | 'scroll' | 'gesture', val: number, save: () => void) => {
    const c = conflictName(target, val);
    if (c) {
      setLayerWarn({ target, msg: `${c}と同じレイヤーのため保存できません。別のレイヤーを選んでください。` });
    } else {
      setLayerWarn(null);
      save();
    }
  };
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X/i.test(navigator.userAgent);

  return (
    <div className="settings-tab">
      {!isConnected && (
        <div className="settings-notice">
          キーボードに接続すると設定を変更できます。
        </div>
      )}

      <CollapsibleCard title={<>Tapping Term <span className="settings-unit">長押し判定時間</span></>}>
        {tappingUnavail && (
          <p className="settings-desc" style={{ color: 'var(--red)' }}>⚠ この版（LED版）では使用できません（固定200msで動作します）。通常版で設定できます。</p>
        )}
        <div style={tappingUnavail ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
          <p className="settings-desc">
            タップとホールドを区別する時間です。短くするとホールドが素早く反応し、長くするとタップが誤判定されにくくなります。
            Mod-Tap{FIRMWARE_FEATURES.tapDance ? '・タップダンス' : ''}{FIRMWARE_FEATURES.autoShift ? '・Auto Shift' : ''} の判定に影響します。
          </p>
          <SliderControl
            value={settings.tappingTerm} min={50} max={500} step={10}
            disabled={disabled || tappingUnavail} unit="ms"
            onCommit={v => apply({ tappingTerm: v })}
          />
          <div className="tapping-term-hints">
            <span>50ms（素早く）</span>
            <span>デフォルト: 200ms</span>
            <span>500ms（ゆっくり）</span>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="キー動作オプション">
        {tappingUnavail && (
          <p className="settings-desc" style={{ color: 'var(--red)' }}>⚠ この版（LED版）では使用できません。通常版で設定できます。</p>
        )}
        <div style={tappingUnavail ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
          <div className="setting-rows">
            {FIRMWARE_FEATURES.autoShift && (
              <ToggleRow
                label="Auto Shift"
                desc="対応キーを長押しすると自動でShiftが効いた文字を入力します（例: aを長押し→A）。Tapping Term より長く押すと発動します。"
                checked={settings.autoShift} disabled={disabled || tappingUnavail}
                onChange={v => apply({ autoShift: v })}
              />
            )}
            <ToggleRow
              label="Permissive Hold"
              desc="Mod-Tap のホールド判定を厳密にします。Tapping Term 内でも別キーを押した場合にホールドと判定します。"
              checked={settings.permissiveHold} disabled={disabled || tappingUnavail}
              onChange={v => apply({ permissiveHold: v })}
            />
          </div>
          {saving && <p className="td-saving" style={{ marginTop: 8 }}>保存中…</p>}
        </div>
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
              onChange={e => { const v = Number(e.target.value); changeLayer('aml', v, () => apply({ autoMouseLayer: v })); }}
            >
              <option value={1}>Layer 1</option>
              <option value={2}>Layer 2</option>
              <option value={3}>Layer 3</option>
            </select>
          </div>
          {layerWarn?.target === 'aml' && (
            <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
          )}
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

      <CollapsibleCard title={<>スクロールレイヤー <span className="settings-unit">このレイヤーでトラックボール＝スクロール</span></>}>
        <div className="setting-row">
          <div className="setting-row__text">
            <span className="setting-row__label">スクロールになるレイヤー</span>
            <span className="setting-row__desc">選んだレイヤーにいる間、トラックボールがスクロールになります。「なし」でスクロール無効。</span>
          </div>
          <select
            className="trackball-bar__select"
            value={settings.scrollLayer}
            disabled={disabled}
            onChange={e => { const v = Number(e.target.value); changeLayer('scroll', v, () => apply({ scrollLayer: v })); }}
          >
            <option value={LAYER_NONE}>なし</option>
            <option value={1}>Layer 1</option>
            <option value={2}>Layer 2</option>
            <option value={3}>Layer 3</option>
          </select>
        </div>
        {layerWarn?.target === 'scroll' && (
          <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
        )}
        <p className="settings-desc" style={{ marginTop: 8 }}>
          ※ どのレイヤーでスクロールにするかを変えるだけです。各レイヤーのキーの中身は移動しないので、必要ならキーマップ側で並べ替えてください。
        </p>
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

            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div className="gesture-row">
                <span className="gesture-dir">タップ</span>
                <button className="gesture-key-btn" disabled={disabled} onClick={() => setEditTap(true)}>
                  {gesture.tap ? getKeyDisplayLabel(gesture.tap, keyLayout) : 'なし（長押し専用）'}
                </button>
              </div>
              <p className="settings-desc" style={{ marginTop: 8 }}>
                ジェスチャーキーを<strong>サッと押して離す</strong>とこのキーを入力します（タップ／長押し兼用）。<br />
                「なし」にすると<strong>長押し専用</strong>（従来どおり）です。Space・Enter など単独で押すキーのみ設定できます。
              </p>
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div className="setting-row">
                <div className="setting-row__text">
                  <span className="setting-row__label">ジェスチャーレイヤー</span>
                  <span className="setting-row__desc">選んだレイヤーにいる間、トラックボールを振るとジェスチャー発動（キーを押さなくてOK）。「なし」で無効。</span>
                </div>
                <select
                  className="trackball-bar__select"
                  value={gesture.layer}
                  disabled={disabled}
                  onChange={e => { const v = Number(e.target.value); changeLayer('gesture', v, () => onGestureChange({ ...gesture, layer: v })); }}
                >
                  <option value={LAYER_NONE}>なし</option>
                  <option value={1}>Layer 1</option>
                  <option value={2}>Layer 2</option>
                  <option value={3}>Layer 3</option>
                </select>
              </div>
              {layerWarn?.target === 'gesture' && (
                <p className="settings-desc" style={{ color: 'var(--red)', marginTop: 4 }}>⚠ {layerWarn.msg}</p>
              )}
              <p className="settings-desc" style={{ marginTop: 8 }}>
                ※ スクロール／自動マウスと同じレイヤーは選べません。
              </p>
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <p className="settings-desc">
                <strong>感度</strong>：トラックボールをどれくらい動かしたら発動するかです。小さいほど少しの動きで反応し（敏感）、大きいほどしっかり振らないと反応しません（鈍感）。上下と左右は別々に調整できます（左右の方が反応しやすい・上下が反応しにくいと感じたら、上下だけ数値を下げてみてください）。
              </p>
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
          {'　'}→ キーマップ画面の表示に反映されます
        </p>
      </CollapsibleCard>

      {isMacOS && (
        <CollapsibleCard title={<>macOS キーボードタイプ設定 <span className="settings-unit">初回のみ必要</span></>}>
          <MacOSKeyboardSetup defaultLayout={keyLayout} model={model} />
        </CollapsibleCard>
      )}

      {children}

      {editDir && gesture && (
        <KeyConfigModal
          keyIndex={-1}
          currentCode={gesture[editDir]}
          keyLayout={keyLayout}
          defaultPanel="カスタム"
          hideHold
          onSelect={async (kc) => { await onGestureChange({ ...gesture, [editDir]: kc }); setEditDir(null); }}
          onClose={() => setEditDir(null)}
        />
      )}

      {editTap && gesture && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditTap(false); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">ジェスチャーキーをタップした時のキー</span>
              <button className="modal-close" onClick={() => setEditTap(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="settings-desc" style={{ marginBottom: 8 }}>
                Space・Enter・英字など、単独で押すキーのみ選べます。「なし」を選ぶと長押し専用になります。
              </p>
              <TapKeyPicker
                value={gesture.tap}
                keyLayout={keyLayout}
                onChange={async (kc) => { await onGestureChange({ ...gesture, tap: kc }); setEditTap(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
