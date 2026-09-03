import { useState, useCallback, useRef, useEffect } from 'react';
import { KeyballHID, isWebHIDSupported } from '../lib/hid';
import type { KeyboardInfo, TrackballConfig, LedConfig, TdSlot, KbSettings, MacroSlot, GestureConfig, FirmwareVersion, PrecisionConfig, LayerLedConfig } from '../lib/protocol';
import { KB_SETTINGS_DEFAULT, MACRO_SLOT_COUNT, emptyMacroSlot, encodeMacroBuffer } from '../lib/protocol';
import type { ModelKey } from '../layouts';
import type { Preset } from '../lib/presets';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface KeyballState {
  connectionState: ConnectionState;
  errorMessage: string;
  deviceName: string;
  productId: number | null;
  info: KeyboardInfo | null;
  model: ModelKey | null;
  keymap: number[][][];
  trackball: TrackballConfig | null;
  led: LedConfig | null;
  tdSlots: TdSlot[];
  kbSettings: KbSettings;
  gesture: GestureConfig | null;  // null = このファームはジェスチャー非対応
  firmwareVersion: FirmwareVersion | null;  // null = バージョン情報非対応の旧ファーム
  precision: PrecisionConfig | null;  // 超低速モード設定。null = 非対応ファーム
  layerLedEnable: boolean | null;  // レイヤー連動LED機能の有効/無効。null = 非対応ファーム
  layerLeds: (LayerLedConfig | null)[];  // インデックス=レイヤー番号（0は未使用）
  macroSlots: MacroSlot[];
  currentLayer: number;
  isLoading: boolean;
  isWebHIDSupported: boolean;
}

const MODEL_MAP: Record<number, ModelKey> = {
  39:  'keyball39',
  44:  'keyball44',
  61:  'keyball61',
  139: 'keyballplus',
};

