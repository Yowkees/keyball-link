import { useState, useRef, useEffect } from 'react';
import { AVR109, isWebSerialSupported } from '../../lib/avr109';
import { isFileSystemAccessSupported, flashUf2 } from '../../lib/uf2flash';
import { parseIntelHex } from '../../lib/ihex';
import { fetchFlashCounts, flashCountKey, reportFlash } from '../../lib/flashCount';
import { chipForProductId } from '../../lib/deviceIds';
import type { Chip } from '../../lib/deviceIds';
import type { ModelKey } from '../../layouts';

// 2026-09-18、Keyball+のAVR版LEDがフラッシュ容量超過のため一時非公開にしていたが、
// 2026-09-25、原因（診断用コードの残存）を解消しビルド対象に復帰させたため再度公開。
const BUILTIN_FIRMWARE_AVR: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/keyball_keyball39_web_configurator.hex',
  keyball44: '/firmware/keyball_keyball44_web_configurator.hex',
  keyball61: '/firmware/keyball_keyball61_web_configurator.hex',
  keyballplus: '/firmware/keyball_keyballplus_web_configurator.hex',
};
// LED版（AVR各機種）。LED有効・メディアキー有効・マクロ/ジェスチャー等を削減した構成
const BUILTIN_FIRMWARE_AVR_LED: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/keyball_keyball39_web_configurator_led.hex',
  keyball44: '/firmware/keyball_keyball44_web_configurator_led.hex',
  keyball61: '/firmware/keyball_keyball61_web_configurator_led.hex',
  keyballplus: '/firmware/keyball_keyballplus_web_configurator_led.hex',
};
// RP2040版。移植済みの機種のみ（LED版の分岐は無い＝1機種1ビルド）
const BUILTIN_FIRMWARE_RP2040: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/keyball_keyball39_web_configurator.uf2',
  keyballplus: '/firmware/keyball_keyballplus_web_configurator.uf2',
};
// 2026-09-25: RP2040版はまだ一般公開しない方針（本人指示）。ビルド自体は
// build-firmware.shで継続しているが、Web UI上はこのフラグで丸ごと非表示にする。
// 公開時はtrueに変更する。
const RP2040_PUBLIC_RELEASE = false;

const MODEL_LABELS: Record<ModelKey, string> = {
  keyball39: 'Keyball39',
  keyball44: 'Keyball44',
  keyball61: 'Keyball61',
  keyballplus: 'Keyball+',
};

type FirmwareSource = 'builtin' | 'file';
type Phase = 'idle' | 'port' | 'flashing' | 'done' | 'error';

interface FirmwareFlasherProps {
  detectedModel: ModelKey | null;
  productId: number | null;
  isHIDConnected: boolean;
  onReboot: () => Promise<void>;
}

