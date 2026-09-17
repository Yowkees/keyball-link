import { useState } from 'react';
import type { KeyLayout } from '../../lib/keycodes';
import type { ModelKey } from '../../layouts';

// モデルごとのProductID（VendorIDは共通: 22871）
const MODEL_PIDS: Record<ModelKey, number> = {
  keyball39: 512,
  keyball44: 1024,
  keyball61: 256,
  keyballplus: 1280,
};
const KEYBALL_VID = 22871;

export const isMacOSPlatform = () => /Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X/i.test(navigator.userAgent);

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

interface KeyDisplaySectionProps {
  keyLayout: KeyLayout;
  onKeyLayoutChange: (layout: KeyLayout) => void;
}

export function KeyDisplaySection({ keyLayout, onKeyLayoutChange }: KeyDisplaySectionProps) {
  return (
    <div>
      <p className="settings-desc">
        キーマップ画面のキーに表示される文字を切り替えます。<br />
        実際にキーボードから入力される文字は変わりません。入力文字を変えるには「macOS キーボードタイプ設定」をご利用ください。
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
    </div>
  );
}

interface MacOSSetupSectionProps {
  defaultLayout: KeyLayout;
  model: ModelKey | null;
  productId: number | null;
}

export function MacOSSetupSection({ defaultLayout, model, productId }: MacOSSetupSectionProps) {
  const [layout, setLayout] = useState<KeyLayout>(defaultLayout);
  const [copied, setCopied] = useState(false);

  // 接続中デバイスの実際のPIDを優先する。同じ機種名でも版（AVR/RP2040等）でPIDが
  // 異なることがあり、machineごとの固定表（MODEL_PIDS）だけでは接続中の実機と
  // 一致しない場合があるため。取得できないとき(未接続時のプレビュー等)のみ表を使う。
  const pid = productId ?? (model ? MODEL_PIDS[model] : null);
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
            <span>コマンド実行後、キーボードを一度抜き差しする</span>
          </div>

          <p className="macos-setup-note">
            ※ 一度設定すれば次回以降は不要です。JIS/USを切り替えたい場合は配列を選び直してコマンドを再実行してください。<br />
            ※ このMacで初めて接続する機種・ファームウェアの場合、抜き差しだけでは反映されないことがあります。その場合はMacを再起動してから確認してください。
          </p>
        </>
      )}
    </div>
  );
}
