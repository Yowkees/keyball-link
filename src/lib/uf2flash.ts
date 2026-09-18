// RP2040（SparkFun Pro Micro RP2040）のUF2ブートローダーへの書き込み。
// AVR109と違い、ページプログラミングのようなプロトコルは無く、
// ブートローダーがUSBメモリ「RPI-RP2」としてマウントされた先へ.uf2ファイルを
// 書き込む（=ファイルをクローズした瞬間）と、RP2040側が自動で書き込み・再起動する。

// TSの標準DOM libにはFileSystemDirectoryHandle等のハンドル型はあるが、
// window.showDirectoryPicker()自体の型定義が無いため最小限を自前で補う。
declare global {
  interface Window {
    showDirectoryPicker?(options?: { id?: string; mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

// 選んだフォルダが本当にRPI-RP2ドライブか確認する（RP2040のUF2ブートローダーは
// 必ずルートにINFO_UF2.TXTを置くため、これの有無で判定できる）。
export async function verifyUf2Drive(dirHandle: FileSystemDirectoryHandle): Promise<void> {
  try {
    await dirHandle.getFileHandle('INFO_UF2.TXT');
  } catch {
    throw new Error(
      '「RPI-RP2」という名前のドライブが見つかりません。\n\n' +
      '・フォルダ選択ダイアログで「RPI-RP2」を選びましたか？\n' +
      '・すでにKeyball Linkのファームウェアが入っている場合は、リセットボタンを' +
      '素早く2回押すとブートローダーモードになります。\n' +
      '・初めて書き込む場合は、BOOTSELボタンを押しながらUSBケーブルを挿し直してください。'
    );
  }
}

// firmwareの内容をdirHandle直下に書き込む。チャンク分割は進捗表示のため
// （UF2ファイルは小さく一括書き込みでも一瞬で終わるが、AVR版と同様に
// 進捗バーが動くようにしている）。
export async function flashUf2(
  dirHandle: FileSystemDirectoryHandle,
  firmware: Uint8Array,
  onProgress: (pct: number, msg: string) => void,
  fileName = 'firmware.uf2'
): Promise<void> {
  onProgress(0, 'ドライブを確認中…');
  await verifyUf2Drive(dirHandle);

  onProgress(0, '書き込み準備中…');
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  const CHUNK_SIZE = 4096;
  try {
    let written = 0;
    for (let offset = 0; offset < firmware.length; offset += CHUNK_SIZE) {
      const chunk = firmware.subarray(offset, offset + CHUNK_SIZE);
      await writable.write(chunk as Uint8Array<ArrayBuffer>);
      written += chunk.length;
      const pct = Math.round((written / firmware.length) * 100);
      onProgress(pct, `書き込み中… ${pct}%`);
    }
    onProgress(100, '書き込み完了処理中…');
    // closeした瞬間にRP2040のブートローダーが完全なUF2ファイルを検知し、
    // 自動的にフラッシュへ書き込んで再起動する。
    await writable.close();
  } catch (e) {
    try {
      await writable.abort();
    } catch {
      // 中断処理自体の失敗は元のエラーを覆い隠さないよう無視する
    }
    throw e;
  }
}
