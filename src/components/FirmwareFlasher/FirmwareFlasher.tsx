import { useState, useRef } from 'react';
import { AVR109, isWebSerialSupported } from '../../lib/avr109';
import { parseIntelHex } from '../../lib/ihex';
import type { ModelKey } from '../../layouts';

const BUILTIN_FIRMWARE: Record<ModelKey, string> = {
  keyball39: '/firmware/keyball_keyball39_web_configurator.hex',
  keyball44: '/firmware/keyball_keyball44_web_configurator.hex',
  keyball61: '/firmware/keyball_keyball61_web_configurator.hex',
};
// LED版（全機種）。LED有効・メディアキー無効・per-key/ジェスチャー削減の最小機能版
const BUILTIN_FIRMWARE_LED: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/keyball_keyball39_web_configurator_led.hex',
  keyball44: '/firmware/keyball_keyball44_web_configurator_led.hex',
  keyball61: '/firmware/keyball_keyball61_web_configurator_led.hex',
};
const MODEL_LABELS: Record<ModelKey, string> = {
  keyball39: 'Keyball39',
  keyball44: 'Keyball44',
  keyball61: 'Keyball61',
};

type FirmwareSource = 'builtin' | 'file';
type Phase = 'idle' | 'port' | 'flashing' | 'done' | 'error';

interface FirmwareFlasherProps {
  detectedModel: ModelKey | null;
  isHIDConnected: boolean;
  onReboot: () => Promise<void>;
}