export function FirmwareFlasher({ detectedModel, productId, isHIDConnected, onReboot }: FirmwareFlasherProps) {
  const [source, setSource] = useState<FirmwareSource>('builtin');
  const [selectedModel, setSelectedModel] = useState<ModelKey>(detectedModel ?? 'keyball39');
  const [chip, setChip] = useState<Chip>('avr');
  const [ledVersion, setLedVersion] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firmwareRef = useRef<Uint8Array | null>(null);
  const [flashCounts, setFlashCounts] = useState<Record<string, number>>({});

  // 接続中デバイスのproductIdからチップ種別を自動判定する（同じ機種名でも
  // AVR/RP2040でPIDが異なる。KEYBALL_MODEL値だけでは区別できない機種があるため）。
  // RP2040版が非公開の間は、RP2040実機を繋いでもAVR側の表示のまま維持する。
  useEffect(() => {
    if (!RP2040_PUBLIC_RELEASE) return;
    if (productId != null) {
      const detected = chipForProductId(productId);
      if (detected) setChip(detected);
    }
  }, [productId]);

  // 選んだ機種にそのchip種別のビルド済みファームウェアが無い状態のままだと
  // 書き込み先が無くなってしまうため、無い方から有る方へ自動的に切り替える
  // （例: Keyball+はRP2040版のみのため、AVRを選んでいたらRP2040へ）。
  // RP2040版が非公開の間はこの自動切り替え自体を行わない。
  useEffect(() => {
    if (!RP2040_PUBLIC_RELEASE) return;
    if (source !== 'builtin') return;
    if (chip === 'rp2040' && !BUILTIN_FIRMWARE_RP2040[selectedModel] && BUILTIN_FIRMWARE_AVR[selectedModel]) {
      setChip('avr');
    } else if (chip === 'avr' && !BUILTIN_FIRMWARE_AVR[selectedModel] && BUILTIN_FIRMWARE_RP2040[selectedModel]) {
      setChip('rp2040');
    }
  }, [chip, selectedModel, source]);

  const supported = chip === 'rp2040' ? isFileSystemAccessSupported() : isWebSerialSupported();

  useEffect(() => {
    fetchFlashCounts().then(setFlashCounts).catch(() => {
      // 表示できなくても書き込み機能自体には影響しないので無視する
    });
  }, []);

  const loadFirmware = async (): Promise<Uint8Array> => {
    if (source === 'builtin') {
      if (chip === 'rp2040') {
        const path = BUILTIN_FIRMWARE_RP2040[selectedModel];
        if (!path) throw new Error('この機種のRP2040版ファームウェアはまだありません');
        const res = await fetch(path);
        if (!res.ok) throw new Error(`ファームウェア取得失敗: ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      }
      const ledPath = BUILTIN_FIRMWARE_AVR_LED[selectedModel];
      const path = ledVersion && ledPath ? ledPath : BUILTIN_FIRMWARE_AVR[selectedModel];
      if (!path) throw new Error('この機種のAVR版ファームウェアは配布していません');
      const res = await fetch(path);
      if (!res.ok) throw new Error(`ファームウェア取得失敗: ${res.status}`);
      return parseIntelHex(await res.text());
    }
    if (!customFile) throw new Error('ファイルが選択されていません');
    // RP2040の.uf2はビルド済みバイナリなのでそのまま読む。AVRの.hexはIntel HEX形式
    return chip === 'rp2040' ? new Uint8Array(await customFile.arrayBuffer()) : parseIntelHex(await customFile.text());
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
        // ブートローダーが起動するまで待つ。RP2040はUSBメモリとして再認識され
        // OS側のマウント処理が入る分、AVRのシリアルポート再認識より時間がかかるため
        // 長めに待つ（それでも間に合わない場合は本人が手動でリセットボタンを
        // 素早く2回押す/BOOTSELボタンを押しながら挿し直すことでも対処可能）。
        await new Promise(r => setTimeout(r, chip === 'rp2040' ? 3500 : 1500));
      }

      if (chip === 'rp2040') {
        await pickDirectoryAndFlash();
      } else {
        await openPortAndFlash();
      }
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
      if (source === 'builtin') {
        const key = flashCountKey(selectedModel, ledVersion && !!BUILTIN_FIRMWARE_AVR_LED[selectedModel]);
        reportFlash(key)
          .then(() => setFlashCounts(prev => ({ ...prev, [key]: (prev[key] ?? 0) + 1 })))
          .catch(() => {
            // 統計送信の失敗は書き込み成功の表示には影響させない
          });
      }
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      await flasher.close();
    }
  };

  const pickDirectoryAndFlash = async () => {
    if (!isFileSystemAccessSupported()) {
      setPhase('error');
      setMessage('このブラウザはFile System Access API非対応のため書き込みできません。Chrome または Edge をご利用ください。');
      return;
    }
    setPhase('port');
    setMessage('「RPI-RP2」という名前のドライブを選択してください');

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await window.showDirectoryPicker!({ id: 'keyball-rp2040-uf2' });
    } catch {
      setPhase('idle');
      setMessage('フォルダ選択がキャンセルされました。');
      return;
    }

    setPhase('flashing');
    try {
      await flashUf2(dirHandle, firmwareRef.current!, (pct, msg) => {
        setProgress(pct);
        setMessage(msg);
      });
      setPhase('done');
      setMessage('書き込み完了！　キーボードが再起動します。');
      if (source === 'builtin') {
        const key = flashCountKey(selectedModel, false, 'rp2040');
        reportFlash(key)
          .then(() => setFlashCounts(prev => ({ ...prev, [key]: (prev[key] ?? 0) + 1 })))
          .catch(() => {
            // 統計送信の失敗は書き込み成功の表示には影響させない
          });
      }
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  // 「もう一度書き込む」用。選択中のファイル/機種はそのまま残し、
  // 同じ内容ですぐ再書き込みできるようにする（毎回選び直させない）。
  const reset = () => {
    setPhase('idle');
    setProgress(0);
    setMessage('');
  };

  const canFlash = supported && phase === 'idle' &&
    (source === 'builtin' || customFile !== null);
  const isWorking = phase === 'port' || phase === 'flashing';

  return (
    <div className="firmware-flasher">
      <h3 className="settings-title">ファームウェア書き込み</h3>

      {!supported && (
        <div className="flash-alert flash-alert--warn">
          {chip === 'rp2040'
            ? 'File System Access API 非対応のブラウザです。Chrome または Edge をお使いください。'
            : 'WebSerial API 非対応のブラウザです。Chrome または Edge をお使いください。'}
        </div>
      )}

      {supported && !isHIDConnected && (
        <details className="flash-alert flash-alert--warn flash-alert--collapsible">
          <summary>書き込みがうまくいかない場合（QMK Toolboxの利用）</summary>
          <p>
            ブラウザからの書き込みは環境によって失敗することがあります。<br />
            うまくいかない場合は <strong>QMK Toolbox</strong> で初回書き込みを行ってください。<br />
            初回書き込み後は「キーボードに接続」→「書き込む」で自動的にブートローダーに切り替わります。
          </p>
        </details>
      )}

      <details className="flash-alert flash-alert--warn flash-alert--collapsible">
        <summary>公式ファームウェアからの乗り換えの方へ（書き込み前にお読みください）</summary>
        <p>
          書き込むと今のキー設定は引き継がれません。<br />
          <strong>Remap</strong> などで現在のキーマップを保存（バックアップ）してから書き込んでください。
        </p>
      </details>

      <details className="flash-alert flash-alert--warn flash-alert--collapsible">
        <summary>正規ファームウェアなど他のファームウェアに戻す方へ（書き込み前にお読みください）</summary>
        <p>
          Keyball Linkから正規ファームウェアなど別のファームウェアに書き戻す場合は、
          <strong>先に画面上部の「初期化」▾ から「すべての設定を初期化する」を選んでKeyball Link独自の設定を消してから</strong>
          書き込んでください（「キーマップをRemap版の初期設定にする」ではKeyball Link独自の設定は消えないのでご注意ください）。<br />
          設定を消さずに書き込むと、Keyball Link独自の設定がEEPROMに残ったまま新しいファームウェアが動き出し、
          レイヤーが正しく切り替わらないなど意図しない動作の原因になることがあります。
        </p>
      </details>

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
              {chip === 'rp2040' ? '.uf2 ファイルを選択' : '.hex ファイルを選択'}
            </button>
          </div>

          <div className="fw-source-tabs" style={{ marginTop: 10 }}>
            <button className={`fw-source-tab ${chip === 'avr' ? 'fw-source-tab--active' : ''}`}
              onClick={() => setChip('avr')} disabled={isWorking || (source === 'builtin' && !BUILTIN_FIRMWARE_AVR[selectedModel])}
              title={source === 'builtin' && !BUILTIN_FIRMWARE_AVR[selectedModel] ? 'この機種はRP2040版のみ配布しています' : undefined}>
              AVR版（Pro Micro等）
            </button>
            {RP2040_PUBLIC_RELEASE && (
              <button className={`fw-source-tab ${chip === 'rp2040' ? 'fw-source-tab--active' : ''}`}
                onClick={() => setChip('rp2040')} disabled={isWorking || (source === 'builtin' && !BUILTIN_FIRMWARE_RP2040[selectedModel])}
                title={source === 'builtin' && !BUILTIN_FIRMWARE_RP2040[selectedModel] ? 'この機種のRP2040版はまだありません' : undefined}>
                RP2040版（RP2040 ProMicro）
              </button>
            )}
          </div>

          {source === 'builtin' && (
            <div className="model-selector" style={{ marginTop: 12 }}>
              {(Object.keys(MODEL_LABELS) as ModelKey[]).map(model => {
                const total = (BUILTIN_FIRMWARE_AVR[model] ? (flashCounts[flashCountKey(model, false)] ?? 0) : 0) +
                  (BUILTIN_FIRMWARE_AVR_LED[model] ? (flashCounts[flashCountKey(model, true)] ?? 0) : 0) +
                  (BUILTIN_FIRMWARE_RP2040[model] ? (flashCounts[flashCountKey(model, false, 'rp2040')] ?? 0) : 0);
                return (
                  <button key={model}
                    className={`btn btn--layer ${selectedModel === model ? 'btn--layer-active' : ''}`}
                    onClick={() => setSelectedModel(model)} disabled={isWorking}>
                    {MODEL_LABELS[model]}
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>
                      (書き込み回数: {total})
                    </span>
                  </button>
                );
              })}
              {detectedModel && (
                <span className="detected-model">
                  {detectedModel === selectedModel ? '✓ 接続中と一致' : `⚠ 接続中: ${MODEL_LABELS[detectedModel]}`}
                </span>
              )}
            </div>
          )}

          {source === 'builtin' && chip === 'avr' && BUILTIN_FIRMWARE_AVR_LED[selectedModel] && (
            <div className="version-selector" style={{ marginTop: 12 }}>
              <p className="flash-step-label" style={{ marginBottom: 6 }}>
                バージョン（この機種は容量の都合で2種類あります）
              </p>
              <div className="fw-source-tabs">
                <button className={`fw-source-tab ${!ledVersion ? 'fw-source-tab--active' : ''}`}
                  onClick={() => setLedVersion(false)} disabled={isWorking}>
                  通常版（音量キーあり・マクロあり・LEDなし）
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>
                    (書き込み回数: {flashCounts[flashCountKey(selectedModel, false)] ?? 0})
                  </span>
                </button>
                <button className={`fw-source-tab ${ledVersion ? 'fw-source-tab--active' : ''}`}
                  onClick={() => setLedVersion(true)} disabled={isWorking}>
                  LED版（LEDあり・音量キーあり・マクロなし）
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>
                    (書き込み回数: {flashCounts[flashCountKey(selectedModel, true)] ?? 0})
                  </span>
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.6 }}>
                {ledVersion
                  ? 'LEDが光ります。音量などのメディアキー・キーごとのタップ判定調整も使えます。かわりにマクロ・ジェスチャー・トラックボール加速は使えません。'
                  : '音量などのメディアキー・マクロ・ジェスチャー・キーごとの詳細設定が使えます。LEDは光りません。'}
              </p>
              {ledVersion && (
                <div className="flash-alert flash-alert--warn" style={{ marginTop: 10 }}>
                  ⚠ <strong>以前からLED版をお使いで、マクロを設定していた方へ</strong><br />
                  v1.1.0からLED版はマクロが使えなくなり、かわりに音量などのメディアキーが使えるようになりました。<br />
                  書き込むと、これまで設定していたマクロの内容は確認・編集できなくなります（取り出す機能はありません）。<br />
                  必要な内容は、書き込む前に控えておいてください。
                </div>
              )}
            </div>
          )}

          {source === 'file' && (
            <>
              <input ref={fileInputRef} type="file" accept={chip === 'rp2040' ? '.uf2' : '.hex'} className="file-input"
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
          {chip === 'avr' ? (
            isHIDConnected ? (
              <p className="flash-step-label">「書き込む」を押すと自動でブートローダーモードに切り替わります。</p>
            ) : (
              <div className="flash-alert flash-alert--info" style={{ marginTop: 0 }}>
                💡 「書き込む」を押すとポート選択ダイアログが開きます。<br />
                {'　　'}<strong>ダイアログが開いた状態で</strong>リセットボタンを素早く2回押してください。<br />
                {'　　'}「ProMicro 5V」がリストに現れたら選択すると書き込み開始です。
              </div>
            )
          ) : (
            isHIDConnected ? (
              <p className="flash-step-label">「書き込む」を押すと自動でブートローダーモードに切り替わり、フォルダ選択ダイアログが開きます。</p>
            ) : (
              <div className="flash-alert flash-alert--info" style={{ marginTop: 0 }}>
                💡 「書き込む」を押すとフォルダ選択ダイアログが開きます。<br />
                {'　　'}<strong>すでにKeyball Linkのファームウェアが入っている場合</strong>：リセットボタンを素早く2回押すとブートローダーモードになります。<br />
                {'　　'}<strong>初めて書き込む・工場出荷状態の場合</strong>：BOOTSELボタンを押しながらUSBケーブルを挿し直してください。<br />
                {'　　'}「RPI-RP2」という名前のドライブがリストに現れたら選択すると書き込み開始です。
              </div>
            )
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
