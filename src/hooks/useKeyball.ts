import { useState, useCallback, useRef } from 'react';
import { KeyballHID, isWebHIDSupported } from '../lib/hid';
import type { KeyboardInfo, TrackballConfig, LedConfig, TdSlot, KbSettings } from '../lib/protocol';
import { KB_SETTINGS_DEFAULT } from '../lib/protocol';
import type { ModelKey } from '../layouts';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface KeyballState {
  connectionState: ConnectionState;
  errorMessage: string;
  deviceName: string;
  info: KeyboardInfo | null;
  model: ModelKey | null;
  keymap: number[][][];
  trackball: TrackballConfig | null;
  led: LedConfig | null;
  tdSlots: TdSlot[];
  kbSettings: KbSettings;
  currentLayer: number;
  isLoading: boolean;
  isWebHIDSupported: boolean;
}

const MODEL_MAP: Record<number, ModelKey> = {
  39:  'keyball39',
  44:  'keyball44',
  61:  'keyball61',
};

export function useKeyball() {
  const hid = useRef(new KeyballHID());

  const [state, setState] = useState<KeyballState>({
    connectionState: 'disconnected',
    errorMessage: '',
    deviceName: '',
    info: null,
    model: null,
    keymap: [],
    trackball: null,
    led: null,
    tdSlots: [],
    kbSettings: KB_SETTINGS_DEFAULT,
    currentLayer: 0,
    isLoading: false,
    isWebHIDSupported: isWebHIDSupported(),
  });

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
      setPartial({
        connectionState: 'connected',
        deviceName: hid.current.deviceName,
        info,
        model,
        keymap,
        trackball,
        led,
        tdSlots,
        kbSettings,
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

  return { state, connect, disconnect, setKeycode, setTrackball, setLed, setTdSlot, setKbSettings, save, reboot, resetKeymap, setCurrentLayer, testLed, getMatrixState };
}
