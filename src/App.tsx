import { useState, useEffect, useRef } from 'react';
import { useKeyball } from './hooks/useKeyball';
import { LAYOUTS } from './layouts';
import { KeyboardLayout } from './components/KeyboardLayout/KeyboardLayout';
import { KeyConfigPanel } from './components/KeyConfigModal/KeyConfigModal';
import { LedPanel } from './components/LEDSettings/LedPanel';
import { FirmwareFlasher } from './components/FirmwareFlasher/FirmwareFlasher';
import { SettingsTab } from './components/SettingsTab/SettingsTab';
import { TrackballSettingsTab } from './components/TrackballSettingsTab/TrackballSettingsTab';
import { MatrixTestPanel } from './components/MatrixTestPanel/MatrixTestPanel';
import { MacroTab } from './components/MacroEditor/MacroTab';
import { WelcomeGuide } from './components/WelcomeGuide/WelcomeGuide';
import { FeedbackTab } from './components/FeedbackTab/FeedbackTab';
import type { KbSettings, MacroSlot, GestureConfig, GestureModeConfig, GestureThreshold, ShakeConfig, DFlickConfig, ComboSlot, TdSlot, DpiCurveConfig } from './lib/protocol';
import { MACRO_SLOT_COUNT, emptyMacroSlot, formatVersion, isOlderVersion } from './lib/protocol';
import { LATEST_FW_VERSION } from './lib/firmwareFeatures';
import type { KeyLayout } from './lib/keycodes';
import { reorderKeymap, isIdentityOrder } from './lib/layerReorder';
import { PRESETS } from './lib/presets';
import './index.css';

type Tab = 'keymap' | 'macro' | 'trackball' | 'settings' | 'firmware' | 'feedback';
// キー変更1回分（Undo/Redo用）
interface EditOp { layer: number; row: number; col: number; prev: number; next: number }
type BallSide = 'left' | 'right';
type Theme = 'dark' | 'light';
type AccentTheme = 'mint' | 'amber' | 'violet';

// レイヤータブの色分けドット（モックアップ準拠。5レイヤー目以降は無彩色にフォールバック）
const LAYER_DOT_COLORS = ['#48d6a8', '#e8b44a', '#5fa8e8', '#c98be0'];
const ACCENT_SWATCHES: { key: AccentTheme; dark: string; light: string }[] = [
  { key: 'mint',   dark: '#48d6a8', light: '#0e8f6c' },
  { key: 'amber',  dark: '#e8b44a', light: '#b4770a' },
  { key: 'violet', dark: '#a78bfa', light: '#6d48d6' },
];

// LED設定(色相・彩度・明度)から実際に光る色を計算する。数式はLEDSettingsの色相バーと揃えている。
function ledConfigToColor(cfg: { effectId: number; hue: number; sat: number; val: number } | null): string | null {
  if (!cfg) return null;
  if (cfg.effectId === 0) return null;  // 消灯中は専用色なし（呼び出し側でデフォルト色にフォールバック）
  const h = Math.round((cfg.hue / 255) * 360);
  const s = Math.round((cfg.sat / 255) * 100);
  const l = Math.max(6, Math.min(62, Math.round((cfg.val / 200) * 62)));
  return `hsl(${h} ${s}% ${l}%)`;
}

// レイヤータブの色付きドットに表示する色。レイヤー0は通常時のLED色（実際に常に光っている色）、
// レイヤー1以降はレイヤー連動LEDで専用の光り方を設定している場合のみその色を反映する。
// LEDを設定していないレイヤーは無彩色（グレー）にして「未設定」であることが分かるようにする。
// LED非対応ファームでは判断材料がないため固定パレット（モックアップ準拠）にフォールバックする。
function getLayerDotColor(layer: number, state: {
  led: { effectId: number; hue: number; sat: number; val: number } | null;
  layerLedEnable: boolean | null;
  layerLeds: ({ enabled: boolean; effectId: number; hue: number; sat: number; val: number } | null)[];
}): string {
  if (!state.led) return LAYER_DOT_COLORS[layer] ?? 'var(--text-dim)';
  if (layer === 0) return ledConfigToColor(state.led) ?? 'var(--text-dim)';
  const enabled = state.layerLedEnable && state.layerLeds[layer]?.enabled;
  if (!enabled) return 'var(--text-dim)';
  return ledConfigToColor(state.layerLeds[layer]) ?? 'var(--text-dim)';
}

