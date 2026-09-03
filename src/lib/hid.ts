// WebHID API を使ってキーボードと通信するラッパー

import { KEYBALL_VID, KEYBALL_USAGE_PAGE, KEYBALL_USAGE_ID, CMD, makePacket, TD_SLOT_COUNT, MACRO_BUFFER_SIZE, MACRO_CHUNK_SIZE, emptyMacroSlot, encodeMacroBuffer, decodeMacroBuffer, KB_FLAG_AUTO_SHIFT, KB_FLAG_PERMISSIVE_HOLD, KB_FLAG_RETRO_TAPPING, KB_FLAG_SCROLL_INV_V, KB_FLAG_SCROLL_INV_H, KB_FLAG_AML_DISABLE, LAYER_NONE, GESTURE_TH_DEFAULT, GESTURE_TH_MIN, GESTURE_TH_MAX } from './protocol';
import type { KeyboardInfo, KeyballModel, TrackballConfig, LedConfig, TdSlot, KbSettings, MacroSlot, GestureConfig, FirmwareVersion, PrecisionConfig, LayerLedConfig } from './protocol';

export class KeyballHID {
  private device: HIDDevice | null = null;
  // 物理的に切断（ケーブル抜き等）されたときに呼ばれる
  onDisconnect: (() => void) | null = null;

  get connected(): boolean {
    return this.device !== null && this.device.opened;
  }

  get deviceName(): string {
    return this.device?.productName ?? '';
  }

  // 接続中デバイスの実際のUSB Product ID。
  // model名だけでは同じ機種名でも版（AVR/RP2040等）によってPIDが異なることがあるため、
  // macOSキーボードタイプ設定などPID指定が必要な場面ではこちらを使う。
  get productId(): number | null {
    return this.device?.productId ?? null;
  }

  private handleDeviceDisconnect = (e: HIDConnectionEvent) => {
    if (this.device && e.device === this.device) {
      this.device = null;
      this.onDisconnect?.();
    }
  };

