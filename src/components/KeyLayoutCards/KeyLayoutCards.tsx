import { useState } from 'react';
import type { KeyLayout } from '../../lib/keycodes';
import type { ModelKey } from '../../layouts';
import { MODEL_PIDS, KEYBALL_VID } from '../../lib/deviceIds';
import { t } from '../../lib/i18n';

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
    `echo "${t('完了。キーボードを一度抜き差ししてください。')}"`
  );
}

interface KeyDisplaySectionProps {
  keyLayout: KeyLayout;
  onKeyLayoutChange: (layout: KeyLayout) => void;
}

export function KeyDisplaySection({ keyLayout, onKeyLayoutChange }: KeyDisplaySectionProps) {
  return (
    <div>
      <div className="layout-toggle-row">
        <button
          className={`layout-toggle-btn ${keyLayout === 'JIS' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => onKeyLayoutChange('JIS')}
        >
          {t('JIS配列')}<span className="layout-toggle-example">Shift+2 = "</span>
        </button>
        <button
          className={`layout-toggle-btn ${keyLayout === 'US' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => onKeyLayoutChange('US')}
        >
          {t('US配列')}<span className="layout-toggle-example">Shift+2 = @</span>
        </button>
      </div>
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

      <div className="macos-layout-toggle">
        <span className="macos-layout-label">{t('使用する配列：')}</span>
        <button
          className={`layout-toggle-btn macos-toggle-btn ${layout === 'JIS' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => setLayout('JIS')}
        >
          {t('JIS配列')}
          <span className="layout-toggle-example">{t('@ は独立キー')}</span>
        </button>
        <button
          className={`layout-toggle-btn macos-toggle-btn ${layout === 'US' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => setLayout('US')}
        >
          {t('US配列')}
          <span className="layout-toggle-example">{t('@ は Shift+2')}</span>
        </button>
      </div>

      {!model ? (
        <p className="settings-desc" style={{ marginTop: 8 }}>
          {t('キーボードを接続すると、そのモデル専用のコマンドが表示されます。')}
        </p>
      ) : (
        <>
          <p className="settings-desc" style={{ marginTop: 4, marginBottom: 4 }}>
            {t('対象モデル:')} <strong>{model}</strong>
          </p>

          <div className="macos-steps">
            <div className="macos-step">
              <span className="macos-step__num">①</span>
              <span>{t('ターミナルを開く（Finder → アプリケーション → ユーティリティ → ターミナル）')}</span>
            </div>
            <div className="macos-step">
              <span className="macos-step__num">②</span>
              <span>{t('以下のコマンドをコピーして貼り付け、Enterを押す')}</span>
            </div>
          </div>

          <div className="macos-command-block">
            <code className="macos-command-text">{command}</code>
            <button
              className={`macos-copy-btn ${copied ? 'macos-copy-btn--done' : ''}`}
              onClick={handleCopy}
            >
              {copied ? t('✅ コピー済み') : t('📋 コピー')}
            </button>
          </div>

          <div className="macos-step" style={{ marginTop: 8 }}>
            <span className="macos-step__num">③</span>
            <span>{t('コマンド実行後、キーボードを一度抜き差しする')}</span>
          </div>

          <p className="macos-setup-note">
            {t('※ 一度設定すれば次回以降は不要です。JIS/USを切り替えたい場合は配列を選び直してコマンドを再実行してください。')}<br />
            {t('※ このMacで初めて接続する機種・ファームウェアの場合、抜き差しだけでは反映されないことがあります。その場合はMacを再起動してから確認してください。')}
          </p>
        </>
      )}
    </div>
  );
}
