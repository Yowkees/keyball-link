import { useState, useEffect, useRef } from 'react';
import { useKeyball } from './hooks/useKeyball';
import { LAYOUTS } from './layouts';
import { KeyboardLayout } from './components/KeyboardLayout/KeyboardLayout';
import { KeyConfigModal } from './components/KeyConfigModal/KeyConfigModal';
import { TrackballSettings } from './components/TrackballSettings/TrackballSettings';
import { LEDSettings } from './components/LEDSettings/LEDSettings';
import { FirmwareFlasher } from './components/FirmwareFlasher/FirmwareFlasher';
import { SettingsTab } from './components/SettingsTab/SettingsTab';
import { LedTestPanel } from './components/LedTestPanel/LedTestPanel';
import { MatrixTestPanel } from './components/MatrixTestPanel/MatrixTestPanel';
import { MacroEditor } from './components/MacroEditor/MacroEditor';
import { WelcomeGuide } from './components/WelcomeGuide/WelcomeGuide';
import { CollapsibleCard } from './components/Collapsible/CollapsibleCard';
import type { KbSettings, MacroSlot } from './lib/protocol';
import { MACRO_SLOT_COUNT, emptyMacroSlot } from './lib/protocol';
import { PRESETS } from './lib/presets';
import type { KeyLayout } from './lib/keycodes';
import './index.css';

type Tab = 'keymap' | 'macro' | 'settings' | 'firmware';
type BallSide = 'left' | 'right';
type Theme = 'dark' | 'light';

