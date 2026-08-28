import type { ModelKey } from '../layouts';

// FirmwareFlasher.tsx の BUILTIN_FIRMWARE / BUILTIN_FIRMWARE_LED と対応するキー。
// 例: 'keyball39'（通常版）/ 'keyball39_led'（LED版）
export function flashCountKey(model: ModelKey, ledVersion: boolean): string {
  return ledVersion ? `${model}_led` : model;
}

// 全ファームウェアの書き込み回数（全ユーザー合計）を取得する
export async function fetchFlashCounts(): Promise<Record<string, number>> {
  const res = await fetch('/api/flash-count');
  if (!res.ok) throw new Error(`書き込み回数の取得に失敗: ${res.status}`);
  return res.json();
}

// 書き込み成功時に1件加算する。統計目的の付随処理のため、失敗しても書き込み自体の
// 成否には影響させない（呼び出し側でtry/catchすること）。
export async function reportFlash(key: string): Promise<void> {
  const res = await fetch('/api/flash-count', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) throw new Error(`書き込み回数の加算に失敗: ${res.status}`);
}
