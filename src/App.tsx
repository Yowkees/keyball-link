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
import type { KbSettings } from './lib/protocol';
import './index.css';

type Tab = 'keymap' | 'settings' | 'firmware';
type BallSide = 'left' | 'right';
type Theme = 'dark' | 'light';

interface Toast {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const { state, connect, disconnect, setKeycode, setTrackball, setLed, setKbSettings, save, reboot, resetKeymap, setCurrentLayer, testLed, getMatrixState } = useKeyball();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('keymap');
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'dark'
  );
  const [ballSide, setBallSide] = useState<BallSide>(() =>
    (localStorage.getItem('ballSide') as BallSide) ?? 'right'
  );
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  const handleKeyClick = (index: number) => setSelectedKeyIndex(index);

  const assignKey = async (index: number, keycode: number) => {
    if (!layout) return;
    const k = layout[index];
    try {
      await setKeycode(state.currentLayer, k.row, k.col, keycode);
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
              <button className="btn btn--primary" onClick={handleSave}>保存</button>
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

            {activeTab === 'firmware' && (
              <FirmwareFlasher detectedModel={state.model} isHIDConnected={isConnected} onReboot={reboot} />
            )}

            {activeTab === 'settings' && (
              <>
                <SettingsTab
                  settings={state.kbSettings}
                  isConnected={isConnected}
                  onChange={handleKbSettingsChange}
                />
                {isConnected && layout && (
                  <LedTestPanel layout={layout} ballSide={ballSide} onTestLed={testLed} />
                )}
                {isConnected && layout && (
                  <MatrixTestPanel layout={layout} ballSide={ballSide} onGetMatrix={getMatrixState} />
                )}
              </>
            )}
          </>
        )}
      </main>

      {selectedKeyIndex !== null && layout && (
        <KeyConfigModal
          keyIndex={selectedKeyIndex}
          currentCode={currentCode}
          onSelect={handleModalSelect}
          onClose={() => setSelectedKeyIndex(null)}
        />
      )}
    </div>
  );
}