interface Toast {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const { state, connect, disconnect, setKeycode, setTrackball, setLed, setMacroSlot, setAllMacroSlots, setKbSettings, save, reboot, resetKeymap, setCurrentLayer, testLed, getMatrixState, loadPreset } = useKeyball();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('keymap');
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'dark'
  );
  const [ballSide, setBallSide] = useState<BallSide>(() =>
    (localStorage.getItem('ballSide') as BallSide) ?? 'right'
  );
  const [keyLayout, setKeyLayout] = useState<KeyLayout>(() =>
    (localStorage.getItem('keyLayout') as KeyLayout) ?? 'JIS'
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const [presetProgress, setPresetProgress] = useState<{ done: number; total: number } | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  // ガイドの進捗（接続後に初回のみ表示）
  const [guideStep, setGuideStep] = useState<'click' | 'assign' | 'save' | 'done'>('click');
  const [showGuide, setShowGuide] = useState(false);
  const everAssignedRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 接続状態の変化でガイド表示を制御
  useEffect(() => {
    if (state.connectionState === 'connected') {
      const seen = localStorage.getItem('keyball_guide_done');
      if (!seen) { setShowGuide(true); setGuideStep('click'); }
      setHasUnsaved(false);
    } else if (state.connectionState === 'disconnected') {
      setShowGuide(false);
      setHasUnsaved(false);
      everAssignedRef.current = false;
    }
  }, [state.connectionState]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [toast]);

  const showToast = (message: string, type: Toast['type'] = 'error') => {
    setToast({ message, type });
  };

  const handleBallSide = (side: BallSide) => {
    setBallSide(side);
    localStorage.setItem('ballSide', side);
  };

  const layout = state.model ? LAYOUTS[state.model] : null;
  const layerKeycodes = layout && state.keymap[state.currentLayer]
    ? layout.map(k => state.keymap[state.currentLayer]?.[k.row]?.[k.col] ?? 0)
    : [];

  const handleKeyClick = (index: number) => {
    setSelectedKeyIndex(index);
    setGuideStep(prev => prev === 'click' ? 'assign' : prev);
  };

  const assignKey = async (index: number, keycode: number) => {
    if (!layout) return;
    const k = layout[index];
    try {
      await setKeycode(state.currentLayer, k.row, k.col, keycode);
      setHasUnsaved(true);
      if (!everAssignedRef.current) {
        everAssignedRef.current = true;
        setGuideStep(prev => prev === 'assign' ? 'save' : prev);
      }
    } catch (e) {
      showToast(`キーコード書き込み失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleModalSelect = async (keycode: number) => {
    if (selectedKeyIndex === null) return;
    await assignKey(selectedKeyIndex, keycode);
  };

  const handleKeyDrop = async (index: number, keycode: number) => {
    await assignKey(index, keycode);
  };

  const handleTrackballChange = async (cfg: typeof state.trackball) => {
    if (!cfg) return;
    try { await setTrackball(cfg); }
    catch (e) { showToast(`トラックボール設定失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleLedChange = async (cfg: typeof state.led) => {
    if (!cfg) return;
    try { await setLed(cfg); }
    catch (e) { showToast(`LED設定失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleKbSettingsChange = async (s: KbSettings) => {
    try { await setKbSettings(s); }
    catch (e) { showToast(`詳細設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleLoadPreset = async (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    if (!confirm(`「${preset.name}」をキーボードに書き込みます。現在のキーマップは上書きされます。よろしいですか？`)) return;
    try {
      setPresetProgress({ done: 0, total: 1 });
      await loadPreset(preset, (done, total) => setPresetProgress({ done, total }));
      await save();
      showToast(`「${preset.name}」を書き込み・保存しました`, 'success');
    } catch (e) {
      showToast(`プリセット書き込み失敗: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPresetProgress(null);
    }
  };

  const handleMacroSave = async (idx: number, slot: MacroSlot) => {
    try {
      await setMacroSlot(idx, slot, state.macroSlots);
      showToast(`Macro ${idx} を保存しました`, 'success');
    } catch (e) {
      showToast(`マクロ保存失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleExportJSON = () => {
    const data = {
      version: 1,
      model: state.model,
      keymap: state.keymap,
      macros: state.macroSlots,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyball_${state.model ?? 'keymap'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSONをエクスポートしました', 'success');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.keymap || !Array.isArray(data.keymap)) throw new Error('keymap が見つかりません');
        if (!confirm('キーマップ（とマクロ）をインポートします。現在の設定は上書きされます。よろしいですか？')) return;
        const { info } = state;
        if (!info || !layout) return;
        let count = 0;
        for (let l = 0; l < Math.min(data.keymap.length, info.layers); l++) {
          for (let r = 0; r < info.rows; r++) {
            for (let c = 0; c < info.cols; c++) {
              const kc = data.keymap[l]?.[r]?.[c];
              if (kc !== undefined) { await setKeycode(l, r, c, kc); count++; }
            }
          }
        }
        if (data.macros && Array.isArray(data.macros)) {
          const imported: MacroSlot[] = Array.from(
            { length: MACRO_SLOT_COUNT },
            (_, i) => (data.macros[i] as MacroSlot) ?? emptyMacroSlot(),
          );
          await setAllMacroSlots(imported);
        }
        setHasUnsaved(false);
        await save();
        showToast(`インポート完了（${count}キー書き込み）`, 'success');
      } catch (err) {
        showToast(`インポート失敗: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetKeymap = async () => {
    if (!confirm('キーマップをファームウェアのデフォルトに戻します。よろしいですか？')) return;
    try {
      await resetKeymap();
      showToast('キーマップをリセットしました', 'success');
    } catch (e) {
      showToast(`リセット失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSave = async () => {
    try {
      await save();
      setHasUnsaved(false);
      setGuideStep(prev => prev === 'save' ? 'done' : prev);
      showToast('EEPROMに保存しました', 'success');
    } catch (e) {
      showToast(`保存失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const isConnected = state.connectionState === 'connected';
  const currentCode = selectedKeyIndex !== null ? (layerKeycodes[selectedKeyIndex] ?? 0) : 0;

  return (
    <div className="app">
      {toast && (
        <div className={`toast toast--${toast.type}`} onClick={() => setToast(null)}>
          {toast.message}
        </div>
      )}

      <header className="app-header">
        <h1 className="app-title">Keyball Configurator</h1>
        <button className="btn btn--ghost theme-toggle" onClick={toggleTheme} title="テーマ切替">
          {theme === 'dark' ? '☀ ライト' : '☾ ダーク'}
        </button>
        <div className="connection-bar">
          {isConnected ? (
            <>
              <span className="status status--connected">● {state.deviceName}</span>
              <button className="btn btn--ghost" onClick={disconnect}>切断</button>
              <button className="btn btn--ghost" onClick={handleResetKeymap}>初期化</button>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className="btn btn--ghost"
                  onClick={() => handleLoadPreset(p.id)}
                  disabled={presetProgress !== null}
                  title={p.description}
                >
                  {presetProgress !== null
                    ? `書込中 ${presetProgress.done}/${presetProgress.total}`
                    : 'プリセット読込'}
                </button>
              ))}
              <button className="btn btn--ghost" onClick={handleExportJSON} title="キーマップとマクロをJSONファイルに保存">エクスポート</button>
              <label className="btn btn--ghost" title="JSONファイルからキーマップとマクロを読み込む" style={{ cursor: 'pointer' }}>
                インポート
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
              </label>
              <button
                className={`btn btn--primary ${hasUnsaved ? 'btn--unsaved' : ''}`}
                onClick={handleSave}
                title={hasUnsaved ? '未保存の変更があります' : '設定をキーボードに保存'}
              >
                {hasUnsaved ? '● 保存する' : '保存'}
              </button>
            </>
          ) : (
            <>
              {!state.isWebHIDSupported && (
                <span className="status status--error">WebHID非対応ブラウザです (Chrome推奨)</span>
              )}
              {state.connectionState === 'error' && (
                <span className="status status--error">{state.errorMessage}</span>
              )}
              <button
                className="btn btn--primary"
                onClick={connect}
                disabled={!state.isWebHIDSupported || state.connectionState === 'connecting'}
              >
                {state.connectionState === 'connecting' ? '接続中...' : 'キーボードに接続'}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {state.isLoading ? (
          <div className="placeholder">
            <p className="placeholder-text">キーマップを読み込んでいます…</p>
            <p className="placeholder-note">しばらくお待ちください（数秒かかる場合があります）</p>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={`tab ${activeTab === 'keymap' ? 'tab--active' : ''}`} onClick={() => setActiveTab('keymap')}>キーマップ</button>
              <button className={`tab ${activeTab === 'macro' ? 'tab--active' : ''}`} onClick={() => setActiveTab('macro')}>マクロ</button>
              <button className={`tab ${activeTab === 'settings' ? 'tab--active' : ''}`} onClick={() => setActiveTab('settings')}>詳細設定</button>
              <button className={`tab ${activeTab === 'firmware' ? 'tab--active' : ''}`} onClick={() => setActiveTab('firmware')}>ファームウェア</button>
            </div>

            {activeTab === 'keymap' && !isConnected && (
              <div className="placeholder">
                <p className="placeholder-text">キーボードを USB で接続して「キーボードに接続」を押してください。</p>
                <p className="placeholder-note">※ Chrome / Edge などの WebHID 対応ブラウザが必要です。</p>
              </div>
            )}

            {activeTab === 'keymap' && isConnected && !layout && (
              <div className="placeholder">
                <p className="placeholder-text">モデルID {state.info?.model} は未対応です</p>
                <p className="placeholder-note">keyball39 / 44 / 61 のみサポートしています</p>
              </div>
            )}

            {activeTab === 'keymap' && isConnected && layout && showGuide && (
              <WelcomeGuide
                step={guideStep}
                onDismiss={() => {
                  setShowGuide(false);
                  localStorage.setItem('keyball_guide_done', '1');
                }}
              />
            )}

            {activeTab === 'keymap' && isConnected && layout && (
              <div className="keymap-view">
                <div className="layer-selector">
                  {Array.from({ length: state.info?.layers ?? 4 }, (_, i) => (
                    <button
                      key={i}
                      className={`btn btn--layer ${state.currentLayer === i ? 'btn--layer-active' : ''}`}
                      onClick={() => { setCurrentLayer(i); setSelectedKeyIndex(null); }}
                    >
                      Layer {i}
                    </button>
                  ))}
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                    ボール位置:
                    <button className={`btn btn--small btn--layer ${ballSide === 'left' ? 'btn--layer-active' : ''}`} onClick={() => handleBallSide('left')}>左</button>
                    <button className={`btn btn--small btn--layer ${ballSide === 'right' ? 'btn--layer-active' : ''}`} onClick={() => handleBallSide('right')}>右</button>
                  </span>
                </div>

                <div className="layout-scroll">
                  <KeyboardLayout
                    layout={layout}
                    keycodes={layerKeycodes}
                    selectedIndex={selectedKeyIndex}
                    ballSide={ballSide}
                    keyLayout={keyLayout}
                    onKeyClick={handleKeyClick}
                    onKeyDrop={handleKeyDrop}
                  />
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>
                  キーをクリックすると設定ポップアップが開きます
                </p>

                {state.trackball && (
                  <TrackballSettings config={state.trackball} onChange={handleTrackballChange} onSave={handleSave} />
                )}
                {state.led && (
                  <LEDSettings config={state.led} onChange={handleLedChange} onSave={handleSave} />
                )}
              </div>
            )}

            {activeTab === 'macro' && (
              <MacroEditor
                slots={state.macroSlots}
                keyLayout={keyLayout}
                isConnected={isConnected}
                onSave={handleMacroSave}
              />
            )}

            {activeTab === 'firmware' && (
              <FirmwareFlasher detectedModel={state.model} isHIDConnected={isConnected} onReboot={reboot} />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={state.kbSettings}
                isConnected={isConnected}
                onChange={handleKbSettingsChange}
                keyLayout={keyLayout}
                onKeyLayoutChange={layout => {
                  setKeyLayout(layout);
                  localStorage.setItem('keyLayout', layout);
                }}
              >
                {isConnected && layout && (
                  <CollapsibleCard title={<>LED診断 <span className="settings-unit">各LEDを1つずつ点灯して位置を確認</span></>}>
                    <LedTestPanel layout={layout} ballSide={ballSide} onTestLed={testLed} />
                  </CollapsibleCard>
                )}
                {isConnected && layout && (
                  <CollapsibleCard title={<>テストマトリクス <span className="settings-unit">キーが正しく反応するか確認</span></>}>
                    <MatrixTestPanel layout={layout} ballSide={ballSide} onGetMatrix={getMatrixState} />
                  </CollapsibleCard>
                )}
              </SettingsTab>
            )}
          </>
        )}
      </main>

      {selectedKeyIndex !== null && layout && (
        <KeyConfigModal
          keyIndex={selectedKeyIndex}
          currentCode={currentCode}
          keyLayout={keyLayout}
          onSelect={handleModalSelect}
          onClose={() => setSelectedKeyIndex(null)}
        />
      )}
    </div>
  );
}
