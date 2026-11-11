import { translate } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useState } from 'react';
import type { KeyLayout } from '../../lib/keycodes';
import type { ModelKey } from '../../layouts';
import { MODEL_PIDS, KEYBALL_VID } from '../../lib/deviceIds';

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
      <div className="layout-toggle-row">
        <button
          className={`layout-toggle-btn ${keyLayout === 'JIS' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => onKeyLayoutChange('JIS')}
        >{translate(TextKey.KeyLayoutCardsJISLayout)}<span className="layout-toggle-example">Shift+2 = "</span>
        </button>
        <button
          className={`layout-toggle-btn ${keyLayout === 'US' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => onKeyLayoutChange('US')}
        >{translate(TextKey.KeyLayoutCardsUSLayout)}<span className="layout-toggle-example">Shift+2 = @</span>
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
        <span className="macos-layout-label">{translate(TextKey.KeyLayoutCardsKeyboardLayout)}</span>
        <button
          className={`layout-toggle-btn macos-toggle-btn ${layout === 'JIS' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => setLayout('JIS')}
        >{translate(TextKey.KeyLayoutCardsJISLayout)}<span className="layout-toggle-example">{translate(TextKey.KeyLayoutCardsHasItsOwnKey)}</span>
        </button>
        <button
          className={`layout-toggle-btn macos-toggle-btn ${layout === 'US' ? 'layout-toggle-btn--active' : ''}`}
          onClick={() => setLayout('US')}
        >{translate(TextKey.KeyLayoutCardsUSLayout)}<span className="layout-toggle-example">{translate(TextKey.KeyLayoutCardsIsShift)}</span>
        </button>
      </div>

      {!model ? (
        <p className="settings-desc" style={{ marginTop: 8 }}>{translate(TextKey.KeyLayoutCardsConnectTheKeyboardToDisplayThe)}</p>
      ) : (
        <>
          <p className="settings-desc" style={{ marginTop: 4, marginBottom: 4 }}>{translate(TextKey.KeyLayoutCardsTargetModel)}<strong>{model}</strong>
          </p>

          <div className="macos-steps">
            <div className="macos-step">
              <span className="macos-step__num">①</span>
              <span>{translate(TextKey.KeyLayoutCardsOpenTerminalFinderApplicationsUtilitiesTerminal)}</span>
            </div>
            <div className="macos-step">
              <span className="macos-step__num">②</span>
              <span>{translate(TextKey.KeyLayoutCardsCopyAndPasteTheCommandBelow)}</span>
            </div>
          </div>

          <div className="macos-command-block">
            <code className="macos-command-text">{command}</code>
            <button
              className={`macos-copy-btn ${copied ? 'macos-copy-btn--done' : ''}`}
              onClick={handleCopy}
            >
              {copied ? translate(TextKey.KeyLayoutCardsCopied) : translate(TextKey.KeyLayoutCardsCopy)}
            </button>
          </div>

          <div className="macos-step" style={{ marginTop: 8 }}>
            <span className="macos-step__num">③</span>
            <span>{translate(TextKey.KeyLayoutCardsAfterRunningTheCommandDisconnectAnd)}</span>
          </div>

          <p className="macos-setup-note">{translate(TextKey.KeyLayoutCardsThisOnlyNeedsToBeDone)}<br />{translate(TextKey.KeyLayoutCardsForAModelOrFirmwareConnected)}</p>
        </>
      )}
    </div>
  );
}
