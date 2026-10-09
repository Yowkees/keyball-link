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
  let allSent = false;  // データを最後まで送り終えたか（下のcatch参照）
  try {
    let written = 0;
    for (let offset = 0; offset < firmware.length; offset += CHUNK_SIZE) {
      const chunk = firmware.subarray(offset, offset + CHUNK_SIZE);
      await writable.write(chunk as Uint8Array<ArrayBuffer>);
      written += chunk.length;
      const pct = Math.round((written / firmware.length) * 100);
      onProgress(pct, `書き込み中… ${pct}%`);
    }
    allSent = true;
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
    // 2026-10-09: Chromeは書き込みの最後（close）に安全チェック（Safe Browsing等）をしてから
    // ファイル名を付け替えるが、RP2040のブートローダーはデータを受け取り終えた時点で
    // 書き込み・再起動してドライブが消えるため、チェックが「Failed to perform Safe Browsing
    // check.」「Aborted due to security policy.」などで失敗することがある（書き込み自体は
    // 成功している。本人確認済み）。データを全部送り終えた後のエラーで、ドライブが
    // 消えていれば（＝再起動した）成功とみなす。ドライブが残っていれば本当の失敗。
    if (allSent && (await driveDisappeared(dirHandle))) {
      onProgress(100, '書き込み完了');
      return;
    }
    throw e;
  }
}

// RPI-RP2ドライブが消えたか（ブートローダーが書き込みを終えて再起動したか）を確かめる。
// 消えるまで少し時間がかかることがあるので、最大3秒ほど待つ。
async function driveDisappeared(dirHandle: FileSystemDirectoryHandle): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    try {
      await dirHandle.getFileHandle('INFO_UF2.TXT');
    } catch {
      return true;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}
