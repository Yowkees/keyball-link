// AVR109 プロトコル（Caterina ブートローダー用）
// Remap (github.com/remap-keys/remap) の WebSerial 実装を参考に作成。
// ライターを毎回取得・解放する方式で DTR リセット後の復帰に対応。

const PAGE_SIZE = 128;

export class AVR109 {
  private port: SerialPort;
  private buffer: number[] = [];
  private readLoopActive = false;

  constructor(port: SerialPort) { this.port = port; }

  async open(): Promise<void> {
    await this.port.open({ baudRate: 57600, flowControl: 'none' });
    this.buffer = [];
    this.readLoopActive = true;
    this.startReadLoop();
  }

  async close(): Promise<void> {
    this.readLoopActive = false;
    if (this.port.readable) {
      try {
        const r = this.port.readable.getReader();
        await r.cancel();
        r.releaseLock();
      } catch { /* ignore */ }
    }
    try { await this.port.close(); } catch { /* ignore */ }
  }

  // バックグラウンドで受信バッファに書き込み続けるループ（Remap 方式）
  private startReadLoop(): void {
    (async () => {
      while (this.readLoopActive) {
        if (!this.port.readable) { await delay(10); continue; }
        const reader = this.port.readable.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (value) this.buffer.push(...Array.from(value));
            if (done) break;
          }
        } catch { /* デバイスが切断されたなど。outer loop で待機して再試行 */ }
        finally {
          try { reader.releaseLock(); } catch { /* ignore */ }
        }
        await delay(10);
      }
    })();
  }

  // バッファに n バイト溜まるまで 1ms ポーリングで待つ（Remap 方式）
  private async readBytes(n: number, timeoutMs = 3000): Promise<number[]> {
    const deadline = Date.now() + timeoutMs;
    while (this.buffer.length < n) {
      if (Date.now() > deadline) throw new Error(`read timeout after ${timeoutMs}ms`);
      await delay(1);
    }
    return this.buffer.splice(0, n);
  }

  // 毎回 writable を確認してライターを取得・解放（Remap 方式）
  private async send(data: number[] | Uint8Array): Promise<void> {
    const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (!this.port.writable) throw new Error('port not writable');
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(buf);
    } finally {
      writer.releaseLock();
    }
  }

  // 同期: 'S'コマンド（Software ID取得）でCaterinaブートローダーを確認
  async sync(waitSec = 10): Promise<string> {
    const deadline = Date.now() + waitSec * 1000;

    while (Date.now() < deadline) {
      if (!this.port.writable) { await delay(100); continue; }

      this.buffer = [];
      try {
        await this.send([0x53]); // 'S' = Software ID
      } catch {
        await delay(100);
        continue;
      }
      try {
        const bytes = await this.readBytes(7, 500);
        const id = bytes.map(b => String.fromCharCode(b)).join('');
        if (id.startsWith('CATERIN') || id.startsWith('LUFA') || id.startsWith('Arduino')) {
          return id;
        }
      } catch {
        // タイムアウト、リトライ
      }
      await delay(100);
    }

    throw new Error(
      'ブートローダーと同期できませんでした。\n\n' +
      '【確認事項】\n' +
      '・ポート選択ダイアログで「ProMicro 5V」を選びましたか？\n' +
      '・ダイアログを開いてからリセットを2回押しましたか？\n\n' +
      '繰り返し失敗する場合は QMK Toolbox をお試しください。\n' +
      'https://github.com/qmk/qmk_toolbox/releases'
    );
  }

  async getSoftwareId(): Promise<string> {
    await this.send([0x53]);
    const bytes = await this.readBytes(7, 3000);
    return bytes.map(b => String.fromCharCode(b)).join('');
  }

  async enterProgramMode(): Promise<void> {
    await this.send([0x50]);
    const b = await this.readBytes(1);
    if (b[0] !== 0x0D) throw new Error(`プログラムモード開始失敗 (0x${b[0].toString(16)})`);
  }

  async chipErase(): Promise<void> {
    await this.send([0x65]);
    const b = await this.readBytes(1, 10000);
    if (b[0] !== 0x0D) throw new Error(`チップ消去失敗 (0x${b[0].toString(16)})`);
  }

  async setAddress(wordAddr: number): Promise<void> {
    await this.send([0x41, (wordAddr >> 8) & 0xFF, wordAddr & 0xFF]);
    const b = await this.readBytes(1);
    if (b[0] !== 0x0D) throw new Error('アドレス設定失敗');
  }

  async writeBlock(data: Uint8Array): Promise<void> {
    const len = data.length;
    await this.send(new Uint8Array([0x42, (len >> 8) & 0xFF, len & 0xFF, 0x46]));
    await this.send(data);
    const b = await this.readBytes(1, 3000);
    if (b[0] !== 0x0D) throw new Error(`ブロック書き込み失敗 (0x${b[0].toString(16)})`);
  }

  async leaveProgramMode(): Promise<void> {
    await this.send([0x4C]);
    const b = await this.readBytes(1);
    if (b[0] !== 0x0D) throw new Error('プログラムモード終了失敗');
  }

  async exitBootloader(): Promise<void> {
    // 0x45 = 'E' (Exit Bootloader)。0x51('Q')は拡張ヒューズビット読み出しの
    // 別コマンドで、ブートローダー終了の意味を持たない（誤って送っていた）。
    await this.send([0x45]);
  }

  async flash(firmware: Uint8Array, onProgress: (pct: number, msg: string) => void): Promise<void> {
    onProgress(0, 'ブートローダー確認中…');
    await this.sync(10);

    onProgress(0, 'プログラムモードへ…');
    await this.enterProgramMode();

    const pages = Math.ceil(firmware.length / PAGE_SIZE);
    for (let page = 0; page < pages; page++) {
      const byteAddr = page * PAGE_SIZE;
      const slice = firmware.slice(byteAddr, byteAddr + PAGE_SIZE);
      const padded = new Uint8Array(PAGE_SIZE).fill(0xFF);
      padded.set(slice);

      await this.setAddress(byteAddr >> 1);
      await this.writeBlock(padded);

      const pct = Math.round(((page + 1) / pages) * 100);
      onProgress(pct, `書き込み中… ${pct}%`);
    }

    await this.leaveProgramMode();
    await this.exitBootloader();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}