// 指定レイヤーに紐づいているレイヤー連動機能の一覧（自動マウス/スクロール/ジェスチャー/精密モード/LED連動）。
// 各種LAYER_NONE(0xFE)は実レイヤー番号(0〜7)とは一致しないため、単純な等価比較だけで「未割り当て」を除外できる。
function getLayerFeatures(layer: number, state: {
  kbSettings: { autoMouseEnable: boolean; autoMouseLayer: number; scrollLayer: number };
  gesture: { layer: number } | null;
  gestureModes: { layer: number }[] | null;
  precision: { layer: number } | null;
  layerLedEnable: boolean | null;
  layerLeds: ({ enabled: boolean } | null)[];
}): string[] {
  const tags: string[] = [];
  if (state.kbSettings.autoMouseEnable && state.kbSettings.autoMouseLayer === layer) tags.push('自動マウス');
  if (state.kbSettings.scrollLayer === layer) tags.push('スクロール');
  if (state.gesture?.layer === layer || state.gestureModes?.some(m => m.layer === layer)) tags.push('ジェスチャー');
  if (state.precision?.layer === layer) tags.push('精密モード');
  if (state.layerLedEnable && state.layerLeds[layer]?.enabled) tags.push('LED連動');
  return tags;
}

interface Toast {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const { state, connect, disconnect, setKeycode, setTrackball, setLed, setMacroSlot, setAllMacroSlots, setKbSettings, setTdSlot, setGesture, setGestureMode, setGestureThreshold, setGestureWaveSpeed, setGestureWaveEnable, setShake, setDFlick, setComboSlot, setPrecisionConfig, setDpiCurve, setScrollInertiaConfig, setLayerLedEnable, setLayerLed, save, reboot, resetKeymap, setCurrentLayer, getMatrixState, testLed, writeFullKeymap, loadPreset } = useKeyball();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [showAllLayers, setShowAllLayers] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('keymap');
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'dark'
  );
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() =>
    (localStorage.getItem('accentTheme') as AccentTheme) ?? 'mint'
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
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(false);
  // ガイドの進捗（接続後に初回のみ表示）
  const [guideStep, setGuideStep] = useState<'flash' | 'connect' | 'click' | 'assign' | 'save' | 'mods' | 'layers' | 'trackball' | 'done'>('flash');
  const [showGuide, setShowGuide] = useState(false);
  const everAssignedRef = useRef(false);
  // 右側キー設定パネルの高さを、左側（キー配列＋LEDカード）の実測高さに合わせるための参照。
  // これにより、キー一覧が長くなってもLEDパネルの下にはみ出さず、パネル内で縦スクロールする。
  const keymapLeftRef = useRef<HTMLDivElement>(null);
  const [keymapLeftHeight, setKeymapLeftHeight] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentTheme);
    localStorage.setItem('accentTheme', accentTheme);
  }, [accentTheme]);

  useEffect(() => {
    const el = keymapLeftRef.current;
    if (!el) { setKeymapLeftHeight(null); return; }
    const update = () => setKeymapLeftHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // ResizeObserver自体がレイアウト変化（キーボード種別・全レイヤー表示切替など）による
    // 高さ変化を継続的に検知するため、依存はrefの付け外しに関わるタブ・接続状態だけでよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, state.connectionState]);

  // 接続状態の変化でガイド表示を制御（レンダー中の比較更新）
  const [prevConnState, setPrevConnState] = useState(state.connectionState);
  if (prevConnState !== state.connectionState) {
    setPrevConnState(state.connectionState);
    if (state.connectionState === 'connected') {
      // 「初めての方」ボタンからガイド表示中なら、キー編集のステップへ進める
      if (showGuide) setGuideStep('click');
      setHasUnsaved(false);
    } else if (state.connectionState === 'disconnected') {
      setShowGuide(false);
      setHasUnsaved(false);
      setUndoStack([]);
      setRedoStack([]);
      setPendingOrder(null);
    }
  }

  // refの書き換えはレンダー中にできないためeffectで行う
  useEffect(() => {
    if (state.connectionState === 'disconnected') everAssignedRef.current = false;
  }, [state.connectionState]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // チュートリアルの「次へ」（全ステップでスキップ可能）
  const advanceGuide = () => {
    const order = ['flash', 'connect', 'click', 'assign', 'mods', 'layers', 'save', 'trackball', 'done'] as const;
    // レイヤーの説明へ進むときはキー設定画面を閉じて、Layerタブが見える状態にする
    if (guideStep === 'mods') setSelectedKeyIndex(null);
    const i = order.indexOf(guideStep);
    setGuideStep(order[Math.min(i + 1, order.length - 1)]);
  };

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
        setGuideStep(prev => prev === 'assign' ? 'mods' : prev);
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

  const handleGestureModeChange = async (mode: number, g: GestureModeConfig) => {
    try { await setGestureMode(mode, g); }
    catch (e) { showToast(`ジェスチャーモード設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleGestureThresholdChange = async (t: GestureThreshold) => {
    try { await setGestureThreshold(t); }
    catch (e) { showToast(`ジェスチャー感度の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleGestureWaveSpeedChange = async (speed: number) => {
    try { await setGestureWaveSpeed(speed); }
    catch (e) { showToast(`ジェスチャーウェーブ速度の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleGestureWaveEnableChange = async (v: boolean) => {
    try { await setGestureWaveEnable(v); }
    catch (e) { showToast(`ジェスチャーウェーブ有効/無効の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleShakeChange = async (s: ShakeConfig) => {
    try { await setShake(s); }
    catch (e) { showToast(`シェイク設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleDFlickChange = async (d: DFlickConfig) => {
    try { await setDFlick(d); }
    catch (e) { showToast(`ダブルフリック設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleComboSlotChange = async (idx: number, slot: ComboSlot) => {
    try { await setComboSlot(idx, slot); }
    catch (e) { showToast(`コンボ設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleDpiCurveChange = async (c: DpiCurveConfig) => {
    try { await setDpiCurve(c); }
    catch (e) { showToast(`DPIカーブ設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const handleTdSlotChange = async (idx: number, slot: TdSlot) => {
    try { await setTdSlot(idx, slot); }
    catch (e) { showToast(`タップダンス設定の保存失敗: ${e instanceof Error ? e.message : String(e)}`); }
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
      version: 2,
      model: state.model,
      keymap: state.keymap,
      macros: state.macroSlots,
      // v2で追加: キーマップ以外の各種設定。接続中のファームが非対応の項目はnullのまま
      // 書き出される（インポート側でnullは無視される）。
      led: state.led,
      trackball: state.trackball,
      kbSettings: state.kbSettings,
      gesture: state.gesture,
      gestureModes: state.gestureModes,
      gestureThreshold: state.gestureThreshold,
      gestureWaveSpeed: state.gestureWaveSpeed,
      gestureWaveEnable: state.gestureWaveEnable,
      shake: state.shake,
      dflick: state.dflick,
      precision: state.precision,
      scrollInertia: state.scrollInertia,
      layerLedEnable: state.layerLedEnable,
      layerLeds: state.layerLeds,
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
        if (data.model && state.model && data.model !== state.model) {
          if (!confirm(`このファイルは ${data.model} 用です。接続中の ${state.model} に読み込むとキー配置が崩れる可能性があります。続行しますか？`)) return;
        }
        if (!confirm('キーマップ（と各種設定）をインポートします。現在の設定は上書きされます。よろしいですか？')) return;
        const { info } = state;
        if (!info || !layout) return;
        let count = 0;
        for (let l = 0; l < Math.min(data.keymap.length, info.layers); l++) {
          for (let r = 0; r < info.rows; r++) {
            for (let c = 0; c < info.cols; c++) {
              const kc = data.keymap[l]?.[r]?.[c];
              // 数値以外や範囲外の値が混ざったファイルから守る
              if (typeof kc === 'number' && Number.isInteger(kc) && kc >= 0 && kc <= 0xFFFF) {
                await setKeycode(l, r, c, kc);
                count++;
              }
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
        // v2で追加した各種設定。古い(v1)ファイルには存在しないので個別にnullチェックする。
        // 接続中のファームが非対応の項目（対応するsetterがエラーを返す）で全体が
        // 止まらないよう、1項目ずつtry/catchする。
        if (data.led) {
          try { await setLed(data.led); } catch { /* 非対応FW */ }
        }
        if (data.trackball) {
          try { await setTrackball(data.trackball); } catch { /* 非対応FW */ }
        }
        if (data.kbSettings) {
          try { await setKbSettings(data.kbSettings); } catch { /* 非対応FW */ }
        }
        if (data.gesture) {
          try { await setGesture(data.gesture); } catch { /* 非対応FW */ }
        }
        if (Array.isArray(data.gestureModes)) {
          for (let m = 0; m < data.gestureModes.length; m++) {
            if (!data.gestureModes[m]) continue;
            try { await setGestureMode(m, data.gestureModes[m]); } catch { /* 非対応FW */ }
          }
        }
        if (data.gestureThreshold) {
          try { await setGestureThreshold(data.gestureThreshold); } catch { /* 非対応FW */ }
        }
        if (typeof data.gestureWaveSpeed === 'number') {
          try { await setGestureWaveSpeed(data.gestureWaveSpeed); } catch { /* 非対応FW */ }
        }
        if (typeof data.gestureWaveEnable === 'boolean') {
          try { await setGestureWaveEnable(data.gestureWaveEnable); } catch { /* 非対応FW */ }
        }
        if (data.shake) {
          try { await setShake(data.shake); } catch { /* 非対応FW */ }
        }
        if (data.dflick) {
          try { await setDFlick(data.dflick); } catch { /* 非対応FW */ }
        }
        if (data.precision) {
          try { await setPrecisionConfig(data.precision); } catch { /* 非対応FW */ }
        }
        if (data.scrollInertia) {
          try { await setScrollInertiaConfig(data.scrollInertia); } catch { /* 非対応FW */ }
        }
        if (typeof data.layerLedEnable === 'boolean') {
          try { await setLayerLedEnable(data.layerLedEnable); } catch { /* 非対応FW */ }
        }
        if (Array.isArray(data.layerLeds)) {
          for (let l = 0; l < data.layerLeds.length; l++) {
            if (!data.layerLeds[l]) continue;
            try { await setLayerLed(l, data.layerLeds[l]); } catch { /* 非対応FW・レイヤー数超過 */ }
          }
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

  // 接続中の機種に対応する「標準ファームウェア互換」プリセット（未対応機種ならundefined）
  const avrPreset = state.model ? PRESETS.find(p => p.id === `${state.model}-via`) : undefined;

  const handleLoadAvrPreset = async () => {
    if (!avrPreset) return;
    if (!confirm(`キーマップを「${avrPreset.name}」に置き換えます。現在のキー配置は上書きされます。よろしいですか？`)) return;
    setLoadingPreset(true);
    try {
      await loadPreset(avrPreset);
      setHasUnsaved(false);
      await save();
      showToast(`「${avrPreset.name}」を読み込みました`, 'success');
    } catch (err) {
      showToast(`読み込み失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingPreset(false);
    }
  };

  const handleSave = async () => {
    try {
      await save();
      setHasUnsaved(false);
      setGuideStep(prev => prev === 'save' ? 'trackball' : prev);
      showToast('EEPROMに保存しました', 'success');
    } catch (e) {
      showToast(`保存失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const isConnected = state.connectionState === 'connected';
  const currentCode = selectedKeyIndex !== null ? (layerKeycodes[selectedKeyIndex] ?? 0) : 0;

  // 接続中ファームで使える機能（未接続なら不明＝true扱いでグレーアウトしない）。
  // v1.1.0〜メディアキーは通常版・LED版共通で有効。ジェスチャーは非LED版のみ、RGBはLED版のみ。
  const fwAvail = {
    media:      true,
    gesture:    !isConnected || state.gesture !== null || state.gestureModes !== null,      // ジェスチャーキー（非LED版のみ。RP2040版は複数モード化により旧gesture値がnullのまま残るためgestureModesも見る）
    rgb:        !isConnected || state.led !== null,          // RGB系キー（LED版のみ）
    macro:      !isConnected || state.gesture !== null || state.gestureModes !== null,      // マクロキー（v1.1.0〜非LED版のみ。判定理由は上のgestureと同じ）
    precision:  !isConnected || state.precision !== null, // 精密モードキー（RP2040版など対応FWのみ）
    gestureModes: !isConnected || state.gestureModes !== null, // 複数ジェスチャーモード（RP2040版限定）
    layerCount: state.info?.layers ?? 4,                     // 実際のレイヤー数（未接続時は4扱い）
  };

  // 加速度: LED版（ジェスチャー非対応）の keyball44/61 のみ無効。
  // 39とkeyballplus（39ベースでkeymap.cを共用）はLED版でも有効。
  const accelAvailable = !isConnected || state.gesture !== null
    || state.model === 'keyball39' || state.model === 'keyballplus';

  return (
    <div className="app">
      {toast && (
        <div className={`toast toast--${toast.type}`} onClick={() => setToast(null)}>
          {toast.message}
        </div>
      )}

      <header className="app-header">
        <div className="app-brand">
          <img
              className="app-logo"
              src={theme === 'dark' ? '/keyball_link_logo_white.svg' : '/keyball_link_logo_black.svg'}
              alt="Keyball Link"
            />
          <span className="app-brand__sub">WEB CONFIGURATOR<span className="app-brand__cursor" /></span>
        </div>
        <button className="btn btn--ghost theme-toggle" onClick={toggleTheme} title="テーマ切替">
          {theme === 'dark' ? '☀ ライト' : '☾ ダーク'}
        </button>
        <div className="accent-picker">
          {ACCENT_SWATCHES.map(a => (
            <button
              key={a.key}
              className={`accent-picker__dot ${accentTheme === a.key ? 'accent-picker__dot--active' : ''}`}
              style={{ background: theme === 'dark' ? a.dark : a.light }}
              title={`アクセントカラー: ${a.key}`}
              onClick={() => setAccentTheme(a.key)}
            />
          ))}
        </div>
        <div className="connection-bar">
          {isConnected ? (
            <>
              <span className="status status--connected"><span className="status__dot" />{state.deviceName}</span>
              <button className="btn btn--ghost" onClick={disconnect}>切断</button>
              <div className="import-menu-wrap">
                <button className="btn btn--ghost" onClick={() => setShowResetMenu(v => !v)} disabled={loadingPreset}>
                  初期化 {loadingPreset ? '…' : '▾'}
                </button>
                {showResetMenu && (
                  <div className="import-menu" onMouseLeave={() => setShowResetMenu(false)}>
                    <button
                      className="import-menu__item"
                      onClick={() => { setShowResetMenu(false); handleResetKeymap(); }}
                    >
                      すべての設定を初期化する
                      <span className="import-menu__desc">キーマップ・トラックボール（CPI/スクロール等）など全ての設定をKeyball Linkの初期状態に戻します</span>
                    </button>
                    <button
                      className="import-menu__item"
                      onClick={() => { setShowResetMenu(false); handleLoadAvrPreset(); }}
                      disabled={!avrPreset}
                    >
                      キーマップをRemap版の初期設定にする
                      <span className="import-menu__desc">
                        {avrPreset ? 'キーマップだけを置き換えます（トラックボールなど他の設定はそのまま）' : 'このモデルには未対応です'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
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
              <button className="btn btn--ghost" onClick={handleExportJSON} title="キーマップ・マクロ・ジェスチャー・精密モード・レイヤー連動LED・トラックボール設定などをJSONファイルに保存">エクスポート</button>
              <label className="btn btn--ghost" title="JSONファイルからキーマップ・マクロ・各種設定を読み込む" style={{ cursor: 'pointer' }}>
                インポート
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
              </label>
              <button
                className={`btn btn--primary ${hasUnsaved ? 'btn--unsaved' : ''}`}
                data-guide="save-btn"
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
                data-guide="connect-btn"
                onClick={connect}
                disabled={!state.isWebHIDSupported || state.connectionState === 'connecting'}
              >
                {state.connectionState === 'connecting' ? '接続中...' : 'キーボードに接続'}
              </button>
            </>
          )}
        </div>
      </header>

      {showGuide && (() => {
        // 対象がキーマップタブ内にあるステップで別タブにいるときは、タブへ戻る誘導を出す
        const needsKeymapTab = ['click', 'assign', 'mods', 'layers', 'save'].includes(guideStep);
        const displayStep = needsKeymapTab && activeTab !== 'keymap' ? 'backToKeymap' as const : guideStep;
        return (
          <WelcomeGuide
            step={displayStep}
            onNext={displayStep === 'backToKeymap' ? undefined : advanceGuide}
            onDismiss={() => setShowGuide(false)}
          />
        );
      })()}

      <main className="app-main">
        {state.isLoading ? (
          <div className="placeholder">
            <p className="placeholder-text">キーマップを読み込んでいます…</p>
            <p className="placeholder-note">しばらくお待ちください（数秒かかる場合があります）</p>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={`tab ${activeTab === 'keymap' ? 'tab--active' : ''}`} data-guide="keymap-tab" onClick={() => setActiveTab('keymap')}>キーマップ</button>
              <button className={`tab ${activeTab === 'trackball' ? 'tab--active' : ''}`} data-guide="trackball-tab" onClick={() => setActiveTab('trackball')}>トラックボール設定</button>
              <button className={`tab ${activeTab === 'macro' ? 'tab--active' : ''}`} onClick={() => setActiveTab('macro')}>マクロ拡張</button>
              <button className={`tab ${activeTab === 'settings' ? 'tab--active' : ''}`} onClick={() => setActiveTab('settings')}>詳細設定</button>
              <button className={`tab ${activeTab === 'firmware' ? 'tab--active' : ''}`} data-guide="firmware-tab" onClick={() => setActiveTab('firmware')}>ファームウェア</button>
              <button className={`tab ${activeTab === 'feedback' ? 'tab--active' : ''}`} onClick={() => setActiveTab('feedback')}>ご意見・要望</button>
            </div>

            {activeTab === 'keymap' && !isConnected && (
              <>
                <div className="placeholder">
                  <p className="placeholder-text">キーボードを USB で接続して「キーボードに接続」を押してください。</p>
                  <p className="placeholder-note">※ Chrome / Edge などの WebHID 対応ブラウザが必要です。</p>
                  {!showGuide && (
                    <button
                      className="btn btn--primary"
                      onClick={() => { setShowGuide(true); setGuideStep('flash'); }}
                    >
                      初めての方はこちら
                    </button>
                  )}
                </div>
              </>
            )}

            {activeTab === 'keymap' && isConnected && !layout && (
              <div className="placeholder">
                <p className="placeholder-text">モデルID {state.info?.model} は未対応です</p>
                <p className="placeholder-note">keyball39 / 44 / 61 のみサポートしています</p>
              </div>
            )}

            {activeTab === 'keymap' && isConnected && layout && (
              <div className="keymap-view">
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

                <div className="keymap-grid">
                  <div className="keymap-left-panel" ref={keymapLeftRef}>
                  <div className="keymap-keyboard-card">
                    <div className="layer-toolbar" data-guide="layer-tabs">
                      <div className="layer-tabs">
                        {Array.from({ length: state.info?.layers ?? 4 }, (_, i) => {
                          const src = pendingOrder ? pendingOrder[i] : i;
                          const features = getLayerFeatures(i, state);
                          const dragTitle = pendingOrder && src !== i ? `元レイヤー${src}（ドラッグで並べ替え）` : 'ドラッグで並べ替えできます';
                          return (
                            <button
                              key={i}
                              className={`layer-tab ${!showAllLayers && state.currentLayer === i ? 'layer-tab--active' : ''} ${dragLayer === i ? 'layer-tab--dragging' : ''}`}
                              draggable
                              onDragStart={() => setDragLayer(i)}
                              onDragOver={e => e.preventDefault()}
                              onDrop={() => { if (dragLayer !== null) reorderTabs(dragLayer, i); setDragLayer(null); }}
                              onDragEnd={() => setDragLayer(null)}
                              onClick={() => { setShowAllLayers(false); setCurrentLayer(i); setSelectedKeyIndex(null); }}
                              title={features.length ? `${dragTitle} / 連動機能: ${features.join('・')}` : dragTitle}
                            >
                              <span className="layer-tab__dot" style={{ background: getLayerDotColor(i, state) }} />
                              L{i}{pendingOrder && src !== i ? ` ←${src}` : ''}
                              {features.length > 0 && <span className="layer-tab__badge" />}
                            </button>
                          );
                        })}
                        <button
                          className={`layer-tab ${showAllLayers ? 'layer-tab--active' : ''}`}
                          onClick={() => { setShowAllLayers(true); setSelectedKeyIndex(null); }}
                          title="すべてのレイヤーを並べて表示します（同じ位置のキーを見比べられます）"
                        >
                          全レイヤー
                        </button>
                      </div>
                      {!showAllLayers && (() => {
                        const currentFeatures = getLayerFeatures(state.currentLayer, state);
                        return (
                          <span className="layer-toolbar__features">
                            {currentFeatures.length ? `連動: ${currentFeatures.join('・')}` : '連動機能なし'}
                          </span>
                        );
                      })()}
                      <div className="ball-toggle">
                        <span className="ball-toggle__label">ボール</span>
                        <div className="ball-toggle__group">
                          <button className={`ball-toggle__btn ${ballSide === 'left' ? 'ball-toggle__btn--active' : ''}`} onClick={() => handleBallSide('left')}>左</button>
                          <button className={`ball-toggle__btn ${ballSide === 'right' ? 'ball-toggle__btn--active' : ''}`} onClick={() => handleBallSide('right')}>右</button>
                        </div>
                      </div>
                    </div>

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
                      <div className="layout-scroll" data-guide="keyboard">
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
                    )}
                  </div>

                  {/* LED設定。キーボードカードとは別の1枚のパネルとして、キー配列カードの下・
                      キー設定パネルの隣に配置。LED対応版（state.led あり）は操作可、通常版はグレーアウト表示。 */}
                  {isConnected && (
                    <div className="keymap-led-panel">
                      <LedPanel
                        led={state.led}
                        onLedChange={handleLedChange}
                        layerLedEnable={state.layerLedEnable}
                        layerLeds={state.layerLeds}
                        onLayerLedEnableChange={setLayerLedEnable}
                        onLayerLedChange={setLayerLed}
                        switchableLayers={Array.from({ length: Math.max((state.info?.layers ?? 4) - 1, 0) }, (_, i) => i + 1)}
                      />
                    </div>
                  )}
                  </div>

                  <div className="keymap-right-panel" style={keymapLeftHeight ? { height: keymapLeftHeight, maxHeight: keymapLeftHeight } : undefined}>
                    {pendingOrder ? (
                      <div className="key-config-panel__empty">並べ替え中はキー編集できません</div>
                    ) : (
                      <KeyConfigPanel
                        key={`${state.currentLayer}-${selectedKeyIndex ?? 'none'}`}
                        currentCode={currentCode}
                        keyLayout={keyLayout}
                        avail={fwAvail}
                        layerCount={state.info?.layers}
                        selected={selectedKeyIndex !== null}
                        selLabel={selectedKeyIndex !== null && layout[selectedKeyIndex] ? `Layer ${state.currentLayer} / R${layout[selectedKeyIndex].row}C${layout[selectedKeyIndex].col}` : undefined}
                        onSelect={handleModalSelect}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'macro' && (
              <MacroTab
                macroAvailable={fwAvail.macro}
                macroSlots={state.macroSlots}
                onMacroSave={handleMacroSave}
                isConnected={isConnected}
                keyLayout={keyLayout}
                tdSlots={state.tdSlots}
                onTdSlotChange={handleTdSlotChange}
                comboSlots={state.comboSlots}
                comboEnabled={state.kbSettings.combo}
                onComboEnabledChange={v => handleKbSettingsChange({ ...state.kbSettings, combo: v })}
                onComboSlotChange={handleComboSlotChange}
              />
            )}

            {activeTab === 'firmware' && (
              <FirmwareFlasher detectedModel={state.model} isHIDConnected={isConnected} onReboot={reboot} />
            )}

            {activeTab === 'feedback' && <FeedbackTab />}

            {activeTab === 'trackball' && (
              <TrackballSettingsTab
                isConnected={isConnected}
                layerCount={state.info?.layers ?? 4}
                trackball={state.trackball}
                onTrackballChange={handleTrackballChange}
                onSave={handleSave}
                settings={state.kbSettings}
                onChange={handleKbSettingsChange}
                accelAvailable={accelAvailable}
                dpiCurve={state.dpiCurve}
                onDpiCurveChange={handleDpiCurveChange}
                gesture={state.gesture}
                onGestureChange={handleGestureChange}
                gestureModes={state.gestureModes}
                onGestureModeChange={handleGestureModeChange}
                gestureThreshold={state.gestureThreshold}
                onGestureThresholdChange={handleGestureThresholdChange}
                gestureWaveSpeed={state.gestureWaveSpeed}
                onGestureWaveSpeedChange={handleGestureWaveSpeedChange}
                gestureWaveEnable={state.gestureWaveEnable}
                onGestureWaveEnableChange={handleGestureWaveEnableChange}
                shake={state.shake}
                onShakeChange={handleShakeChange}
                dflick={state.dflick}
                onDFlickChange={handleDFlickChange}
                precision={state.precision}
                onPrecisionChange={setPrecisionConfig}
                scrollInertia={state.scrollInertia}
                onScrollInertiaChange={setScrollInertiaConfig}
                keyLayout={keyLayout}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={state.kbSettings}
                isConnected={isConnected}
                onChange={handleKbSettingsChange}
                detectedOs={state.detectedOs}
                keyLayout={keyLayout}
                onKeyLayoutChange={layout => {
                  setKeyLayout(layout);
                  localStorage.setItem('keyLayout', layout);
                }}
                model={state.model}
                productId={state.productId}
                onTestLed={isConnected ? testLed : undefined}
              >
                {isConnected && layout && (
                  <MatrixTestPanel layout={layout} ballSide={ballSide} onGetMatrix={getMatrixState} splitGapPx={matrixSplitGap} />
                )}
              </SettingsTab>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>Keyball Link v{__APP_VERSION__}</span>
        {isConnected && (
          <span>
            {' '}・ ファームウェア:{' '}
            {state.firmwareVersion ? (
              <>
                {formatVersion(state.firmwareVersion)}
                {state.model && isOlderVersion(state.firmwareVersion, LATEST_FW_VERSION[state.model]) && (
                  <span className="app-footer__warn">
                    （最新版 {formatVersion(LATEST_FW_VERSION[state.model])} があります。「ファームウェア」タブから更新できます）
                  </span>
                )}
              </>
            ) : (
              <span className="app-footer__warn">バージョン情報なし（古い版の可能性があります。更新をおすすめします）</span>
            )}
          </span>
        )}
      </footer>

    </div>
  );
}
