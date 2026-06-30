import { useState, useEffect, useRef } from 'react';
import { useKeyball } from './hooks/useKeyball';
import { LAYOUTS } from './layouts';
import { KeyboardLayout } from './components/KeyboardLayout/KeyboardLayout';
import { KeyConfigModal } from './components/KeyConfigModal/KeyConfigModal';
import { TrackballSettings } from './components/TrackballSettings/TrackballSettings';
import { LEDSettings } from './components/LEDSettings/LEDSettings';
import { FirmwareFlasher } from './components/FirmwareFlasher/FirmwareFlasher';
import { SettingsTab } from './components/SettingsTab/SettingsTab';
import { MatrixTestPanel } from './components/MatrixTestPanel/MatrixTestPanel';
import { MacroEditor } from './components/MacroEditor/MacroEditor';
import { WelcomeGuide } from './components/WelcomeGuide/WelcomeGuide';
import { CollapsibleCard } from './components/Collapsible/CollapsibleCard';
import { FeedbackTab } from './components/FeedbackTab/FeedbackTab';
import { KeyPalette } from './components/KeyPalette/KeyPalette';
import type { KbSettings, MacroSlot, GestureConfig } from './lib/protocol';
import { MACRO_SLOT_COUNT, emptyMacroSlot } from './lib/protocol';
import type { KeyLayout } from './lib/keycodes';
import { reorderKeymap, isIdentityOrder } from './lib/layerReorder';
import './index.css';

type Tab = 'keymap' | 'macro' | 'settings' | 'firmware' | 'feedback';
// キー変更1回分（Undo/Redo用）
interface EditOp { layer: number; row: number; col: number; prev: number; next: number }
type BallSide = 'left' | 'right';
type Theme = 'dark' | 'light';

interface Toast {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const { state, connect, disconnect, setKeycode, setTrackball, setLed, setMacroSlot, setAllMacroSlots, setKbSettings, setGesture, save, reboot, resetKeymap, setCurrentLayer, getMatrixState, writeFullKeymap } = useKeyball();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [showAllLayers, setShowAllLayers] = useState(false);
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
  // Undo/Redo用：キー変更の履歴
  const [undoStack, setUndoStack] = useState<EditOp[]>([]);
  const [redoStack, setRedoStack] = useState<EditOp[]>([]);
  // レイヤー並べ替え（ドラッグでプレビュー → 保存で確定）
  // pendingOrder[新しい位置] = 元のレイヤー番号。null＝並べ替えなし
  const [pendingOrder, setPendingOrder] = useState<number[] | null>(null);
  const [dragLayer, setDragLayer] = useState<number | null>(null);
  const [savingReorder, setSavingReorder] = useState(false);
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
      setUndoStack([]);
      setRedoStack([]);
      setPendingOrder(null);
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

  // レイヤータブを位置 from から位置 to へ移動して並べ替え（プレビュー）
  const reorderTabs = (from: number, to: number) => {
    if (from === to) return;
    const n = state.info?.layers ?? 4;
    const base = pendingOrder ?? Array.from({ length: n }, (_, i) => i);
    const next = [...base];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPendingOrder(isIdentityOrder(next) ? null : next);
    setSelectedKeyIndex(null);
  };