export function useKeyball() {
  const hid = useRef(new KeyballHID());

  const [state, setState] = useState<KeyballState>({
    connectionState: 'disconnected',
    errorMessage: '',
    deviceName: '',
    productId: null,
    info: null,
    model: null,
    keymap: [],
    trackball: null,
    led: null,
    tdSlots: [],
    kbSettings: KB_SETTINGS_DEFAULT,
    gesture: null,
    firmwareVersion: null,
    precision: null,
    layerLedEnable: null,
    layerLeds: [],
    macroSlots: Array.from({ length: MACRO_SLOT_COUNT }, emptyMacroSlot),
    currentLayer: 0,
    isLoading: false,
    isWebHIDSupported: isWebHIDSupported(),
  });

  // 物理切断（ケーブル抜き差し等）を検知して接続前の状態に戻す
  useEffect(() => {
    hid.current.onDisconnect = () => {
      setState(prev => ({
        ...prev,
        connectionState: 'disconnected',
        deviceName: '',
        productId: null,
        info: null,
        model: null,
        keymap: [],
        trackball: null,
        led: null,
      }));
    };
  }, []);

  const setPartial = (patch: Partial<KeyballState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const connect = useCallback(async () => {
    setPartial({ connectionState: 'connecting', errorMessage: '', isLoading: true });
    try {
      await hid.current.connect();
      const info = await hid.current.getInfo();
      const model = MODEL_MAP[info.model] ?? null;
      const keymap = await hid.current.getFullKeymap(info.layers, info.rows, info.cols);
      const trackball = await hid.current.getTrackball();
      let led = null;
      try { led = await hid.current.getLed(); } catch { /* 旧FWは非対応 */ }
      let tdSlots: TdSlot[] = [];
      try { tdSlots = await hid.current.getAllTdSlots(); } catch { /* 旧FWは非対応 */ }
      let kbSettings: KbSettings = KB_SETTINGS_DEFAULT;
      try { kbSettings = await hid.current.getSettings(); } catch { /* 旧FWは非対応 */ }
      let macroSlots: MacroSlot[] = Array.from({ length: MACRO_SLOT_COUNT }, emptyMacroSlot);
      try { macroSlots = await hid.current.getAllMacroSlots(); } catch { /* 旧FWは非対応 */ }
      let gesture: GestureConfig | null = null;
      try { gesture = await hid.current.getGesture(); } catch { /* ジェスチャー非対応FW */ }
      let firmwareVersion: FirmwareVersion | null = null;
      try { firmwareVersion = await hid.current.getVersion(); } catch { /* バージョン情報非対応の旧FW */ }
      let precision: PrecisionConfig | null = null;
      try { precision = await hid.current.getPrecisionConfig(); } catch { /* 超低速モード非対応FW */ }
      let layerLedEnable: boolean | null = null;
      const layerLeds: (LayerLedConfig | null)[] = [];
      try {
        layerLedEnable = await hid.current.getLayerLedEnable();
        for (let l = 1; l < info.layers; l++) {
          layerLeds[l] = await hid.current.getLayerLed(l);
        }
      } catch { /* レイヤー連動LED非対応FW */ }
      setPartial({
        connectionState: 'connected',
        deviceName: hid.current.deviceName,
        productId: hid.current.productId,
        info,
        model,
        keymap,
        trackball,
        led,
        tdSlots,
        kbSettings,
        macroSlots,
        gesture,
        firmwareVersion,
        precision,
        layerLedEnable,
        layerLeds,
        isLoading: false,
      });
    } catch (e) {
      setPartial({
        connectionState: 'error',
        errorMessage: e instanceof Error ? e.message : String(e),
        isLoading: false,
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    await hid.current.disconnect();
    setPartial({
      connectionState: 'disconnected',
      deviceName: '',
      productId: null,
      info: null,
      model: null,
      keymap: [],
      trackball: null,
    });
  }, []);

  const setKeycode = useCallback(async (layer: number, row: number, col: number, keycode: number) => {
    await hid.current.setKeycode(layer, row, col, keycode);
    setState(prev => {
      const keymap = prev.keymap.map(l => l.map(r => [...r]));
      if (keymap[layer]?.[row]) keymap[layer][row][col] = keycode;
      return { ...prev, keymap };
    });
  }, []);

  const setTrackball = useCallback(async (cfg: TrackballConfig) => {
    await hid.current.setTrackball(cfg);
    setPartial({ trackball: cfg });
  }, []);

  const setLed = useCallback(async (cfg: LedConfig) => {
    await hid.current.setLed(cfg);
    setPartial({ led: cfg });
  }, []);

  const setMacroSlot = useCallback(async (idx: number, slot: MacroSlot, allSlots: MacroSlot[]) => {
    const updated = allSlots.map((s, i) => i === idx ? slot : s);
    await hid.current.writeMacroBuffer(encodeMacroBuffer(updated));
    setState(prev => {
      const macroSlots = [...prev.macroSlots];
      macroSlots[idx] = slot;
      return { ...prev, macroSlots };
    });
  }, []);

  const setAllMacroSlots = useCallback(async (slots: MacroSlot[]) => {
    await hid.current.writeMacroBuffer(encodeMacroBuffer(slots));
    setState(prev => ({ ...prev, macroSlots: slots }));
  }, []);

  const setTdSlot = useCallback(async (idx: number, slot: TdSlot) => {
    await hid.current.setTdSlot(idx, slot);
    setState(prev => {
      const tdSlots = [...prev.tdSlots];
      tdSlots[idx] = slot;
      return { ...prev, tdSlots };
    });
  }, []);

  const setKbSettings = useCallback(async (s: KbSettings) => {
    await hid.current.setSettings(s);
    setPartial({ kbSettings: s });
  }, []);

  const setGesture = useCallback(async (g: GestureConfig) => {
    await hid.current.setGesture(g);
    setPartial({ gesture: g });
  }, []);

  const setPrecisionConfig = useCallback(async (p: PrecisionConfig) => {
    await hid.current.setPrecisionConfig(p);
    setPartial({ precision: p });
  }, []);

  const setLayerLedEnable = useCallback(async (v: boolean) => {
    await hid.current.setLayerLedEnable(v);
    setPartial({ layerLedEnable: v });
  }, []);

  const setLayerLed = useCallback(async (layer: number, cfg: LayerLedConfig) => {
    await hid.current.setLayerLed(layer, cfg);
    setState(prev => {
      const layerLeds = [...prev.layerLeds];
      layerLeds[layer] = cfg;
      return { ...prev, layerLeds };
    });
  }, []);

  const save = useCallback(async () => {
    await hid.current.save();
  }, []);

  const resetKeymap = useCallback(async () => {
    await hid.current.resetKeymap();
    // EEPROM再初期化後にキーマップを再読み込み
    const info = await hid.current.getInfo();
    const keymap = await hid.current.getFullKeymap(info.layers, info.rows, info.cols);
    setPartial({ keymap });
  }, []);

  const reboot = useCallback(async () => {
    await hid.current.reboot();
    await hid.current.disconnect();
    setPartial({ connectionState: 'disconnected', deviceName: '', info: null, model: null, keymap: [], trackball: null });
  }, []);

  const setCurrentLayer = useCallback((layer: number) => {
    setPartial({ currentLayer: layer });
  }, []);

  const testLed = useCallback(async (index: number) => {
    await hid.current.testLed(index);
  }, []);

  const getMatrixState = useCallback(async () => {
    return hid.current.getMatrixState();
  }, []);

  const loadPreset = useCallback(async (
    preset: Preset,
    onProgress?: (done: number, total: number) => void,
  ) => {
    const info = await hid.current.getInfo();
    const entries: Array<{ layer: number; row: number; col: number; kc: number }> = [];

    for (let layer = 0; layer < Math.min(preset.layers.length, info.layers); layer++) {
      const layerMap = preset.layers[layer];
      for (const rowStr of Object.keys(layerMap)) {
        const row = Number(rowStr);
        if (row >= info.rows) continue;
        for (const colStr of Object.keys(layerMap[row])) {
          const col = Number(colStr);
          if (col >= info.cols) continue;
          entries.push({ layer, row, col, kc: layerMap[row][col] });
        }
      }
    }

    for (let i = 0; i < entries.length; i++) {
      const { layer, row, col, kc } = entries[i];
      await hid.current.setKeycode(layer, row, col, kc);
      onProgress?.(i + 1, entries.length);
    }

    const keymap = await hid.current.getFullKeymap(info.layers, info.rows, info.cols);
    setPartial({ keymap });
  }, []);

  // 指定キーマップをデバイスに書き込む（現在値と違うセルだけ書く）。レイヤー並べ替えの保存に使う。
  const writeFullKeymap = useCallback(async (
    target: number[][][],
    onProgress?: (done: number, total: number) => void,
  ) => {
    const info = await hid.current.getInfo();
    const total = info.layers * info.rows * info.cols;
    let done = 0;
    for (let l = 0; l < info.layers; l++) {
      for (let row = 0; row < info.rows; row++) {
        for (let col = 0; col < info.cols; col++) {
          const want = target[l]?.[row]?.[col] ?? 0;
          const cur  = await hid.current.getKeycode(l, row, col);
          if (cur !== want) await hid.current.setKeycode(l, row, col, want);
          onProgress?.(++done, total);
        }
      }
    }
    const keymap = await hid.current.getFullKeymap(info.layers, info.rows, info.cols);
    setPartial({ keymap });
  }, []);

  return { state, connect, disconnect, setKeycode, setTrackball, setLed, setTdSlot, setMacroSlot, setAllMacroSlots, setKbSettings, setGesture, setPrecisionConfig, setLayerLedEnable, setLayerLed, save, reboot, resetKeymap, setCurrentLayer, testLed, getMatrixState, loadPreset, writeFullKeymap };
}
