// Intel HEX フォーマットをバイナリに変換する
export function parseIntelHex(hexText: string): Uint8Array {
  const FLASH_SIZE = 32768; // ATmega32U4: 32KB
  const buf = new Uint8Array(FLASH_SIZE).fill(0xFF);
  let extAddr = 0;
  let maxAddr = 0;

  for (const rawLine of hexText.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith(':') || line.length < 11) continue;

    const byteCount  = parseInt(line.slice(1, 3),  16);
    const address    = parseInt(line.slice(3, 7),  16);
    const recordType = parseInt(line.slice(7, 9),  16);

    if (recordType === 0x01) break; // EOF

    if (recordType === 0x04) {
      // Extended Linear Address Record
      extAddr = parseInt(line.slice(9, 13), 16) << 16;
      continue;
    }

    if (recordType === 0x00) {
      // Data Record
      const absAddr = extAddr + address;
      for (let i = 0; i < byteCount; i++) {
        const b = parseInt(line.slice(9 + i * 2, 11 + i * 2), 16);
        if (absAddr + i < FLASH_SIZE) buf[absAddr + i] = b;
      }
      maxAddr = Math.max(maxAddr, absAddr + byteCount);
    }
  }

  // ページサイズ（128B）単位に切り上げ
  const pageSize = 128;
  const trimmed = Math.ceil(maxAddr / pageSize) * pageSize;
  return buf.slice(0, Math.min(trimmed, FLASH_SIZE));
}