  const handleSaveReorder = async () => {
    if (!pendingOrder) return;
    setSavingReorder(true);
    try {
      const reordered = reorderKeymap(state.keymap, pendingOrder);
      await writeFullKeymap(reordered);
      setPendingOrder(null);
      setUndoStack([]);   // 並べ替え後はキー単位の取り消し履歴が合わなくなるためクリア
      setRedoStack([]);
      setCurrentLayer(0);
      showToast('レイヤーの並べ替えを保存しました', 'success');
    } catch (e) {
      showToast(`保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingReorder(false);
    }
  };

  const layout = state.model ? LAYOUTS[state.model] : null;
  // keyball44 はキー配置を保ったまま左右半分の間隔を広げる（各画面で +1キー分）
  const keymapSplitGap = state.model === 'keyball44' ? 112 : 56;   // メイン画面（1キー=56px）
  const matrixSplitGap = state.model === 'keyball44' ? 77 : 36;    // テストマトリクス（1キー=41px）
  // 並べ替えプレビュー中は、中身移動＋参照付け替え済みのキーマップを表示に使う
  const displayKeymap = pendingOrder && state.keymap.length
    ? reorderKeymap(state.keymap, pendingOrder)
    : state.keymap;
  const layerKeycodes = layout && displayKeymap[state.currentLayer]
    ? layout.map(k => displayKeymap[state.currentLayer]?.[k.row]?.[k.col] ?? 0)
    : [];

  const handleKeyClick = (index: number) => {
    if (pendingOrder) { showToast('並べ替え中はキー編集できません。保存または取り消してください。'); return; }
    setSelectedKeyIndex(index);
    setGuideStep(prev => prev === 'click' ? 'assign' : prev);
  };

  const assignKey = async (index: number, keycode: number) => {
    if (!layout) return;
    const k = layout[index];
    const prev = state.keymap[state.currentLayer]?.[k.row]?.[k.col] ?? 0;
    if (prev === keycode) return;  // 変化なしなら何もしない
    try {
      await setKeycode(state.currentLayer, k.row, k.col, keycode);
      setUndoStack(s => [...s, { layer: state.currentLayer, row: k.row, col: k.col, prev, next: keycode }]);
      setRedoStack([]);  // 新しい操作で「やり直し」履歴は無効化
      setHasUnsaved(true);
      if (!everAssignedRef.current) {
        everAssignedRef.current = true;
        setGuideStep(prev => prev === 'assign' ? 'save' : prev);
      }
    } catch (e) {
      showToast(`キーコード書き込み失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleUndo = async () => {
    if (pendingOrder || undoStack.length === 0 || !layout) return;
    const op = undoStack[undoStack.length - 1];
    try {
      await setKeycode(op.layer, op.row, op.col, op.prev);
      setUndoStack(s => s.slice(0, -1));
      setRedoStack(r => [...r, op]);
      setHasUnsaved(true);
      if (op.layer !== state.currentLayer) setCurrentLayer(op.layer);
    } catch (e) {
      showToast(`元に戻す操作に失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleRedo = async () => {
    if (pendingOrder || redoStack.length === 0 || !layout) return;
    const op = redoStack[redoStack.length - 1];
    try {
      await setKeycode(op.layer, op.row, op.col, op.next);
      setRedoStack(r => r.slice(0, -1));
      setUndoStack(s => [...s, op]);
      setHasUnsaved(true);
      if (op.layer !== state.currentLayer) setCurrentLayer(op.layer);
    } catch (e) {
      showToast(`やり直し操作に失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Cmd/Ctrl+Z で元に戻す、Cmd/Ctrl+Shift+Z でやり直し（入力欄・モーダル表示中は無効）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z')) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (selectedKeyIndex !== null) return;  // キー設定モーダル表示中
      e.preventDefault();
      if (e.shiftKey) void handleRedo();
      else void handleUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack, redoStack, selectedKeyIndex, layout, state.currentLayer, state.keymap]);

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

  const handleGestureChange = async (g: GestureConfig) => {
    try { await setGesture(g); }
    catch (e) { showToast(`ジェスチャー設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
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

  // 接続中ファームで使える機能（未接続なら不明＝true扱いでグレーアウトしない）。
  // 通常版＝ジェスチャーあり＋メディアキーあり、LED版＝RGBあり、とセットで判別できる。
  const fwAvail = {
    media:   !isConnected || state.gesture !== null,  // メディアキー（非LED版のみ）
    gesture: !isConnected || state.gesture !== null,  // ジェスチャーキー（非LED版のみ）
    rgb:     !isConnected || state.led !== null,      // RGB系キー（LED版のみ）
  };
  // 加速度: LED版（ジェスチャー非対応）の keyball44/61 のみ無効。39はLED版でも有効。
  const accelAvailable = !isConnected || state.gesture !== null
    || state.model === 'keyball39';

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
              <button
                className="btn btn--ghost"
                onClick={handleUndo}
                disabled={undoStack.length === 0 || pendingOrder !== null}
                title={undoStack.length === 0 ? '元に戻す操作がありません' : '直前のキー変更を元に戻す (Cmd/Ctrl+Z)'}
              >
                ↩ 元に戻す
              </button>
              <button
                className="btn btn--ghost"
                onClick={handleRedo}
                disabled={redoStack.length === 0 || pendingOrder !== null}
                title={redoStack.length === 0 ? 'やり直す操作がありません' : '元に戻した変更をやり直す (Cmd/Ctrl+Shift+Z)'}
              >
                ↪ やり直し
              </button>
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
              <button className={`tab ${activeTab === 'feedback' ? 'tab--active' : ''}`} onClick={() => setActiveTab('feedback')}>ご意見・要望</button>
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
                  {Array.from({ length: state.info?.layers ?? 4 }, (_, i) => {
                    const src = pendingOrder ? pendingOrder[i] : i;
                    return (
                      <button
                        key={i}
                        className={`btn btn--layer ${!showAllLayers && state.currentLayer === i ? 'btn--layer-active' : ''} ${dragLayer === i ? 'btn--layer-dragging' : ''}`}
                        draggable
                        onDragStart={() => setDragLayer(i)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => { if (dragLayer !== null) reorderTabs(dragLayer, i); setDragLayer(null); }}
                        onDragEnd={() => setDragLayer(null)}
                        onClick={() => { setShowAllLayers(false); setCurrentLayer(i); setSelectedKeyIndex(null); }}
                        title={pendingOrder && src !== i ? `元レイヤー${src}（ドラッグで並べ替え）` : 'ドラッグで並べ替えできます'}
                      >
                        Layer {i}{pendingOrder && src !== i ? ` ←${src}` : ''}
                      </button>
                    );
                  })}
                  <button
                    className={`btn btn--layer ${showAllLayers ? 'btn--layer-active' : ''}`}
                    onClick={() => { setShowAllLayers(true); setSelectedKeyIndex(null); }}
                    title="すべてのレイヤーを並べて表示します（同じ位置のキーを見比べられます）"
                  >
                    全レイヤー
                  </button>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                    ボール位置:
                    <button className={`btn btn--small btn--layer ${ballSide === 'left' ? 'btn--layer-active' : ''}`} onClick={() => handleBallSide('left')}>左</button>
                    <button className={`btn btn--small btn--layer ${ballSide === 'right' ? 'btn--layer-active' : ''}`} onClick={() => handleBallSide('right')}>右</button>
                  </span>
                </div>

                {pendingOrder && (
                  <div className="reorder-bar">
                    <span>🔀 並べ替えをプレビュー中です。「保存」で確定します（レイヤー切替キーの番号も自動で調整されます）。</span>
                    <button className="btn btn--primary btn--small" disabled={savingReorder} onClick={handleSaveReorder} style={{ marginLeft: 'auto' }}>
                      {savingReorder ? '保存中…' : '保存'}
                    </button>
                    <button className="btn btn--ghost btn--small" disabled={savingReorder} onClick={() => { setPendingOrder(null); setSelectedKeyIndex(null); }}>
                      取り消し
                    </button>
                  </div>
                )}

                {showAllLayers ? (
                  <div className="all-layers-view">
                    {Array.from({ length: state.info?.layers ?? 4 }, (_, li) => {
                      const codes = layout.map(k => displayKeymap[li]?.[k.row]?.[k.col] ?? 0);
                      return (
                        <div key={li} className="all-layers-item">
                          <div className="all-layers-label">Layer {li}</div>
                          <div className="layout-scroll">
                            <KeyboardLayout
                              layout={layout}
                              keycodes={codes}
                              selectedIndex={null}
                              ballSide={ballSide}
                              keyLayout={keyLayout}
                              onKeyClick={(index) => { setShowAllLayers(false); setCurrentLayer(li); setSelectedKeyIndex(index); }}
                              onKeyDrop={() => {}}
                              showDescBar={false}
                              splitGapPx={keymapSplitGap}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>
                      キーをクリックすると、そのレイヤーに移動して編集できます
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="layout-scroll">
                      <KeyboardLayout
                        layout={layout}
                        keycodes={layerKeycodes}
                        selectedIndex={selectedKeyIndex}
                        ballSide={ballSide}
                        keyLayout={keyLayout}
                        onKeyClick={handleKeyClick}
                        onKeyDrop={handleKeyDrop}
                        splitGapPx={keymapSplitGap}
                      />
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>
                      キーをクリックで設定 ／ マウスを乗せると説明が表示されます
                    </p>
                  </>
                )}

                {state.trackball && (
                  <CollapsibleCard title="トラックボール設定">
                    <TrackballSettings
                      config={state.trackball}
                      onChange={handleTrackballChange}
                      onSave={handleSave}
                      scrollInvertV={state.kbSettings.scrollInvertV}
                      scrollInvertH={state.kbSettings.scrollInvertH}
                      onScrollInvertChange={(v, h) => handleKbSettingsChange({ ...state.kbSettings, scrollInvertV: v, scrollInvertH: h })}
                      accelAvailable={accelAvailable}
                    />
                  </CollapsibleCard>
                )}
                {/* LED設定。LED対応版（state.led あり）は操作可、通常版は表示はするがグレーアウト。 */}
                {isConnected && (
                  <CollapsibleCard title="LED設定">
                    {state.led ? (
                      <LEDSettings config={state.led} onChange={handleLedChange} onSave={handleSave} />
                    ) : (
                      <p className="settings-desc" style={{ color: 'var(--red)' }}>
                        ⚠ この版（通常版）ではLEDは使用できません。LED版のファームを書き込むと設定できます。
                      </p>
                    )}
                  </CollapsibleCard>
                )}

                <KeyPalette keyLayout={keyLayout} avail={fwAvail} />
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

            {activeTab === 'feedback' && <FeedbackTab />}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={state.kbSettings}
                isConnected={isConnected}
                model={state.model}
                onChange={handleKbSettingsChange}
                gesture={state.gesture}
                onGestureChange={handleGestureChange}
                keyLayout={keyLayout}
                onKeyLayoutChange={layout => {
                  setKeyLayout(layout);
                  localStorage.setItem('keyLayout', layout);
                }}
              >
                {isConnected && layout && (
                  <CollapsibleCard title={<>テストマトリクス <span className="settings-unit">キーが正しく反応するか確認</span></>}>
                    <MatrixTestPanel layout={layout} ballSide={ballSide} onGetMatrix={getMatrixState} splitGapPx={matrixSplitGap} />
                  </CollapsibleCard>
                )}
              </SettingsTab>
            )}
          </>
        )}
      </main>

      {selectedKeyIndex !== null && layout && !pendingOrder && (
        <KeyConfigModal
          keyIndex={selectedKeyIndex}
          currentCode={currentCode}
          keyLayout={keyLayout}
          avail={fwAvail}
          onSelect={handleModalSelect}
          onClose={() => setSelectedKeyIndex(null)}
        />
      )}
    </div>
  );
}
