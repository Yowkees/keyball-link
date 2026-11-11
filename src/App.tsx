import { translate, useLanguage } from './i18n';
import { TextKey } from './i18n/text.enum';
import { LanguageSelect } from './i18n/LanguageSelect';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useKeyball } from './hooks/useKeyball';
import { LAYOUTS, layoutForBallSide } from './layouts';
import { KeyboardLayout } from './components/KeyboardLayout/KeyboardLayout';
import { KeyConfigPanel } from './components/KeyConfigModal/KeyConfigModal';
import { LedPanel } from './components/LEDSettings/LedPanel';
import { FirmwareFlasher } from './components/FirmwareFlasher/FirmwareFlasher';
import { SettingsTab } from './components/SettingsTab/SettingsTab';
import { TrackballSettingsTab } from './components/TrackballSettingsTab/TrackballSettingsTab';
import { MatrixTestPanel } from './components/MatrixTestPanel/MatrixTestPanel';
import { TypingGame } from './components/TypingGame/TypingGame';
import { MacroTab } from './components/MacroEditor/MacroTab';
import { WelcomeGuide } from './components/WelcomeGuide/WelcomeGuide';
import { FeedbackTab } from './components/FeedbackTab/FeedbackTab';
import type { KbSettings, MacroSlot, GestureConfig, GestureModeConfig, GestureThreshold, GestureWaveColor, ShakeConfig, DFlickConfig, ComboSlot, TdSlot, DpiCurveConfig, PrecisionConfig, ScrollInertiaConfig, LayerLedConfig } from './lib/protocol';
import { MACRO_SLOT_COUNT, COMBO_MAX_KEYS, emptyMacroSlot, formatVersion, isOlderVersion, LED_EFFECT_IDS_AVR, macroBufferSizeForModel, GESTURE_MODE_COUNT_LEGACY } from './lib/protocol';
import { latestFwVersion, firmwareFeaturesForChip } from './lib/firmwareFeatures';
import { chipForProductId, RP2040_LED_COUNT } from './lib/deviceIds';
import type { KeyLayout } from './lib/keycodes';
import { reorderKeymap, isIdentityOrder } from './lib/layerReorder';
import { KLE_GEOMETRY } from './layouts/kleGeometry';
import { BallPanel } from './components/BallPanel/BallPanel';
import { PRESETS } from './lib/presets';
import './index.css';

type Tab = 'keymap' | 'macro' | 'trackball' | 'settings' | 'firmware' | 'typing' | 'feedback';
// キー変更1回分（Undo/Redo用）
interface EditOp { layer: number; row: number; col: number; prev: number; next: number }
type BallSide = 'left' | 'right';
type Theme = 'dark' | 'light';
type AccentTheme = 'mint' | 'amber' | 'violet';

// レイヤータブの色分けドット（モックアップ準拠。5レイヤー目以降は無彩色にフォールバック）
// 開発（rp2040.keyball-link.pages.dev）とローカル開発サーバーでだけ表示する開発用ツールの判定
const isDevHost = typeof location !== 'undefined'
  && (location.hostname.startsWith('rp2040.') || location.hostname === 'localhost');

// 開発ではブラウザのタブ名を変えて、本番と見分けられるようにする（2026-10-09、本人希望）

// キー配列に描くトラックボール（右手ボールの時）の位置の微調整（2026-10-28、本人が見た目で指定）
const BALL_OFFSET_RIGHT: Record<string, { x: number; y: number }> = {
  keyball44: { x: 0.25, y: 0.08 },
  keyball39: { x: -0.14, y: 0.07 },
  keyballplus: { x: -0.1, y: 0.18 },   // 実機写真から測ったボールの中心に合わせた
};