export function FirmwareFlasher({ detectedModel, isHIDConnected, onReboot }: FirmwareFlasherProps) {
  const [source, setSource] = useState<FirmwareSource>('builtin');
  const [selectedModel, setSelectedModel] = useState<ModelKey>(detectedModel ?? 'keyball39');
  const [ledVersion, setLedVersion] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareRef = useRef<Uint8Array | null>(null);

  const supported = isWebSerialSupported();

  const loadFirmware = async (): Promise<Uint8Array> => {
    if (source === 'builtin') {
      const ledPath = BUILTIN_FIRMWARE_LED[selectedModel];
      const path = ledVersion && ledPath ? ledPath : BUILTIN_FIRMWARE[selectedModel];
      const res = await fetch(path);
      if (!res.ok) throw new Error(`ファームウェア取得失敗: ${res.status}`);
      return parseIntelHex(await res.text());
    }
    if (!customFile) throw new Error('ファイルが選択されていません');
    return parseIntelHex(await customFile.text());
  };

  const handleFlash = async () => {
    setProgress(0);
    setMessage('');

    try {
      setMessage('ファームウェアを読み込んでいます…');
      firmwareRef.current = await loadFirmware();

      if (isHIDConnected) {
        setMessage('ブートローダーモードに切り替え中…');
        await onReboot();
        // ブートローダーが起動するまで1.5秒待つ
        await new Promise(r => setTimeout(r, 1500));
      }

      await openPortAndFlash();
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const openPortAndFlash = async () => {
    if (!('serial' in navigator)) {
      setPhase('error');
      setMessage('このブラウザはWeb Serial非対応のため書き込みできません。Chrome または Edge をご利用ください。');
      return;
    }
    setPhase('port');
    setMessage('シリアルポートを選択してください（「ProMicro 5V」を選ぶ）');

    let port: SerialPort;
    try {
      port = await navigator.serial.requestPort();
    } catch {
      setPhase('idle');
      setMessage('ポート選択がキャンセルされました。');
      return;
    }

    setPhase('flashing');
    const flasher = new AVR109(port);
    try {
      setMessage('ポートに接続中…');
      await flasher.open();
      await flasher.flash(firmwareRef.current!, (pct, msg) => {
        setProgress(pct);
        setMessage(msg);
      });
      setPhase('done');
      setMessage('書き込み完了！　キーボードが再起動します。');
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      await flasher.close();
    }
  };

  const reset = () => {
    setPhase('idle');
    setProgress(0);
    setMessage('');
    setCustomFile(null);
    firmwareRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canFlash = supported && phase === 'idle' &&
    (source === 'builtin' || customFile !== null);
  const isWorking = phase === 'port' || phase === 'flashing';

  return (
    <div className="firmware-flasher">
      <h3 className="settings-title">ファームウェア書き込み</h3>

      {!supported && (
        <div className="flash-alert flash-alert--warn">
          WebSerial API 非対応のブラウザです。Chrome または Edge をお使いください。
        </div>
      )}

      {supported && !isHIDConnected && (
        <div className="flash-alert flash-alert--warn">
          ⚠ ブラウザからの書き込みは環境によって失敗することがあります。<br />
          うまくいかない場合は <strong>QMK Toolbox</strong> で初回書き込みを行ってください。<br />
          初回書き込み後は「キーボードに接続」→「書き込む」で自動的にブートローダーに切り替わります。
        </div>
      )}

      {/* Step 1 */}
      <div className="flash-step">
        <span className="flash-step-num">1</span>
        <div className="flash-step-body">
          <p className="flash-step-label">ファームウェアを選択</p>
          <div className="fw-source-tabs">
            <button className={`fw-source-tab ${source === 'builtin' ? 'fw-source-tab--active' : ''}`}
              onClick={() => setSource('builtin')} disabled={isWorking}>
              ビルド済みを使用
            </button>
            <button className={`fw-source-tab ${source === 'file' ? 'fw-source-tab--active' : ''}`}
              onClick={() => setSource('file')} disabled={isWorking}>
              .hex ファイルを選択
            </button>
          </div>

          {source === 'builtin' && (
            <div className="model-selector">
              {(Object.keys(BUILTIN_FIRMWARE) as ModelKey[]).map(model => (
                <button key={model}
                  className={`btn btn--layer ${selectedModel === model ? 'btn--layer-active' : ''}`}
                  onClick={() => setSelectedModel(model)} disabled={isWorking}>
                  {MODEL_LABELS[model]}
                </button>
              ))}
              {detectedModel && (
                <span className="detected-model">
                  {detectedModel === selectedModel ? '✓ 接続中と一致' : `⚠ 接続中: ${MODEL_LABELS[detectedModel]}`}
                </span>
              )}
            </div>
          )}

          {source === 'builtin' && BUILTIN_FIRMWARE_LED[selectedModel] && (
            <div className="version-selector" style={{ marginTop: 12 }}>
              <p className="flash-step-label" style={{ marginBottom: 6 }}>
                バージョン（この機種は容量の都合で2種類あります）
              </p>
              <div className="fw-source-tabs">
                <button className={`fw-source-tab ${!ledVersion ? 'fw-source-tab--active' : ''}`}
                  onClick={() => setLedVersion(false)} disabled={isWorking}>
                  通常版（音量キーあり・LEDなし）
                </button>
                <button className={`fw-source-tab ${ledVersion ? 'fw-source-tab--active' : ''}`}
                  onClick={() => setLedVersion(true)} disabled={isWorking}>
                  LED版（LEDあり・音量キーなし）
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.6 }}>
                {ledVersion
                  ? 'LEDが光ります。音量キー・タッピング詳細設定・トラックボール加速は無効です。'
                  : '音量などのメディアキーが使えます。LEDは光りません。'}
              </p>
            </div>
          )}

          {source === 'file' && (
            <>
              <input ref={fileInputRef} type="file" accept=".hex" className="file-input"
                onChange={e => { setCustomFile(e.target.files?.[0] ?? null); setPhase('idle'); }}
                disabled={isWorking} />
              {customFile && <p className="flash-file-name">✓ {customFile.name}</p>}
            </>
          )}
        </div>
      </div>

      {/* Step 2 */}
      <div className="flash-step">
        <span className="flash-step-num">2</span>
        <div className="flash-step-body">
          {isHIDConnected ? (
            <p className="flash-step-label">「書き込む」を押すと自動でブートローダーモードに切り替わります。</p>
          ) : (
            <div className="flash-alert flash-alert--info" style={{ marginTop: 0 }}>
              💡 「書き込む」を押すとポート選択ダイアログが開きます。<br />
              　　<strong>ダイアログが開いた状態で</strong>リセットボタンを素早く2回押してください。<br />
              　　「ProMicro 5V」がリストに現れたら選択すると書き込み開始です。
            </div>
          )}

          <button className="btn btn--primary" onClick={handleFlash} disabled={!canFlash}>
            書き込む
          </button>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`flash-alert ${
          phase === 'error' ? 'flash-alert--error' :
          phase === 'done'  ? 'flash-alert--done'  : 'flash-alert--info'
        }`} style={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </div>
      )}

      {/* プログレスバー */}
      {phase === 'flashing' && progress > 0 && (
        <div className="flash-progress-wrap">
          <div className="flash-progress-bar" style={{ width: `${progress}%` }} />
          <span className="flash-progress-label">{progress}%</span>
        </div>
      )}

      {(phase === 'done' || phase === 'error') && (
        <button className="btn btn--ghost btn--small" onClick={reset} style={{ marginTop: 8 }}>
          もう一度書き込む
        </button>
      )}
    </div>
  );
}
