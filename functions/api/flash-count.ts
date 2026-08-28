// ファームウェア種別ごとの「書き込まれた回数」（全ユーザー合計）を保存・返却するAPI。
// Cloudflare PagesのFunctions機能で動く。カウントの実体はKVネームスペース（FLASH_COUNTS）。
//
// @cloudflare/workers-types を依存に追加していないため、必要な型だけ最小限で自前定義する。
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  FLASH_COUNTS: KVNamespace;
}

// FirmwareFlasher.tsx の BUILTIN_FIRMWARE / BUILTIN_FIRMWARE_LED と一致させること
const VALID_KEYS = [
  'keyball39', 'keyball39_led',
  'keyball44', 'keyball44_led',
  'keyball61', 'keyball61_led',
  'keyballplus', 'keyballplus_led',
];

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const counts: Record<string, number> = {};
  for (const key of VALID_KEYS) {
    const v = await context.env.FLASH_COUNTS.get(key);
    counts[key] = v ? parseInt(v, 10) : 0;
  }
  return Response.json(counts);
}

// 注意: KVのget→putは原子的ではないため、ごく短時間に同じキーへの書き込みが
// 複数同時に発生すると加算が1回分失われることがある。書き込み操作は頻繁ではない
// ため、統計目的としてはこの誤差は許容している。
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const body = (await context.request.json().catch(() => null)) as { key?: string } | null;
  const key = body?.key;
  if (!key || !VALID_KEYS.includes(key)) {
    return new Response('invalid key', { status: 400 });
  }
  const current = await context.env.FLASH_COUNTS.get(key);
  const next = (current ? parseInt(current, 10) : 0) + 1;
  await context.env.FLASH_COUNTS.put(key, String(next));
  return Response.json({ key, count: next });
}