const LAYER_DOT_COLORS = ['#48d6a8', '#e8b44a', '#5fa8e8', '#c98be0'];
const ACCENT_SWATCHES: { key: AccentTheme; label: TextKey; dark: string; light: string }[] = [
  { key: 'mint', label: TextKey.AccentMint, dark: '#48d6a8', light: '#0e8f6c' },
  { key: 'amber', label: TextKey.AccentAmber, dark: '#e8b44a', light: '#b4770a' },
  { key: 'violet', label: TextKey.AccentViolet, dark: '#a78bfa', light: '#6d48d6' },
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

// キー配列に描くトラックボールに書く、そのレイヤーでのボールの機能（2026-10-27、本人希望）。
// 連動レイヤーの設定（スクロール・精密モード・ジェスチャー）から決める。どれでもなければカーソル移動。
function getBallFunctionLabel(layer: number, state: {
  kbSettings: { scrollLayer: number };
  gesture: { layer: number } | null;
  gestureModes: { layer: number }[] | null;
  precision: { layer: number } | null;
}): string {
  const tags: string[] = [];
  if (state.kbSettings.scrollLayer === layer) tags.push(translate(TextKey.Scroll));
  if (state.precision?.layer === layer) tags.push(translate(TextKey.Precision));
  const modeIdx = state.gestureModes?.findIndex(m => m.layer === layer) ?? -1;
  if (modeIdx >= 0) tags.push(translate(TextKey.GestureNumber, { p0: modeIdx + 1 }));
  else if (state.gesture?.layer === layer) tags.push(translate(TextKey.Gesture));
  return tags.length ? tags.join('・') : translate(TextKey.Cursor);
}

interface Toast {
  message: string;
  type: 'error' | 'success';
}

export default function App() {
  const language = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = isDevHost ? translate(TextKey.DevelopmentTitle) : 'Keyball Link';
  }, [language]);
  const { state, connect, disconnect, setKeycode, setTrackball, setLed, setMacroSlot, setAllMacroSlots, setKbSettings, setTdSlot, setGesture, setGestureMode, setGestureThreshold, setGestureWaveSpeed, setGestureWaveEnable, setGestureWaveStyle, setGestureWaveColor, setShake, setDFlick, setComboSlot, setPrecisionConfig, setDpiCurve, setScrollInertiaConfig, setOledAnimEnabled, setBootAnimEnabled, setLayerLedEnable, setLayerLed, save, reboot, resetKeymap, setCurrentLayer, getMatrixState, writeFullKeymap, loadPreset, testLed } = useKeyball();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [showAllLayers, setShowAllLayers] = useState(false);
  // キーマップのトラックボールを選んでいる時は、右側のパネルにトラックボール設定を出す
  const [ballSelected, setBallSelected] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('keymap');
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'light'
  );
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() =>
    (localStorage.getItem('accentTheme') as AccentTheme) ?? 'mint'
  );
  // ボールの左右。ファームが答えられる時（RP2040版v0.5.1〜、片側だけにボール）はその値を使い、
  // それ以外は画面のボタンで選んだ値（ブラウザに保存）を使う。
  const [manualBallSide, setManualBallSide] = useState<BallSide>(() =>
    (localStorage.getItem('ballSide') as BallSide) ?? 'right'
  );
  const ballSide: BallSide = state.detectedBallSide ?? manualBallSide;
  const ballSideAuto = state.detectedBallSide !== null;
  // Remapと同じキー配置（via.jsonから生成）。キーマップの表示に使う（2026-10-27、本人希望）
  const kleGeometry = state.model ? KLE_GEOMETRY[state.model]?.[ballSide] : undefined;
  // トラックボールの位置: ボールの位置にあるキー（今は隠しているキー）の、反対側にボールがある時の座標
  const ballGeometryFor = (side: BallSide) => {
    if (!state.model) return undefined;
    const other = KLE_GEOMETRY[state.model]?.[side === 'right' ? 'left' : 'right'];
    if (!other) return undefined;
    const keys = LAYOUTS[state.model].filter(k => k.ball === side).map(k => other[`${k.row},${k.col}`]).filter(Boolean);
    return keys.length ? keys : undefined;
  };
  const ballGeometry = ballGeometryFor(ballSide);
  // 左手ボールの時は、右手ボールの時の位置をそのまま左右反転して使う（2026-10-28、本人希望）。
  // 位置は右手ボールの見た目で調整しているため（BALL_OFFSET_RIGHT）
  const ballMirror = ballSide === 'left' && state.model && KLE_GEOMETRY[state.model]?.right
    ? { geometry: KLE_GEOMETRY[state.model].right, ballGeometry: ballGeometryFor('right'), ballOffset: BALL_OFFSET_RIGHT[state.model] }
    : undefined;
  const ballProps = (layer: number) => {
    const label = getBallFunctionLabel(layer, state);
    return {
      ballGeometry,
      // 右手ボールの位置の微調整（2026-10-28、本人希望）。キー1個分＝1、右・下がプラス
      ballOffset: ballSide === 'right' ? BALL_OFFSET_RIGHT[state.model ?? ''] : undefined,
      ballMirror,
      ballLabel: label,
      get ballTitle() { return translate(TextKey.TrackballLayerHint, { p0: layer, p1: label }); },
      onBallClick: () => { setSelectedKeyIndex(null); setBallSelected(true); },
    };
  };
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
  const [guideStep, setGuideStep] = useState<'flash' | 'connect' | 'click' | 'assign' | 'save' | 'mods' | 'layers' | 'led' | 'trackball' | 'others' | 'done'>('flash');
  const [showGuide, setShowGuide] = useState(false);
  const everAssignedRef = useRef(false);
  // 右側キー設定パネルの高さを、左側（キー配列＋LEDカード）の実測高さに合わせるための参照。
  // これにより、キー一覧が長くなってもLEDパネルの下にはみ出さず、パネル内で縦スクロールする。
  const keymapLeftRef = useRef<HTMLDivElement>(null);
  const [keymapLeftHeight, setKeymapLeftHeight] = useState<number | null>(null);
  // キーマップタブを縦スクロールなしで画面内に収めるため、キー配列に使える高さを測る
  // （2026-10-07、本人要望）。画面の残りの高さから、キー配列以外の部分の高さを引いた値。
  const keymapViewRef = useRef<HTMLDivElement>(null);
  const [keyboardBoxBudget, setKeyboardBoxBudget] = useState<number | null>(null);

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

  useEffect(() => {
    const view = keymapViewRef.current;
    const main = view?.closest('.app-main') as HTMLElement | null;
    if (!view || !main) { setKeyboardBoxBudget(null); return; }
    const oneColumn = window.matchMedia('(max-width: 980px)');
    const update = () => {
      const box = view.querySelector('.keymap-keyboard-card .keyboard-layout-scale-box') as HTMLElement | null;
      // 1カラム表示（キー設定パネルが下に回る幅）は縦に長くなるのが前提なので縮めない
      if (!box || oneColumn.matches) { setKeyboardBoxBudget(null); return; }
      const cs = getComputedStyle(box);
      const boxOuter = box.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      const mainRect = main.getBoundingClientRect();
      const viewTop = view.getBoundingClientRect().top - mainRect.top + main.scrollTop;
      const available = main.clientHeight - parseFloat(getComputedStyle(main).paddingBottom) - viewTop;
      // キー配列以外の部分の高さはキー配列の大きさに左右されないので、毎回測り直しても値が振動しない
      const others = view.offsetHeight - boxOuter;
      const budget = Math.floor(available - others);
      setKeyboardBoxBudget(prev => (prev !== null && Math.abs(prev - budget) < 2 ? prev : budget));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(main);
    ro.observe(view);
    oneColumn.addEventListener('change', update);
    return () => { ro.disconnect(); oneColumn.removeEventListener('change', update); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, state.connectionState, showAllLayers, state.model]);

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
    const order = ['flash', 'connect', 'click', 'assign', 'mods', 'layers', 'led', 'save', 'trackball', 'others', 'done'] as const;
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
    setManualBallSide(side);
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
      setHasUnsaved(true);
      showToast(translate(TextKey.AppLayerOrderSaved), 'success');
    } catch (e) {
      showToast(translate(TextKey.SaveError, { p0: e instanceof Error ? e.message : String(e) }));
    } finally {
      setSavingReorder(false);
    }
  };

  const layout = useMemo(
    () => (state.model ? layoutForBallSide(LAYOUTS[state.model], ballSide) : null),
    [state.model, ballSide],
  );
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
    if (pendingOrder) { showToast(translate(TextKey.AppKeysCannotBeEditedWhileReordering)); return; }
    setSelectedKeyIndex(index);
    setBallSelected(false);
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
      showToast(translate(TextKey.AppCouldNotWriteKeycode, { p0: e instanceof Error ? e.message : String(e) }));
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
      showToast(translate(TextKey.AppCouldNotUndo, { p0: e instanceof Error ? e.message : String(e) }));
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
      showToast(translate(TextKey.AppCouldNotRedo, { p0: e instanceof Error ? e.message : String(e) }));
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
    try { await setTrackball(cfg); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotConfigureTrackball, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleLedChange = async (cfg: typeof state.led) => {
    if (!cfg) return;
    try { await setLed(cfg); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotConfigureLEDs, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleKbSettingsChange = async (s: KbSettings) => {
    try { await setKbSettings(s); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveAdvancedSettings, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureChange = async (g: GestureConfig) => {
    try { await setGesture(g); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureSettings, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureModeChange = async (mode: number, g: GestureModeConfig) => {
    try { await setGestureMode(mode, g); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureMode, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureThresholdChange = async (t: GestureThreshold) => {
    try { await setGestureThreshold(t); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureSensitivity, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureWaveSpeedChange = async (mode: number, speed: number) => {
    try { await setGestureWaveSpeed(mode, speed); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureWaveSpeed, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureWaveEnableChange = async (v: boolean) => {
    try { await setGestureWaveEnable(v); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureWaveSwitch, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureWaveStyleChange = async (mode: number, style: number) => {
    try { await setGestureWaveStyle(mode, style); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureWaveStyle, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleGestureWaveColorChange = async (mode: number, c: GestureWaveColor) => {
    try { await setGestureWaveColor(mode, c); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveGestureWaveColor, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleShakeChange = async (s: ShakeConfig) => {
    try { await setShake(s); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveShakeSettings, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleDFlickChange = async (d: DFlickConfig) => {
    try { await setDFlick(d); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveDoubleFlickSettings, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleComboSlotChange = async (idx: number, slot: ComboSlot) => {
    try { await setComboSlot(idx, slot); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveComboSettings, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleDpiCurveChange = async (c: DpiCurveConfig) => {
    try { await setDpiCurve(c); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveDPICurve, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleTdSlotChange = async (idx: number, slot: TdSlot) => {
    try { await setTdSlot(idx, slot); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveTapDance, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handlePrecisionChange = async (p: PrecisionConfig) => {
    try { await setPrecisionConfig(p); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSavePrecisionMode, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleScrollInertiaChange = async (c: ScrollInertiaConfig) => {
    try { await setScrollInertiaConfig(c); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveScrollInertia, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleLayerLedEnableChange = async (v: boolean) => {
    try { await setLayerLedEnable(v); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveLayerLEDs, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleLayerLedChange = async (layer: number, cfg: LayerLedConfig) => {
    try { await setLayerLed(layer, cfg); setHasUnsaved(true); }
    catch (e) { showToast(translate(TextKey.AppCouldNotSaveLayerLEDs, { p0: e instanceof Error ? e.message : String(e) })); }
  };

  const handleMacroSave = async (idx: number, slot: MacroSlot) => {
    try {
      await setMacroSlot(idx, slot, state.macroSlots);
      setHasUnsaved(true);
      showToast(translate(TextKey.AppMacroSaved, { p0: idx }), 'success');
    } catch (e) {
      showToast(translate(TextKey.AppCouldNotSaveMacro, { p0: e instanceof Error ? e.message : String(e) }));
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
      gestureWaveStyle: state.gestureWaveStyle,
      gestureWaveColor: state.gestureWaveColor,
      shake: state.shake,
      dflick: state.dflick,
      precision: state.precision,
      scrollInertia: state.scrollInertia,
      layerLedEnable: state.layerLedEnable,
      layerLeds: state.layerLeds,
      // 2026-11-03に追加: コンボ・タップダンス・DPIカーブ・OLED/起動アニメーションが
      // 書き出されていなかった（お客様の問い合わせで判明）。非対応ファームではnull/空のまま
      combos: state.comboSlots,
      tapDances: state.tdSlots.length ? state.tdSlots : null,
      dpiCurve: state.dpiCurve,
      oledAnimEnabled: state.oledAnimEnabled,
      bootAnimEnabled: state.bootAnimEnabled,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyball_${state.model ?? 'keymap'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(translate(TextKey.AppJSONExported), 'success');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.keymap || !Array.isArray(data.keymap)) throw new Error(translate(TextKey.AppMissingKeymap));
        if (data.model && state.model && data.model !== state.model) {
          if (!confirm(translate(TextKey.AppThisFileIsForImportingIt, { p0: data.model, p1: state.model }))) return;
        }
        if (!confirm(translate(TextKey.AppImportKeymapAndSettingsCurrentSettings))) return;
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
        // gestureWaveSpeed/Style/Colorは2026-09-30〜モードごとの配列になった。旧形式
        // (v2初期、単一値)のプリセットも読み込めるよう、配列でなければ全モードへ同じ値を
        // 適用する（本人が過去に書き出したプリセットを無効にしないため）。
        if (Array.isArray(data.gestureWaveSpeed)) {
          for (let m = 0; m < data.gestureWaveSpeed.length; m++) {
            if (typeof data.gestureWaveSpeed[m] !== 'number') continue;
            try { await setGestureWaveSpeed(m, data.gestureWaveSpeed[m]); } catch { /* 非対応FW */ }
          }
        } else if (typeof data.gestureWaveSpeed === 'number') {
          for (let m = 0; m < (state.gestureModes?.length ?? GESTURE_MODE_COUNT_LEGACY); m++) {
            try { await setGestureWaveSpeed(m, data.gestureWaveSpeed); } catch { /* 非対応FW */ }
          }
        }
        if (typeof data.gestureWaveEnable === 'boolean') {
          try { await setGestureWaveEnable(data.gestureWaveEnable); } catch { /* 非対応FW */ }
        }
        if (Array.isArray(data.gestureWaveStyle)) {
          for (let m = 0; m < data.gestureWaveStyle.length; m++) {
            if (typeof data.gestureWaveStyle[m] !== 'number') continue;
            try { await setGestureWaveStyle(m, data.gestureWaveStyle[m]); } catch { /* 非対応FW */ }
          }
        } else if (typeof data.gestureWaveStyle === 'number') {
          for (let m = 0; m < (state.gestureModes?.length ?? GESTURE_MODE_COUNT_LEGACY); m++) {
            try { await setGestureWaveStyle(m, data.gestureWaveStyle); } catch { /* 非対応FW */ }
          }
        }
        if (Array.isArray(data.gestureWaveColor)) {
          for (let m = 0; m < data.gestureWaveColor.length; m++) {
            if (!data.gestureWaveColor[m]) continue;
            try { await setGestureWaveColor(m, data.gestureWaveColor[m]); } catch { /* 非対応FW */ }
          }
        } else if (data.gestureWaveColor) {
          for (let m = 0; m < (state.gestureModes?.length ?? GESTURE_MODE_COUNT_LEGACY); m++) {
            try { await setGestureWaveColor(m, data.gestureWaveColor); } catch { /* 非対応FW */ }
          }
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
        // 2026-11-03に追加した項目（それより前に書き出したファイルには無い）
        const isKc = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 0xFFFF;
        if (Array.isArray(data.combos)) {
          for (let i = 0; i < data.combos.length; i++) {
            const c = data.combos[i];
            if (!c || !Array.isArray(c.keys) || !isKc(c.keycode)) continue;
            const keys = Array.from({ length: COMBO_MAX_KEYS }, (_, k) => (isKc(c.keys[k]) ? c.keys[k] : 0));
            try { await setComboSlot(i, { keys, keycode: c.keycode }); } catch { /* 非対応FW・スロット数超過 */ }
          }
        }
        if (Array.isArray(data.tapDances)) {
          for (let i = 0; i < data.tapDances.length; i++) {
            const t = data.tapDances[i];
            if (!t || !isKc(t.tap) || !isKc(t.hold) || !isKc(t.dtap) || typeof t.flags !== 'number') continue;
            try { await setTdSlot(i, { tap: t.tap, hold: t.hold, dtap: t.dtap, flags: t.flags & 0xFF }); } catch { /* 非対応FW・スロット数超過 */ }
          }
        }
        if (data.dpiCurve && typeof data.dpiCurve.enable === 'boolean' && Array.isArray(data.dpiCurve.points)) {
          try { await setDpiCurve(data.dpiCurve); } catch { /* 非対応FW */ }
        }
        if (typeof data.oledAnimEnabled === 'boolean') {
          try { await setOledAnimEnabled(data.oledAnimEnabled); } catch { /* 非対応FW */ }
        }
        if (typeof data.bootAnimEnabled === 'boolean') {
          try { await setBootAnimEnabled(data.bootAnimEnabled); } catch { /* 非対応FW */ }
        }
        setHasUnsaved(false);
        await save();
        showToast(translate(TextKey.AppImportCompleteKeysWritten, { p0: count }), 'success');
      } catch (err) {
        showToast(translate(TextKey.AppImportFailed, { p0: err instanceof Error ? err.message : String(err) }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetKeymap = async () => {
    if (!confirm(translate(TextKey.AppResetTheKeymapToFirmwareDefaults))) return;
    try {
      await resetKeymap();
      showToast(translate(TextKey.AppKeymapReset), 'success');
    } catch (e) {
      showToast(translate(TextKey.AppResetFailed, { p0: e instanceof Error ? e.message : String(e) }));
    }
  };

  // 接続中の機種に対応する「標準ファームウェア互換」プリセット（未対応機種ならundefined）
  const avrPreset = state.model ? PRESETS.find(p => p.id === `${state.model}-via`) : undefined;

  const handleLoadAvrPreset = async () => {
    if (!avrPreset) return;
    if (!confirm(translate(TextKey.AppReplaceTheKeymapWithCurrentKey, { p0: avrPreset.name }))) return;
    setLoadingPreset(true);
    try {
      await loadPreset(avrPreset);
      setHasUnsaved(false);
      await save();
      showToast(translate(TextKey.AppLoaded, { p0: avrPreset.name }), 'success');
    } catch (err) {
      showToast(translate(TextKey.AppCouldNotLoad, { p0: err instanceof Error ? err.message : String(err) }));
    } finally {
      setLoadingPreset(false);
    }
  };

  const handleSave = async () => {
    try {
      await save();
      setHasUnsaved(false);
      setGuideStep(prev => prev === 'save' ? 'trackball' : prev);
      showToast(translate(TextKey.AppSavedToEEPROM), 'success');
    } catch (e) {
      showToast(translate(TextKey.AppSaveFailed, { p0: e instanceof Error ? e.message : String(e) }));
    }
  };

  const isConnected = state.connectionState === 'connected';
  const currentCode = selectedKeyIndex !== null ? (layerKeycodes[selectedKeyIndex] ?? 0) : 0;

  // 接続中デバイスのチップ種別（AVR/RP2040）。productIdの生値から判定するため、
  // Keyball+のようにAVR/RP2040で同じKEYBALL_MODELを返す機種でも区別できる。
  // 未接続時はundefined（＝不明。機能グレーアウトは行わない）。
  const chip = isConnected && state.productId != null ? chipForProductId(state.productId) : undefined;
  const fwFeatures = firmwareFeaturesForChip(chip);

  // 接続中ファームで使える機能（未接続なら不明＝true扱いでグレーアウトしない）。
  // v1.1.0〜メディアキーは通常版・LED版共通で有効。ジェスチャーは非LED版のみ、RGBはLED版のみ。
  const fwAvail = {
    media:      true,
    gesture:    !isConnected || state.gesture !== null || state.gestureModes !== null,      // ジェスチャーキー（非LED版のみ。RP2040版は複数モード化により旧gesture値がnullのまま残るためgestureModesも見る）
    rgb:        !isConnected || state.led !== null,          // RGB系キー（LED版のみ）
    macro:      !isConnected || state.gesture !== null || state.gestureModes !== null,      // マクロキー（v1.1.0〜非LED版のみ。判定理由は上のgestureと同じ）
    precision:  !isConnected || state.precision !== null, // 精密モードキー（RP2040版など対応FWのみ）
    gestureModes: !isConnected || state.gestureModes !== null, // 複数ジェスチャーモード（RP2040版限定）
    gestureModes6: !isConnected || (state.gestureModes?.length ?? 0) >= 6, // ジェスチャー5・6（RP2040版v0.4.18〜）
    tapDance:   fwFeatures.tapDance,   // タップダンス（TD0〜TD7）。AVR版は非対応
    layerCount: state.info?.layers ?? 4,                     // 実際のレイヤー数（未接続時は4扱い）
  };

  // AVR接続時、LEDエフェクト選択肢をファームが実際に対応している4種のみに絞る
  // （RGB_MATRIX限定エフェクトを選ぶとLEDが消灯してしまうため）。RP2040・未接続時は制限なし。
  const ledAllowedEffectIds = chip === 'avr' ? LED_EFFECT_IDS_AVR : undefined;

  // 加速度: LED版（ジェスチャー非対応）の keyball44/61 のみ無効。
  // 39とkeyballplus（39ベースでkeymap.cを共用）はLED版でも有効。
  const accelAvailable = !isConnected || state.gesture !== null || chip === 'rp2040'
    || state.model === 'keyball39' || state.model === 'keyballplus';

  const renderTrackballSettings = () => (
    <TrackballSettingsTab
          isConnected={isConnected}
          layerCount={state.info?.layers ?? 4}
          avail={fwAvail}
          trackball={state.trackball}
          onTrackballChange={handleTrackballChange}
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
          gestureWaveStyle={state.gestureWaveStyle}
          onGestureWaveStyleChange={handleGestureWaveStyleChange}
          gestureWaveColor={state.gestureWaveColor}
          onGestureWaveColorChange={handleGestureWaveColorChange}
          shake={state.shake}
          onShakeChange={handleShakeChange}
          dflick={state.dflick}
          onDFlickChange={handleDFlickChange}
          precision={state.precision}
          onPrecisionChange={handlePrecisionChange}
          scrollInertia={state.scrollInertia}
          onScrollInertiaChange={handleScrollInertiaChange}
          keyLayout={keyLayout}
    />
  );

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
          <span className="app-brand__sub">{translate(TextKey.AppWEBCONFIGURATOR)}<span className="app-brand__cursor" /></span>
        </div>
        <button className="btn btn--ghost theme-toggle" onClick={toggleTheme} title={translate(TextKey.SwitchTheme)}>
          {theme === 'dark' ? translate(TextKey.LightTheme) : translate(TextKey.DarkTheme)}
        </button>
        <LanguageSelect />
        <div className="accent-picker">
          {ACCENT_SWATCHES.map(a => (
            <button
              key={a.key}
              className={`accent-picker__dot ${accentTheme === a.key ? 'accent-picker__dot--active' : ''}`}
              style={{ background: theme === 'dark' ? a.dark : a.light }}
              title={translate(TextKey.AppAccentColor, { p0: translate(a.label) })}
              onClick={() => setAccentTheme(a.key)}
            />
          ))}
        </div>
        <div className="connection-bar">
          {isConnected ? (
            <>
              <span className="status status--connected"><span className="status__dot" />{state.deviceName}</span>
              <button className="btn btn--ghost" onClick={disconnect}>{translate(TextKey.Disconnect)}</button>
              <div className="import-menu-wrap">
                <button className="btn btn--ghost" onClick={() => setShowResetMenu(v => !v)} disabled={loadingPreset}>{translate(TextKey.AppReset)}{loadingPreset ? '…' : '▾'}
                </button>
                {showResetMenu && (
                  <div className="import-menu" onMouseLeave={() => setShowResetMenu(false)}>
                    <button
                      className="import-menu__item"
                      onClick={() => { setShowResetMenu(false); handleResetKeymap(); }}
                    >{translate(TextKey.AppResetAllSettings)}<span className="import-menu__desc">{translate(TextKey.AppRestoreKeymapTrackballCPIScrollEtc)}</span>
                    </button>
                    <button
                      className="import-menu__item"
                      onClick={() => { setShowResetMenu(false); handleLoadAvrPreset(); }}
                      disabled={!avrPreset}
                    >{translate(TextKey.AppRestoreTheRemapDefaultKeymap)}<span className="import-menu__desc">
                        {avrPreset ? translate(TextKey.AppReplacesOnlyTheKeymapTrackballAnd) : translate(TextKey.AppNotSupportedOnThisModel)}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <button
                className="btn btn--ghost"
                onClick={handleUndo}
                disabled={undoStack.length === 0 || pendingOrder !== null}
                title={undoStack.length === 0 ? translate(TextKey.AppNothingToUndo) : translate(TextKey.AppUndoTheLastKeyChangeCmd)}
              >{translate(TextKey.AppUndo)}</button>
              <button
                className="btn btn--ghost"
                onClick={handleRedo}
                disabled={redoStack.length === 0 || pendingOrder !== null}
                title={redoStack.length === 0 ? translate(TextKey.AppNothingToRedo) : translate(TextKey.AppRedoTheUndoneChangeCmdCtrl)}
              >{translate(TextKey.AppRedo)}</button>
              <button className="btn btn--ghost" onClick={handleExportJSON} title={translate(TextKey.AppExportKeymapMacrosCombosTapDance)}>{translate(TextKey.AppExport)}</button>
              <label className="btn btn--ghost" title={translate(TextKey.AppImportKeymapMacrosAndSettingsFrom)} style={{ cursor: 'pointer' }}>{translate(TextKey.AppImport)}<input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
              </label>
              <button
                className={`btn btn--primary ${hasUnsaved ? 'btn--unsaved' : ''}`}
                data-guide="save-btn"
                onClick={handleSave}
                title={hasUnsaved ? translate(TextKey.AppYouHaveUnsavedChanges) : translate(TextKey.AppSaveSettingsToTheKeyboard)}
              >
                {/* 未保存の有無で文字が変わってもボタンの幅を変えない（左に並ぶボタンが動かないように。
                    2026-10-23、本人希望）。長い方の文字を見えない形で重ねて、幅を確保している */}
                <span className="btn-fixed-label">
                  <span className="btn-fixed-label__sizer" aria-hidden="true">{translate(TextKey.AppSaveChanges)}</span>
                  <span>{hasUnsaved ? translate(TextKey.AppSaveChanges) : translate(TextKey.Save)}</span>
                </span>
              </button>
            </>
          ) : (
            <>
              {!state.isWebHIDSupported && (
                <span className="status status--error">{translate(TextKey.AppThisBrowserDoesNotSupportWebHID)}</span>
              )}
              {state.connectionState === 'error' && (
                <span className="status status--error">{state.errorMessage}</span>
              )}
              {/* キーマップタブでは接続前の案内欄（「初めての方はこちら」の隣）に置くため、
                  ヘッダーには他のタブを開いている時だけ出す（2026-10-06、本人希望） */}
              {activeTab !== 'keymap' && (
                <button
                  className="btn btn--primary"
                  data-guide="connect-btn"
                  onClick={connect}
                  disabled={!state.isWebHIDSupported || state.connectionState === 'connecting'}
                >
                  {state.connectionState === 'connecting' ? translate(TextKey.AppConnecting) : translate(TextKey.ConnectKeyboard)}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {showGuide && (() => {
        // 対象がキーマップタブ内にあるステップで別タブにいるときは、タブへ戻る誘導を出す
        // （接続ボタンはどのタブにもある＝キーマップタブではヘッダー以外の場所にある、ため'connect'は含めない）
        const needsKeymapTab = ['click', 'assign', 'mods', 'layers', 'led', 'save'].includes(guideStep);
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
            <p className="placeholder-text">{translate(TextKey.AppLoadingKeymap)}</p>
            <p className="placeholder-note">{translate(TextKey.AppPleaseWaitThisMayTakeA)}</p>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={`tab ${activeTab === 'keymap' ? 'tab--active' : ''}`} data-guide="keymap-tab" onClick={() => setActiveTab('keymap')}>{translate(TextKey.Keymap)}</button>
              <button className={`tab ${activeTab === 'trackball' ? 'tab--active' : ''}`} data-guide="trackball-tab" onClick={() => setActiveTab('trackball')}>{translate(TextKey.TrackballSettings)}</button>
              <button className={`tab ${activeTab === 'macro' ? 'tab--active' : ''}`} data-guide="macro-tab" onClick={() => setActiveTab('macro')}>{translate(TextKey.MacroSettings)}</button>
              <button className={`tab ${activeTab === 'settings' ? 'tab--active' : ''}`} onClick={() => setActiveTab('settings')}>{translate(TextKey.AdvancedSettings)}</button>
              <button className={`tab ${activeTab === 'firmware' ? 'tab--active' : ''}`} data-guide="firmware-tab" onClick={() => setActiveTab('firmware')}>{translate(TextKey.Firmware)}</button>
              {/* タイピングゲームはまだ開発だけで公開する（本番では隠す。2026-10-28、本人希望） */}
              {isDevHost && <button className={`tab ${activeTab === 'typing' ? 'tab--active' : ''}`} onClick={() => setActiveTab('typing')}>{translate(TextKey.TypingGame)}</button>}
              <button className={`tab ${activeTab === 'feedback' ? 'tab--active' : ''}`} onClick={() => setActiveTab('feedback')}>{translate(TextKey.Feedback)}</button>
            </div>

            {activeTab === 'keymap' && !isConnected && (
              <>
                <div className="placeholder">
                  <p className="placeholder-text">{translate(TextKey.AppConnectTheKeyboardViaUSBThen)}</p>
                  <p className="placeholder-note">{translate(TextKey.AppABrowserWithWebHIDSupportSuch)}</p>
                  <div className="placeholder-actions">
                    <button
                      className="btn btn--primary placeholder-connect"
                      data-guide="connect-btn"
                      onClick={connect}
                      disabled={!state.isWebHIDSupported || state.connectionState === 'connecting'}
                    >
                      {state.connectionState === 'connecting' ? translate(TextKey.AppConnecting) : translate(TextKey.ConnectKeyboard)}
                    </button>
                    {!showGuide && (
                      <button
                        className="placeholder-guide-link"
                        onClick={() => { setShowGuide(true); setGuideStep('flash'); }}
                      >{translate(TextKey.AppNewHereStartHere)}</button>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'keymap' && isConnected && !layout && (
              <div className="placeholder">
                <p className="placeholder-text">{translate(TextKey.AppModelID)}{state.info?.model}{translate(TextKey.AppIsNotSupported)}</p>
                <p className="placeholder-note">{translate(TextKey.AppOnlyKeyballAreSupported)}</p>
              </div>
            )}

            {activeTab === 'keymap' && isConnected && layout && (
              <div className="keymap-view" ref={keymapViewRef}>
                {pendingOrder && (
                  <div className="reorder-bar">
                    <span>{translate(TextKey.AppPreviewingTheNewLayerOrderSave)}</span>
                    <button className="btn btn--primary btn--small" disabled={savingReorder} onClick={handleSaveReorder} style={{ marginLeft: 'auto' }}>
                      {savingReorder ? translate(TextKey.AppSaving) : translate(TextKey.Save)}
                    </button>
                    <button className="btn btn--ghost btn--small" disabled={savingReorder} onClick={() => { setPendingOrder(null); setSelectedKeyIndex(null); }}>{translate(TextKey.AppCancel)}</button>
                  </div>
                )}

                <div className="keymap-grid">
                  <div className="keymap-left-panel" ref={keymapLeftRef}>
                  <div className="keymap-keyboard-card">
                    <div className="layer-toolbar" data-guide="layer-tabs">
                      <div className="layer-tabs">
                        {Array.from({ length: state.info?.layers ?? 4 }, (_, i) => {
                          const src = pendingOrder ? pendingOrder[i] : i;
                          const dragTitle = pendingOrder && src !== i ? translate(TextKey.AppOriginalLayerDragToReorder, { p0: src }) : translate(TextKey.AppDragToReorder);
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
                              title={dragTitle}
                            >
                              <span className="layer-tab__dot" style={{ background: getLayerDotColor(i, state) }} />
                              L{i}{pendingOrder && src !== i ? ` ←${src}` : ''}
                            </button>
                          );
                        })}
                        <button
                          className={`layer-tab ${showAllLayers ? 'layer-tab--active' : ''}`}
                          onClick={() => { setShowAllLayers(true); setSelectedKeyIndex(null); }}
                          title={translate(TextKey.AppShowAllLayersSideBySide)}
                        >{translate(TextKey.AppAllLayers)}</button>
                      </div>
                      {/* 選んでいるレイヤーがオートマウスのレイヤーなら、タブの横に示す（設定はトラックボール設定タブ）（2026-10-27、本人希望） */}
                      {!showAllLayers && state.kbSettings.autoMouseEnable && state.kbSettings.autoMouseLayer === state.currentLayer && (
                        <span className="layer-toolbar__aml">{translate(TextKey.AppAutoMouse)}</span>
                      )}
                      <div className="ball-toggle">
                        <span className="ball-toggle__label">{ballSideAuto ? translate(TextKey.AppBallAutomatic) : translate(TextKey.AppBall)}</span>
                        <div className="ball-toggle__group" title={ballSideAuto ? translate(TextKey.AppShowingTheBallPositionReportedBy) : undefined}>
                          <button className={`ball-toggle__btn ${ballSide === 'left' ? 'ball-toggle__btn--active' : ''}`} disabled={ballSideAuto} onClick={() => handleBallSide('left')}>{translate(TextKey.AppLeft)}</button>
                          <button className={`ball-toggle__btn ${ballSide === 'right' ? 'ball-toggle__btn--active' : ''}`} disabled={ballSideAuto} onClick={() => handleBallSide('right')}>{translate(TextKey.AppRight)}</button>
                        </div>
                      </div>
                    </div>

                    {showAllLayers ? (
                      <div className="all-layers-view">
                        {Array.from({ length: state.info?.layers ?? 4 }, (_, li) => {
                          const codes = layout.map(k => displayKeymap[li]?.[k.row]?.[k.col] ?? 0);
                          return (
                            <div key={li} className="all-layers-item">
                              <div className="all-layers-label">{translate(TextKey.AppLayer)}{li}</div>
                              <div className="layout-scroll">
                                <KeyboardLayout
                                  layout={layout}
                                  keycodes={codes}
                                  selectedIndex={null}
                                  ballSide={ballSide}
                                  geometry={kleGeometry}
                                  {...ballProps(li)}
                                  onBallClick={() => { setShowAllLayers(false); setCurrentLayer(li); setSelectedKeyIndex(null); setBallSelected(true); }}
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
                        <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>{translate(TextKey.AppClickAKeyToSwitchTo)}</p>
                      </div>
                    ) : (
                      <div
                        className="layout-scroll"
                        data-guide="keyboard"
                        onClick={e => {
                          // キー本体（.keyの中）のクリックはKey側のonClickで選択処理をするので、
                          // ここでは無視する。それ以外（キーとキーの間の余白など）をクリックした
                          // 時だけ選択を解除する（本人要望・2026-09-18）。
                          if (!(e.target as HTMLElement).closest('.key, .kb-ball')) { setSelectedKeyIndex(null); setBallSelected(false); }
                        }}
                      >
                        <KeyboardLayout
                          layout={layout}
                          keycodes={layerKeycodes}
                          selectedIndex={selectedKeyIndex}
                          ballSide={ballSide}
                          geometry={kleGeometry}
                          {...ballProps(state.currentLayer)}
                          ballSelected={ballSelected}
                          keyLayout={keyLayout}
                          onKeyClick={handleKeyClick}
                          onKeyDrop={handleKeyDrop}
                          splitGapPx={keymapSplitGap}
                          maxBoxHeight={keyboardBoxBudget}
                        />
                      </div>
                    )}
                  </div>

                  {/* LED設定。キーボードカードとは別の1枚のパネルとして、キー配列カードの下・
                      キー設定パネルの隣に配置。LED対応版（state.led あり）は操作可、通常版はグレーアウト表示。 */}
                  {isConnected && (
                    <div className="keymap-led-panel" data-guide="led-panel">
                      <LedPanel
                        led={state.led}
                        onLedChange={handleLedChange}
                        layerLedEnable={state.layerLedEnable}
                        layerLeds={state.layerLeds}
                        onLayerLedEnableChange={handleLayerLedEnableChange}
                        onLayerLedChange={handleLayerLedChange}
                        switchableLayers={Array.from({ length: Math.max((state.info?.layers ?? 4) - 1, 0) }, (_, i) => i + 1)}
                        allowedEffectIds={ledAllowedEffectIds}
                        layer={state.currentLayer}
                      />
                    </div>
                  )}
                  </div>

                  <div className="keymap-right-panel" style={keymapLeftHeight ? { height: keymapLeftHeight, maxHeight: keymapLeftHeight } : undefined}>
                    {pendingOrder ? (
                      <div className="key-config-panel__empty">{translate(TextKey.AppCannotEditKeysWhileReordering)}</div>
                    ) : ballSelected ? (
                      <div className="key-config-panel ball-panel-wrap">
                        <BallPanel
                          key={state.currentLayer}
                          layer={state.currentLayer}
                          disabled={!isConnected}
                          settings={state.kbSettings}
                          onChange={handleKbSettingsChange}
                          trackball={state.trackball}
                          onTrackballChange={handleTrackballChange}
                          accelAvailable={accelAvailable}
                          scrollInertia={state.scrollInertia}
                          onScrollInertiaChange={handleScrollInertiaChange}
                          precision={state.precision}
                          onPrecisionChange={handlePrecisionChange}
                          gesture={state.gesture}
                          onGestureChange={handleGestureChange}
                          gestureModes={state.gestureModes}
                          onGestureModeChange={handleGestureModeChange}
                          gestureThreshold={state.gestureThreshold}
                          onGestureThresholdChange={handleGestureThresholdChange}
                          gestureWaveEnable={state.gestureWaveEnable}
                          onGestureWaveEnableChange={handleGestureWaveEnableChange}
                          gestureWaveStyle={state.gestureWaveStyle}
                          onGestureWaveStyleChange={handleGestureWaveStyleChange}
                          gestureWaveColor={state.gestureWaveColor}
                          onGestureWaveColorChange={handleGestureWaveColorChange}
                          gestureWaveSpeed={state.gestureWaveSpeed}
                          onGestureWaveSpeedChange={handleGestureWaveSpeedChange}
                          onOpenTab={() => setActiveTab('trackball')}
                          keyLayout={keyLayout}
                          avail={fwAvail}
                        />
                      </div>
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

                <div className="keymap-version">
                  <span>Keyball Link v{__APP_VERSION__}</span>
                  {isConnected && (
                    <span>
                      {' '}{translate(TextKey.AppFirmware)}{' '}
                      {state.firmwareVersion ? (
                        <>
                          {formatVersion(state.firmwareVersion)}
                          {state.model && isOlderVersion(state.firmwareVersion, latestFwVersion(state.model, chip)) && (
                            <span className="app-footer__warn">{translate(TextKey.AppLatest)}{formatVersion(latestFwVersion(state.model, chip))}{translate(TextKey.AppAvailableUpdateFromTheFirmwareTab)}</span>
                          )}
                        </>
                      ) : (
                        <span className="app-footer__warn">{translate(TextKey.AppNoVersionInformationPossiblyOutdatedUpdate)}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'macro' && (
              <MacroTab
                macroAvailable={fwAvail.macro}
                tapDanceAvailable={fwFeatures.tapDance}
                comboAvailable={fwFeatures.combo}
                macroSlots={state.macroSlots}
                onMacroSave={handleMacroSave}
                macroBufferSize={macroBufferSizeForModel(state.model, chip)}
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
              <FirmwareFlasher detectedModel={state.model} productId={state.productId} isHIDConnected={isConnected} onReboot={reboot} />
            )}

            {isDevHost && activeTab === 'typing' && <TypingGame />}

            {activeTab === 'feedback' && <FeedbackTab />}

            {activeTab === 'trackball' && renderTrackballSettings()}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={state.kbSettings}
                isConnected={isConnected}
                onChange={handleKbSettingsChange}
                detectedOs={state.detectedOs}
                oledAnimEnabled={state.oledAnimEnabled}
                bootAnimEnabled={state.bootAnimEnabled}
                onBootAnimChange={async v => {
                  try { await setBootAnimEnabled(v); }
                  catch (e) { showToast(translate(TextKey.AppSaveFailed, { p0: e instanceof Error ? e.message : String(e) })); }
                }}
                onOledAnimChange={async v => {
                  try { await setOledAnimEnabled(v); }
                  catch (e) { showToast(translate(TextKey.AppSaveFailed, { p0: e instanceof Error ? e.message : String(e) })); }
                }}
                keyLayout={keyLayout}
                onKeyLayoutChange={layout => {
                  setKeyLayout(layout);
                  localStorage.setItem('keyLayout', layout);
                }}
                model={state.model}
                productId={state.productId}
                // 「LED位置実測（開発用）」はLED配線順調査用の内部ツールで一般ユーザーには
                // 不要なため、一般公開版では常時非表示にする（2026-09-25、本人指示）。
                // onTestLedをundefinedのままにするとSettingsTab側のセクション自体が
                // 出なくなる（`...(onTestLed ? [...] : [])`のガード）。
                // 2026-10-02: Keyball44/61のRP2040版のLED配線確認のため、開発
                // （rp2040.keyball-link.pages.dev）とローカル開発サーバーでだけ表示する。
                onTestLed={isDevHost && isConnected && chip === 'rp2040' ? testLed : undefined}
                ledCount={chip === 'rp2040' && state.model ? RP2040_LED_COUNT[state.model] : undefined}
              >
                {isConnected && layout && (
                  <MatrixTestPanel layout={layout} ballSide={ballSide} onGetMatrix={getMatrixState} splitGapPx={matrixSplitGap} />
                )}
              </SettingsTab>
            )}
          </>
        )}
      </main>

    </div>
  );
}
