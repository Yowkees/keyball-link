import { translate } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useState, useRef, useEffect } from 'react';
import { AVR109, isWebSerialSupported } from '../../lib/avr109';
import { isFileSystemAccessSupported, flashUf2 } from '../../lib/uf2flash';
import { parseIntelHex } from '../../lib/ihex';
import { fetchFlashCounts, flashCountKey, reportFlash } from '../../lib/flashCount';
import { chipForProductId } from '../../lib/deviceIds';
import type { Chip } from '../../lib/deviceIds';
import type { ModelKey } from '../../layouts';
import { SettingsSidebarBoard, type BoardCard } from '../SettingsBoard/SettingsBoard';
import { TIPS } from '../../lib/tips';

// 2026-09-18、Keyball+のAVR版LEDがフラッシュ容量超過のため一時非公開にしていたが、
// 2026-09-25、原因（診断用コードの残存）を解消しビルド対象に復帰させたため再度公開。
// ファームウェアは public/firmware/v2/ に置く（2026-10-22、左右判定の根本修正と同時）。
// 修正前のKeyball Linkの画面を開いたままの人が、修正後のファームを書き込んで表示と実際のキーが
// 左右逆になるのを防ぐため、修正前の画面が読む public/firmware/ 直下の古いファイルは修正前の版の
// まま残している（触らないこと）。scripts/build-firmware.shもv2/へ出力する。
const BUILTIN_FIRMWARE_AVR: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/v2/keyball_keyball39_web_configurator.hex',
  keyball44: '/firmware/v2/keyball_keyball44_web_configurator.hex',
  keyball61: '/firmware/v2/keyball_keyball61_web_configurator.hex',
  keyballplus: '/firmware/v2/keyball_keyballplus_web_configurator.hex',
};
// LED版（AVR各機種）。LED有効・メディアキー有効・マクロ/ジェスチャー等を削減した構成
const BUILTIN_FIRMWARE_AVR_LED: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/v2/keyball_keyball39_web_configurator_led.hex',
  keyball44: '/firmware/v2/keyball_keyball44_web_configurator_led.hex',
  keyball61: '/firmware/v2/keyball_keyball61_web_configurator_led.hex',
  keyballplus: '/firmware/v2/keyball_keyballplus_web_configurator_led.hex',
};
// RP2040版。移植済みの機種のみ（LED版の分岐は無い＝1機種1ビルド）
const BUILTIN_FIRMWARE_RP2040: Partial<Record<ModelKey, string>> = {
  keyball39: '/firmware/v2/keyball_keyball39_web_configurator.uf2',
  keyballplus: '/firmware/v2/keyball_keyballplus_web_configurator.uf2',
  keyball44: '/firmware/v2/keyball_keyball44_web_configurator.uf2',  // 2026-10-02〜。LED配線は実機確認済み（左右ボールとも）
  keyball61: '/firmware/v2/keyball_keyball61_web_configurator.uf2',  // 2026-10-02〜。LED配線は実機確認済み（左右ボールとも）
};
// RP2040版をWeb UI上に表示するかどうか。2026-09-25〜はfalse（非公開）で、
// 開発（rp2040ブランチ）だけtrueにして実機確認していた。
// 2026-10-09: 全機種（39/44/61/+、左右ボール）の実機確認が済んだため本番でも公開（本人指示）。
const RP2040_PUBLIC_RELEASE = true;

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
  const [flashCounts, setFlashCounts] = useState<Record<string, number> | null>(null);

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
        if (!path) throw new Error(translate(TextKey.FirmwareFlasherRPFirmwareIsNotYetAvailable));
        const res = await fetch(path);
        if (!res.ok) throw new Error(translate(TextKey.FirmwareFlasherCouldNotDownloadFirmware, { p0: res.status }));
        return new Uint8Array(await res.arrayBuffer());
      }
      const ledPath = BUILTIN_FIRMWARE_AVR_LED[selectedModel];
      const path = ledVersion && ledPath ? ledPath : BUILTIN_FIRMWARE_AVR[selectedModel];
      if (!path) throw new Error(translate(TextKey.FirmwareFlasherAVRFirmwareIsNotDistributedFor));
      const res = await fetch(path);
      if (!res.ok) throw new Error(translate(TextKey.FirmwareFlasherCouldNotDownloadFirmware, { p0: res.status }));
      return parseIntelHex(await res.text());
    }
    if (!customFile) throw new Error(translate(TextKey.FirmwareFlasherNoFileSelected));
    // RP2040の.uf2はビルド済みバイナリなのでそのまま読む。AVRの.hexはIntel HEX形式
    return chip === 'rp2040' ? new Uint8Array(await customFile.arrayBuffer()) : parseIntelHex(await customFile.text());
  };

  const handleFlash = async () => {
    setProgress(0);
    setMessage('');

    try {
      setMessage(translate(TextKey.FirmwareFlasherLoadingFirmware));
      firmwareRef.current = await loadFirmware();

      if (isHIDConnected) {
        setMessage(translate(TextKey.FirmwareFlasherSwitchingToBootloaderMode));
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
      setMessage(translate(TextKey.FirmwareFlasherCannotFlashThisBrowserDoesNot));
      return;
    }
    setPhase('port');
    setMessage(translate(TextKey.FirmwareFlasherSelectTheSerialPortProMicroV));

    let port: SerialPort;
    try {
      port = await navigator.serial.requestPort();
    } catch {
      setPhase('idle');
      setMessage(translate(TextKey.FirmwareFlasherPortSelectionCancelled));
      return;
    }

    setPhase('flashing');
    const flasher = new AVR109(port);
    try {
      setMessage(translate(TextKey.FirmwareFlasherConnectingToPort));
      await flasher.open();
      await flasher.flash(firmwareRef.current!, (pct, msg) => {
        setProgress(pct);
        setMessage(msg);
      });
      setPhase('done');
      setMessage(translate(TextKey.FirmwareFlasherFlashCompleteTheKeyboardWillRestart));
      if (source === 'builtin') {
        const key = flashCountKey(selectedModel, ledVersion && !!BUILTIN_FIRMWARE_AVR_LED[selectedModel]);
        reportFlash(key)
          .then(() => setFlashCounts(prev => ({ ...prev, [key]: (prev?.[key] ?? 0) + 1 })))
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
      setMessage(translate(TextKey.FirmwareFlasherCannotFlashThisBrowserDoesNot2));
      return;
    }
    setPhase('port');
    setMessage(translate(TextKey.FirmwareFlasherSelectTheDriveNamedRPIRP));

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await window.showDirectoryPicker!({ id: 'keyball-rp2040-uf2' });
    } catch {
      setPhase('idle');
      setMessage(translate(TextKey.FirmwareFlasherFolderSelectionCancelled));
      return;
    }

    setPhase('flashing');
    try {
      await flashUf2(dirHandle, firmwareRef.current!, (pct, msg) => {
        setProgress(pct);
        setMessage(msg);
      });
      setPhase('done');
      setMessage(translate(TextKey.FirmwareFlasherFlashCompleteTheKeyboardWillRestart));
      if (source === 'builtin') {
        const key = flashCountKey(selectedModel, false, 'rp2040');
        reportFlash(key)
          .then(() => setFlashCounts(prev => ({ ...prev, [key]: (prev?.[key] ?? 0) + 1 })))
          .catch(() => {
            // 統計送信の失敗は書き込み成功の表示には影響させない
          });
      }
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const isWorking = phase === 'port' || phase === 'flashing';
  // 「もう一度書き込む」ボタンを廃止したため、書き込み完了後(done)・失敗後(error)も
  // 同じ「書き込む」ボタンでそのまま再度書き込めるようにする（進行中(isWorking)の
  // 間だけ押せなくする）。
  const canFlash = supported && !isWorking &&
    (source === 'builtin' || customFile !== null);

  // 2026-10-06〜: 他の設定タブと同じく、左に項目のタブ・右に選んだ項目を表示する。
  // 書き込みの手順（①選択→②書き込む）は1つのパネルにまとめ、注意書きは別の項目に分けた。
  const cards: BoardCard[] = [
    {
      key: 'flash', get title() { return translate(TextKey.FirmwareFlasherFlashFirmware); }, tip: TIPS.fwFlash,
      render: () => (
        <div className="fw-panel">
      {!supported && (
        <div className="flash-alert flash-alert--warn">
          {chip === 'rp2040'
            ? translate(TextKey.FirmwareFlasherThisBrowserDoesNotSupportThe)
            : translate(TextKey.FirmwareFlasherThisBrowserDoesNotSupportWeb)}
        </div>
      )}

          <div className="fw-step">
            <p className="fw-step__title"><span className="flash-step-num">1</span>{translate(TextKey.FirmwareFlasherSelectFirmware)}</p>
          {/* 2026-10-06〜: 上から「モデル」→「AVR版/RP2040版」→「ビルド済み/ファイル」の順に選ぶ */}
          <p className="fw-field-label">{translate(TextKey.FirmwareFlasherModel)}</p>
            <div className="model-selector">
              {/* 書き込み回数は機種の合計ではなく、ファームの種類ごと（AVR版・LED版・RP2040版）に下のボタンに出す（2026-10-27、本人希望） */}
              {(Object.keys(MODEL_LABELS) as ModelKey[]).map(model => (
                <button key={model}
                  className={`btn btn--layer ${selectedModel === model ? 'btn--layer-active' : ''}`}
                  onClick={() => setSelectedModel(model)} disabled={isWorking}>
                  {MODEL_LABELS[model]}
                </button>
              ))}
              {detectedModel && (
                <span className="detected-model">
                  {detectedModel === selectedModel ? translate(TextKey.FirmwareFlasherMatchesConnectedKeyboard) : translate(TextKey.FirmwareFlasherConnected, { p0: MODEL_LABELS[detectedModel] })}
                </span>
              )}
            </div>

          <p className="fw-field-label">{translate(TextKey.FirmwareFlasherMicrocontroller)}</p>
          <div className="fw-source-tabs">
            <button className={`fw-source-tab ${chip === 'avr' ? 'fw-source-tab--active' : ''}`}
              onClick={() => setChip('avr')} disabled={isWorking || (source === 'builtin' && !BUILTIN_FIRMWARE_AVR[selectedModel])}
              title={source === 'builtin' && !BUILTIN_FIRMWARE_AVR[selectedModel] ? translate(TextKey.FirmwareFlasherOnlyRPFirmwareIsAvailableFor) : undefined}>{translate(TextKey.FirmwareFlasherAVRProMicroEtc)}{/* 通常版・LED版に分かれている機種は、下のバージョンのボタンにそれぞれの回数を出す */}
              {BUILTIN_FIRMWARE_AVR[selectedModel] && !BUILTIN_FIRMWARE_AVR_LED[selectedModel] && (
                <span className="fw-flash-count" title={flashCounts === null ? translate(TextKey.CountUnavailable) : undefined}>{translate(TextKey.FirmwareFlasherFlashCount)}{flashCounts?.[flashCountKey(selectedModel, false)] ?? '—'})</span>
              )}
            </button>
            {RP2040_PUBLIC_RELEASE && (
              <button className={`fw-source-tab ${chip === 'rp2040' ? 'fw-source-tab--active' : ''}`}
                onClick={() => setChip('rp2040')} disabled={isWorking || (source === 'builtin' && !BUILTIN_FIRMWARE_RP2040[selectedModel])}
                title={source === 'builtin' && !BUILTIN_FIRMWARE_RP2040[selectedModel] ? translate(TextKey.FirmwareFlasherRPIsNotYetAvailableFor) : undefined}>{translate(TextKey.FirmwareFlasherRPRPProMicro)}{BUILTIN_FIRMWARE_RP2040[selectedModel] && (
                  <span className="fw-flash-count" title={flashCounts === null ? translate(TextKey.CountUnavailable) : undefined}>{translate(TextKey.FirmwareFlasherFlashCount)}{flashCounts?.[flashCountKey(selectedModel, false, 'rp2040')] ?? '—'})</span>
                )}
              </button>
            )}
          </div>

          <p className="fw-field-label">{translate(TextKey.Firmware)}</p>
          <div className="fw-source-tabs">
            <button className={`fw-source-tab ${source === 'builtin' ? 'fw-source-tab--active' : ''}`}
              onClick={() => setSource('builtin')} disabled={isWorking}>{translate(TextKey.FirmwareFlasherUseBundledFirmware)}</button>
            <button className={`fw-source-tab ${source === 'file' ? 'fw-source-tab--active' : ''}`}
              onClick={() => setSource('file')} disabled={isWorking}>
              {chip === 'rp2040' ? translate(TextKey.FirmwareFlasherChooseUfFile) : translate(TextKey.FirmwareFlasherChooseHexFile)}
            </button>
          </div>

          {source === 'builtin' && chip === 'avr' && BUILTIN_FIRMWARE_AVR_LED[selectedModel] && (
            <div className="version-selector" style={{ marginTop: 12 }}>
              <p className="flash-step-label" style={{ marginBottom: 6 }}>{translate(TextKey.FirmwareFlasherVersionTwoVariantsDueToMemory)}</p>
              <div className="fw-source-tabs">
                <button className={`fw-source-tab ${!ledVersion ? 'fw-source-tab--active' : ''}`}
                  onClick={() => setLedVersion(false)} disabled={isWorking}>{translate(TextKey.FirmwareFlasherStandardMediaKeysAndMacrosNo)}<span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>{translate(TextKey.FirmwareFlasherFlashCount)}{flashCounts?.[flashCountKey(selectedModel, false)] ?? '—'})
                  </span>
                </button>
                <button className={`fw-source-tab ${ledVersion ? 'fw-source-tab--active' : ''}`}
                  onClick={() => setLedVersion(true)} disabled={isWorking}>{translate(TextKey.FirmwareFlasherLEDLEDsAndMediaKeysNo)}<span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>{translate(TextKey.FirmwareFlasherFlashCount)}{flashCounts?.[flashCountKey(selectedModel, true)] ?? '—'})
                  </span>
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.6 }}>
                {ledVersion
                  ? translate(TextKey.FirmwareFlasherIncludesLEDsMediaKeysAndPer)
                  : translate(TextKey.FirmwareFlasherIncludesMediaKeysMacrosGesturesAnd)}
              </p>
              {ledVersion && (
                <div className="flash-alert flash-alert--warn" style={{ marginTop: 10 }}>
                  ⚠ <strong>{translate(TextKey.FirmwareFlasherForExistingLEDFirmwareUsersWith)}</strong><br />{translate(TextKey.FirmwareFlasherSinceVLEDFirmwareSupportsMedia)}<br />{translate(TextKey.FirmwareFlasherAfterFlashingExistingMacrosCannotBe)}<br />{translate(TextKey.FirmwareFlasherKeepASeparateCopyOfAnything)}</div>
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
          <div className="fw-step">
            <p className="fw-step__title"><span className="flash-step-num">2</span>{translate(TextKey.FirmwareFlasherFlash)}</p>
          {chip === 'avr' ? (
            isHIDConnected ? (
              <p className="flash-step-label">{translate(TextKey.FirmwareFlasherClickFlashToSwitchToBootloader)}</p>
            ) : (
              <div className="flash-alert flash-alert--info" style={{ marginTop: 0 }}>{translate(TextKey.FirmwareFlasherClickFlashToOpenThePort)}<br />
                {'　　'}<strong>{translate(TextKey.FirmwareFlasherWithTheDialogOpen)}</strong>{translate(TextKey.FirmwareFlasherQuicklyPressTheResetButtonTwice)}<br />
                {'　　'}{translate(TextKey.FirmwareFlasherWhenProMicroVAppearsSelectIt)}</div>
            )
          ) : (
            isHIDConnected ? (
              <p className="flash-step-label">{translate(TextKey.FirmwareFlasherClickFlashToEnterBootloaderMode)}</p>
            ) : (
              <div className="flash-alert flash-alert--info" style={{ marginTop: 0 }}>{translate(TextKey.FirmwareFlasherClickFlashToOpenTheFolder)}<br />
                {'　　'}<strong>{translate(TextKey.FirmwareFlasherIfKeyballLinkFirmwareIsAlready)}</strong>{translate(TextKey.FirmwareFlasherQuicklyPressResetTwiceToEnter)}<br />
                {'　　'}<strong>{translate(TextKey.FirmwareFlasherForTheFirstFlashOrFactory)}</strong>{translate(TextKey.FirmwareFlasherHoldBOOTSELWhileReconnectingTheUSB)}<br />
                {'　　'}{translate(TextKey.FirmwareFlasherSelectTheRPIRPDriveWhen)}</div>
            )
          )}

          <button className="btn btn--primary" onClick={handleFlash} disabled={!canFlash}>{translate(TextKey.FirmwareFlasherFlash)}</button>

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
          </div>
        </div>
      ),
    },
    ...(supported && !isHIDConnected ? [{
      key: 'trouble', get title() { return translate(TextKey.FirmwareFlasherTroubleshooting); }, tip: TIPS.fwTrouble,
      render: () => (
        <p className="fw-note">{translate(TextKey.FirmwareFlasherBrowserFlashingMayFailDependingOn)}<br />{translate(TextKey.FirmwareFlasherIfFlashingFailsUse)}<strong>QMK Toolbox</strong>{translate(TextKey.FirmwareFlasherForTheInitialFlash)}<br />{translate(TextKey.FirmwareFlasherAfterTheInitialFlashConnectKeyboard)}</p>
      ),
    }] : []),
    {
      key: 'both', get title() { return translate(TextKey.FirmwareFlasherFlashBothHalves); }, tip: TIPS.fwBothHalves,
      render: () => (
        <p className="fw-note">{translate(TextKey.FirmwareFlasherEachHalfHasItsOwnMicrocontroller)}<strong>{translate(TextKey.FirmwareFlasherFlashTheSameFirmwareToBoth)}</strong>。<br />{translate(TextKey.FirmwareFlasherUpdatingOnlyOneHalfMayCause)}</p>
      ),
    },
    {
      key: 'switch', get title() { return translate(TextKey.FirmwareFlasherSwitchingFromOfficialFirmware); }, tip: TIPS.fwSwitch,
      render: () => (
        <p className="fw-note">{translate(TextKey.FirmwareFlasherYourCurrentKeySettingsWillNot)}<br />
          <strong>Remap</strong>{translate(TextKey.FirmwareFlasherOrASimilarToolToBack)}</p>
      ),
    },
    {
      key: 'revert', get title() { return translate(TextKey.FirmwareFlasherSwitchingToAnotherFirmware); }, tip: TIPS.fwRevert,
      render: () => (
        <p className="fw-note">{translate(TextKey.FirmwareFlasherBeforeReplacingKeyballLinkWithOfficial)}<strong>{translate(TextKey.FirmwareFlasherChooseResetResetAllSettingsAt)}</strong>{translate(TextKey.FirmwareFlasherFlashTheOtherFirmwareRestoringThe)}<br /><br />{translate(TextKey.FirmwareFlasherOtherwiseKeyballLinkSettingsRemainIn)}</p>
      ),
    },
  ];

  return (
    <div className="settings-tab" data-guide="firmware-panel">
      <SettingsSidebarBoard cards={cards} />
    </div>
  );
}