  async connect(): Promise<void> {
    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: KEYBALL_VID, usagePage: KEYBALL_USAGE_PAGE, usage: KEYBALL_USAGE_ID }],
    });
    if (devices.length === 0) throw new Error('デバイスが選択されませんでした');
    this.device = devices[0];
    if (!this.device.opened) await this.device.open();
    navigator.hid.addEventListener('disconnect', this.handleDeviceDisconnect);
  }

  async disconnect(): Promise<void> {
    navigator.hid.removeEventListener('disconnect', this.handleDeviceDisconnect);
    if (this.device?.opened) await this.device.close();
    this.device = null;
  }

  private sendCommand(packet: Uint8Array): Promise<Uint8Array> {
    if (!this.device?.opened) return Promise.reject(new Error('未接続'));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.device?.removeEventListener('inputreport', handler);
        reject(new Error('タイムアウト'));
      }, 3000);

      const handler = (e: HIDInputReportEvent) => {
        clearTimeout(timer);
        this.device?.removeEventListener('inputreport', handler);
        resolve(new Uint8Array(e.data.buffer));
      };

      this.device!.addEventListener('inputreport', handler);
      this.device!.sendReport(0x00, packet as Uint8Array<ArrayBuffer>).catch((err: unknown) => {
        clearTimeout(timer);
        this.device?.removeEventListener('inputreport', handler);
        reject(err);
      });
    });
  }

  async getInfo(): Promise<KeyboardInfo> {
    const r = await this.sendCommand(makePacket(CMD.GET_INFO));
    return { model: r[1] as KeyballModel, layers: r[2], rows: r[3], cols: r[4], protocol: r[5] };
  }

  async getKeycode(layer: number, row: number, col: number): Promise<number> {
    const r = await this.sendCommand(makePacket(CMD.GET_KEYCODE, layer, row, col));
    return (r[4] << 8) | r[5];
  }

  async setKeycode(layer: number, row: number, col: number, keycode: number): Promise<void> {
    const r = await this.sendCommand(makePacket(CMD.SET_KEYCODE, layer, row, col, (keycode >> 8) & 0xFF, keycode & 0xFF));
    if (r[0] !== CMD.SET_KEYCODE) {
      throw new Error(`SET_KEYCODE 応答異常 (cmd=0x${r[0].toString(16).padStart(2,'0')}) — ファームウェアがコマンドを認識していない可能性があります`);
    }
    const readback = await this.getKeycode(layer, row, col);
    if (readback !== keycode) {
      throw new Error(`書き込み検証失敗 — 書き込み値: 0x${keycode.toString(16).toUpperCase()}, 読み取り値: 0x${readback.toString(16).toUpperCase()} (ファームウェアがSET_KEYCODEをサポートしていない可能性があります)`);
    }
  }

  async getFullKeymap(layers: number, rows: number, cols: number): Promise<number[][][]> {
    const keymap: number[][][] = [];
    for (let l = 0; l < layers; l++) {
      keymap[l] = [];
      for (let r = 0; r < rows; r++) {
        keymap[l][r] = [];
        for (let c = 0; c < cols; c++) {
          keymap[l][r][c] = await this.getKeycode(l, r, c);
        }
      }
    }
    return keymap;
  }

  async getTrackball(): Promise<TrackballConfig> {
    const r = await this.sendCommand(makePacket(CMD.GET_TRACKBALL));
    let accel = 0;
    try {
      const accelR = await this.sendCommand(makePacket(CMD.GET_ACCEL));
      if (accelR[0] === CMD.GET_ACCEL) accel = accelR[1];
    } catch {
      // 旧ファームウェアはGET_ACCELに対応していないためデフォルト0を使用
    }
    return { cpiIndex: r[1], scrollDiv: r[2], scrollMode: r[3] ?? 0, accel };
  }

  async setTrackball(cfg: TrackballConfig): Promise<void> {
    await this.sendCommand(makePacket(CMD.SET_TRACKBALL, cfg.cpiIndex, cfg.scrollDiv, cfg.scrollMode));
    await this.sendCommand(makePacket(CMD.SET_ACCEL, cfg.accel));
  }

  async save(): Promise<void> {
    const r = await this.sendCommand(makePacket(CMD.SAVE));
    if (r[0] !== CMD.SAVE) {
      throw new Error(`SAVE 応答異常 (cmd=0x${r[0].toString(16).padStart(2,'0')})`);
    }
  }

  async resetKeymap(): Promise<void> {
    await this.sendCommand(makePacket(CMD.RESET_KEYMAP));
  }

  async getLed(): Promise<LedConfig> {
    const r = await this.sendCommand(makePacket(CMD.GET_LED));
    // LED非対応版（RGBLIGHT無効）は未対応コマンドとして 0xFF を返す → 例外にしてstate.led=nullにする
    if (r[0] !== CMD.GET_LED) throw new Error('LED非対応のファームです');
    return { effectId: r[1], hue: r[2], sat: r[3], val: r[4], speed: r[5] };
  }

  async setLed(cfg: LedConfig): Promise<void> {
    await this.sendCommand(makePacket(CMD.SET_LED, cfg.effectId, cfg.hue, cfg.sat, cfg.val, cfg.speed));
  }

  // レイヤー連動LED機能そのものの有効/無効（RP2040版など対応ファームのみ。非対応FWでは例外）
  async getLayerLedEnable(): Promise<boolean> {
    const r = await this.sendCommand(makePacket(CMD.GET_LAYER_LED_ENABLE));
    if (r[0] !== CMD.GET_LAYER_LED_ENABLE) throw new Error('レイヤー連動LED非対応のファームです');
    return r[1] !== 0;
  }

  async setLayerLedEnable(enabled: boolean): Promise<void> {
    await this.sendCommand(makePacket(CMD.SET_LAYER_LED_ENABLE, enabled ? 1 : 0));
  }

  // 指定レイヤー(1-7)のLED設定を取得・変更する
  async getLayerLed(layer: number): Promise<LayerLedConfig> {
    const r = await this.sendCommand(makePacket(CMD.GET_LAYER_LED, layer));
    if (r[0] !== CMD.GET_LAYER_LED) throw new Error('レイヤー連動LED非対応のファームです');
    return { enabled: r[2] !== 0, effectId: r[3], hue: r[4], sat: r[5], val: r[6], speed: r[7] };
  }

  async setLayerLed(layer: number, cfg: LayerLedConfig): Promise<void> {
    await this.sendCommand(makePacket(
      CMD.SET_LAYER_LED, layer, cfg.enabled ? 1 : 0, cfg.effectId, cfg.hue, cfg.sat, cfg.val, cfg.speed,
    ));
  }

  async reboot(): Promise<void> {
    // ブートローダーモードへ移行（応答を待たずに送信）
    this.device!.sendReport(0x00, makePacket(CMD.REBOOT) as Uint8Array<ArrayBuffer>).catch(() => {});
  }

  async getTdSlot(idx: number): Promise<TdSlot> {
    const r = await this.sendCommand(makePacket(CMD.GET_TD, idx));
    return {
      tap:   (r[2] << 8) | r[3],
      hold:  (r[4] << 8) | r[5],
      dtap:  (r[6] << 8) | r[7],
      flags: r[8],
    };
  }

  async setTdSlot(idx: number, slot: TdSlot): Promise<void> {
    await this.sendCommand(makePacket(
      CMD.SET_TD, idx,
      (slot.tap  >> 8) & 0xFF, slot.tap  & 0xFF,
      (slot.hold >> 8) & 0xFF, slot.hold & 0xFF,
      (slot.dtap >> 8) & 0xFF, slot.dtap & 0xFF,
      slot.flags,
    ));
  }

  async getSettings(): Promise<KbSettings> {
    const r = await this.sendCommand(makePacket(CMD.GET_SETTINGS));
    const flags = r[3];
    return {
      tappingTerm:    (r[1] << 8) | r[2],
      autoShift:      (flags & KB_FLAG_AUTO_SHIFT)      !== 0,
      permissiveHold: (flags & KB_FLAG_PERMISSIVE_HOLD) !== 0,
      retroTapping:   (flags & KB_FLAG_RETRO_TAPPING)   !== 0,
      scrollInvertV:  (flags & KB_FLAG_SCROLL_INV_V)    !== 0,
      scrollInvertH:  (flags & KB_FLAG_SCROLL_INV_H)    !== 0,
      autoMouseEnable:   (flags & KB_FLAG_AML_DISABLE)  === 0,
      autoMouseLayer:    (r[4] >= 1 && r[4] <= 7) ? r[4] : 1,
      autoMouseTimeout:  (((r[5] << 8) | r[6]) >= 100) ? ((r[5] << 8) | r[6]) : 650,
      autoMouseThreshold: (r[7] >= 1 && r[7] <= 100) ? r[7] : 10,
      scrollLayer:    r[9] === LAYER_NONE ? LAYER_NONE : (r[9] <= 7 ? r[9] : 3),
    };
  }

  async setSettings(s: KbSettings): Promise<void> {
    let flags = 0;
    if (s.autoShift)        flags |= KB_FLAG_AUTO_SHIFT;
    if (s.permissiveHold)   flags |= KB_FLAG_PERMISSIVE_HOLD;
    if (s.retroTapping)     flags |= KB_FLAG_RETRO_TAPPING;
    if (s.scrollInvertV)    flags |= KB_FLAG_SCROLL_INV_V;
    if (s.scrollInvertH)    flags |= KB_FLAG_SCROLL_INV_H;
    if (!s.autoMouseEnable) flags |= KB_FLAG_AML_DISABLE;
    await this.sendCommand(makePacket(
      CMD.SET_SETTINGS,
      (s.tappingTerm >> 8) & 0xFF,
      s.tappingTerm & 0xFF,
      flags,
      s.autoMouseLayer & 0xFF,
      (s.autoMouseTimeout >> 8) & 0xFF,
      s.autoMouseTimeout & 0xFF,
      s.autoMouseThreshold & 0xFF,
      s.scrollLayer & 0xFF,
    ));
  }

  // ジェスチャー設定取得（GESTURE_ENABLE非対応FWでは応答コードが異なるため例外）
  async getGesture(): Promise<GestureConfig> {
    const r = await this.sendCommand(makePacket(CMD.GET_GESTURE));
    if (r[0] !== CMD.GET_GESTURE) throw new Error('ジェスチャー非対応のファームです');
    return {
      up:    (r[1] << 8) | r[2],
      down:  (r[3] << 8) | r[4],
      left:  (r[5] << 8) | r[6],
      right: (r[7] << 8) | r[8],
      tap:   r[10] ?? 0,   // タップキー（旧ファームは0）
      layer: (r[11] !== undefined && r[11] <= 7) ? r[11] : LAYER_NONE,  // ジェスチャーレイヤー（旧ファーム/未設定はなし）
      // しきい値（旧ファームは0のまま届くため範囲外→既定値50に補正）
      thresholdH: (r[12] >= GESTURE_TH_MIN && r[12] <= GESTURE_TH_MAX) ? r[12] : GESTURE_TH_DEFAULT,
      thresholdV: (r[13] >= GESTURE_TH_MIN && r[13] <= GESTURE_TH_MAX) ? r[13] : GESTURE_TH_DEFAULT,
    };
  }

  async setGesture(g: GestureConfig): Promise<void> {
    await this.sendCommand(makePacket(
      CMD.SET_GESTURE,
      (g.up >> 8) & 0xFF,    g.up & 0xFF,
      (g.down >> 8) & 0xFF,  g.down & 0xFF,
      (g.left >> 8) & 0xFF,  g.left & 0xFF,
      (g.right >> 8) & 0xFF, g.right & 0xFF,
      g.tap & 0xFF,
      g.layer & 0xFF,
      g.thresholdH & 0xFF,
      g.thresholdV & 0xFF,
    ));
  }

  // 超低速（精密作業）モードの設定取得・変更（RP2040版など対応ファームのみ。非対応FWでは例外）
  async getPrecisionConfig(): Promise<PrecisionConfig> {
    const r = await this.sendCommand(makePacket(CMD.GET_PRECISION));
    if (r[0] !== CMD.GET_PRECISION) throw new Error('超低速モード非対応のファームです');
    return {
      div:   r[1],
      layer: (r[2] !== undefined && r[2] <= 7) ? r[2] : LAYER_NONE,  // 連動レイヤー（旧応答/未設定はなし）
    };
  }

  async setPrecisionConfig(p: PrecisionConfig): Promise<void> {
    await this.sendCommand(makePacket(CMD.SET_PRECISION, p.div & 0xFF, p.layer & 0xFF));
  }

  // ファームウェアのバージョン取得（GET_VERSION非対応の旧ファームでは例外）
  async getVersion(): Promise<FirmwareVersion> {
    const r = await this.sendCommand(makePacket(CMD.GET_VERSION));
    if (r[0] !== CMD.GET_VERSION) throw new Error('バージョン情報非対応のファームです');
    return { major: r[1], minor: r[2], patch: r[3] };
  }

  async getMatrixState(): Promise<boolean[][]> {
    const r = await this.sendCommand(makePacket(CMD.GET_MATRIX));
    const rows = r[1];
    const matrix: boolean[][] = [];
    for (let row = 0; row < rows; row++) {
      const mask = r[2 + row];
      matrix[row] = Array.from({ length: 8 }, (_, col) => (mask >> col & 1) === 1);
    }
    return matrix;
  }

  async testLed(index: number): Promise<void> {
    // index: 0〜47 = そのLEDをオレンジ点灯, 0xFF = テスト終了
    await this.sendCommand(makePacket(CMD.TEST_LED, index & 0xFF));
  }

  async getAllTdSlots(): Promise<TdSlot[]> {
    const slots: TdSlot[] = [];
    for (let i = 0; i < TD_SLOT_COUNT; i++) {
      slots.push(await this.getTdSlot(i));
    }
    return slots;
  }

  // バッファ全体をEEPROMから読み込む（複数パケット）
  async readMacroBuffer(): Promise<Uint8Array> {
    const buffer = new Uint8Array(MACRO_BUFFER_SIZE);
    for (let offset = 0; offset < MACRO_BUFFER_SIZE; offset += MACRO_CHUNK_SIZE) {
      const r = await this.sendCommand(makePacket(
        CMD.GET_MACRO, (offset >> 8) & 0xFF, offset & 0xFF,
      ));
      if (r[0] !== CMD.GET_MACRO) throw new Error('マクロ非対応のファームです');
      const len = Math.min(MACRO_CHUNK_SIZE, MACRO_BUFFER_SIZE - offset);
      buffer.set(r.slice(3, 3 + len), offset);
    }
    return buffer;
  }

  // バッファ全体をEEPROMに書き込む（複数パケット）
  async writeMacroBuffer(buffer: Uint8Array): Promise<void> {
    for (let offset = 0; offset < MACRO_BUFFER_SIZE; offset += MACRO_CHUNK_SIZE) {
      const len = Math.min(MACRO_CHUNK_SIZE, MACRO_BUFFER_SIZE - offset);
      const chunk = buffer.slice(offset, offset + len);
      const r = await this.sendCommand(makePacket(
        CMD.SET_MACRO,
        (offset >> 8) & 0xFF, offset & 0xFF,
        len,
        ...chunk,
      ));
      if (r[0] !== CMD.SET_MACRO) throw new Error('マクロ非対応のファームです');
    }
  }

  async getAllMacroSlots(): Promise<MacroSlot[]> {
    try {
      const buf = await this.readMacroBuffer();
      return decodeMacroBuffer(buf);
    } catch {
      return Array.from({ length: 10 }, emptyMacroSlot);
    }
  }

  async setMacroSlot(idx: number, slot: MacroSlot, allSlots: MacroSlot[]): Promise<void> {
    const updated = allSlots.map((s, i) => i === idx ? slot : s);
    const buffer = encodeMacroBuffer(updated);
    await this.writeMacroBuffer(buffer);
  }
}

export function isWebHIDSupported(): boolean {
  return typeof navigator !== 'undefined' && 'hid' in navigator;
}
