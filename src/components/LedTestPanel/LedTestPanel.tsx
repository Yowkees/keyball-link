import { useState } from 'react';
import type { KeyLayout } from '../../layouts/types';

const LED_COUNT = 46;
const KEY_SIZE = 44;
const GAP = 4;
const SPLIT_GAP_PX = 24;

// キーレイアウト上のピクセル座標 ↔ ファームウェア座標 変換定数
// 左側: key.x=0-4, pixel_x = 0 → 236 = fw_x 0 → 100
// 右側: key.x=7-11, pixel_x = 360 → 596 = fw_x 124 → 224
const LEFT_PIX_END   = 4 * (KEY_SIZE + GAP) + KEY_SIZE;  // 236
const RIGHT_PIX_START = 7 * (KEY_SIZE + GAP) + SPLIT_GAP_PX;  // 360
const RIGHT_PIX_END  = 11 * (KEY_SIZE + GAP) + SPLIT_GAP_PX + KEY_SIZE;  // 596
const LAYOUT_ROW_PX  = KEY_SIZE + GAP;  // 48
const FW_Y_MAX = 64;

function isRight(k: KeyLayout): boolean { return k.id.startsWith('R'); }

// ピクセル座標 → ファームウェア座標
function layoutPxToFw(pixX: number, pixY: number, layoutHeight: number): { x: number; y: number } {
  let fwX: number;
  if (pixX <= LEFT_PIX_END) {
    fwX = Math.round(Math.max(0, Math.min(100, (pixX / LEFT_PIX_END) * 100)));
  } else if (pixX >= RIGHT_PIX_START) {
    fwX = Math.round(Math.max(124, Math.min(224,
      ((pixX - RIGHT_PIX_START) / (RIGHT_PIX_END - RIGHT_PIX_START)) * 100 + 124
    )));
  } else {
    // 中央のギャップ部分
    const t = (pixX - LEFT_PIX_END) / (RIGHT_PIX_START - LEFT_PIX_END);
    fwX = Math.round(100 + t * 24);
  }
  const fwY = Math.round(Math.max(0, Math.min(FW_Y_MAX, (pixY / layoutHeight) * FW_Y_MAX)));
  return { x: fwX, y: fwY };
}

// ファームウェア座標 → ピクセル座標
function fwToLayoutPx(fwX: number, fwY: number, layoutHeight: number): { pixX: number; pixY: number } {
  let pixX: number;
  if (fwX <= 100) {
    pixX = (fwX / 100) * LEFT_PIX_END;
  } else if (fwX >= 124) {
    pixX = ((fwX - 124) / 100) * (RIGHT_PIX_END - RIGHT_PIX_START) + RIGHT_PIX_START;
  } else {
    const t = (fwX - 100) / 24;
    pixX = LEFT_PIX_END + t * (RIGHT_PIX_START - LEFT_PIX_END);
  }
  return { pixX, pixY: (fwY / FW_Y_MAX) * layoutHeight };
}

interface LedTestPanelProps {
  layout: KeyLayout[];
  ballSide: 'left' | 'right';
  onTestLed: (index: number) => Promise<void>;
}

type LedEntry =
  | { type: 'key'; keyIndex: number }
  | { type: 'underglow'; x: number; y: number }
  | { type: 'skip' };
type LedMapping = Record<number, LedEntry>;

export function LedTestPanel({ layout, ballSide, onTestLed }: LedTestPanelProps) {
  const [active, setActive]             = useState<number | null>(null);
  const [mapping, setMapping]           = useState<LedMapping>({});
  const [busy, setBusy]                 = useState(false);
  const [done, setDone]                 = useState(false);
  const [copied, setCopied]             = useState(false);
  const [pickingUnderglow, setPickingUnderglow] = useState(false);

  const visible = layout.filter(k => k.ball !== ballSide);
  const maxX = Math.max(...visible.map(k => {
    const ex = isRight(k) ? SPLIT_GAP_PX : 0;
    return k.x * (KEY_SIZE + GAP) + (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP + ex;
  }));
  const maxY = Math.max(...layout.map(k => k.y + 1));
  const layoutHeight = maxY * LAYOUT_ROW_PX;

  const sendLed = async (idx: number | null) => {
    if (busy) return;
    setBusy(true);
    try {
      await onTestLed(idx === null ? 0xFF : idx);
      setActive(idx);
      setPickingUnderglow(false);
    } finally {
      setBusy(false);
    }
  };

  const advance = async (newMapping: LedMapping, currentIdx: number) => {
    const next = currentIdx + 1;
    if (next >= LED_COUNT) {
      await sendLed(null);
      setDone(true);
    } else {
      await sendLed(next);
    }
    setMapping(newMapping);
  };

  const recordKey = async (keyIndex: number) => {
    if (active === null || busy || pickingUnderglow) return;
    await advance({ ...mapping, [active]: { type: 'key', keyIndex } }, active);
  };

  const recordUnderglow = async (x: number, y: number) => {
    if (active === null || busy) return;
    setPickingUnderglow(false);
    await advance({ ...mapping, [active]: { type: 'underglow', x, y } }, active);
  };

  const skipLed = async () => {
    if (active === null || busy) return;
    setPickingUnderglow(false);
    await advance({ ...mapping, [active]: { type: 'skip' } }, active);
  };

  const goBack = async () => {
    if (active === null || active === 0 || busy) return;
    const prev = active - 1;
    const newMapping = { ...mapping };
    delete newMapping[prev];
    setMapping(newMapping);
    setPickingUnderglow(false);
    await sendLed(prev);
  };

  // キーレイアウト上でのクリック → ファームウェア座標に変換して記録
  const handleLayoutBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pickingUnderglow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pixX = e.clientX - rect.left;
    const pixY = e.clientY - rect.top;
    const { x, y } = layoutPxToFw(pixX, pixY, layoutHeight);
    recordUnderglow(x, y);
  };

  const exportData = () => {
    const lines = Array.from({ length: LED_COUNT }, (_, i) => {
      const m = mapping[i];
      if (!m) return `LED ${String(i).padStart(2)}: 未記録`;
      if (m.type === 'skip')       return `LED ${String(i).padStart(2)}: スキップ`;
      if (m.type === 'underglow')  return `LED ${String(i).padStart(2)}: アンダーグロウ (x=${m.x}, y=${m.y})`;
      const k = layout[m.keyIndex];
      return `LED ${String(i).padStart(2)}: ${k.id}  row=${k.row} col=${k.col}`;
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keyToLed: Record<number, number> = {};
  Object.entries(mapping).forEach(([led, entry]) => {
    if (entry.type === 'key') keyToLed[entry.keyIndex] = Number(led);
  });

  const recordedCount = Object.keys(mapping).length;

  // ===== 完了画面 =====
  if (done) {
    return (
      <div className="led-test-panel">
        <h2 className="settings-card-title">LED診断 — 完了</h2>
        <p className="led-test-desc">
          記録が完了しました。「クリップボードにコピー」を押して、チャットにそのまま貼り付けてください。
        </p>
        <button className="btn btn--primary" onClick={exportData}>
          {copied ? 'コピーしました！' : 'クリップボードにコピー'}
        </button>
        <div className="led-mapping-table">
          {Array.from({ length: LED_COUNT }, (_, i) => {
            const m = mapping[i];
            const cls = !m
              ? 'led-map-row--unmapped'
              : m.type === 'key'       ? 'led-map-row--key'
              : m.type === 'underglow' ? 'led-map-row--underglow'
              :                          'led-map-row--skip';
            const label = !m
              ? '未記録'
              : m.type === 'skip'
              ? 'スキップ'
              : m.type === 'underglow'
              ? `アンダーグロウ (x=${m.x}, y=${m.y})`
              : (() => { const k = layout[m.keyIndex]; return `${k.id} (row=${k.row}, col=${k.col})`; })();
            return (
              <div key={i} className={`led-map-row ${cls}`}>
                <span className="led-map-idx">LED {i}</span>
                <span className="led-map-val">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== テスト画面 =====
  // 記録済みアンダーグロウのピクセル位置（参照ドット表示用）
  const recordedUnderglow = Object.entries(mapping)
    .filter(([, e]) => e.type === 'underglow')
    .map(([led, e]) => {
      const entry = e as { type: 'underglow'; x: number; y: number };
      const { pixX, pixY } = fwToLayoutPx(entry.x, entry.y, layoutHeight);
      return { led: Number(led), pixX, pixY, x: entry.x, y: entry.y };
    });

  return (
    <div className="led-test-panel led-test-panel--embedded">
      {active === null ? (
        <>
          <p className="led-test-desc">
            「テスト開始」を押すと LED 0 がオレンジ色で点灯します。
            キーLEDはレイアウト図のキーをクリック、アンダーグロウは「アンダーグロウ位置を指定」を押してからキーとキーの間など実際の位置をクリックしてください。
          </p>
          <button className="btn btn--primary" onClick={() => sendLed(0)} disabled={busy}>
            テスト開始
          </button>
        </>
      ) : (
        <>
          <div className="led-test-controls">
            <span className="led-test-index">LED {active} / {LED_COUNT - 1}</span>
            <span className="led-test-progress">{recordedCount} / {LED_COUNT} 記録済み</span>
            <button className="btn btn--ghost" onClick={goBack} disabled={busy || active === 0}>← 戻る</button>
            <button
              className={`btn ${pickingUnderglow ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setPickingUnderglow(p => !p)}
              disabled={busy}
            >
              {pickingUnderglow ? '▶ 位置をクリック中…' : 'アンダーグロウ位置を指定'}
            </button>
            <button className="btn btn--ghost" onClick={skipLed} disabled={busy}>スキップ</button>
            <button className="btn btn--ghost" onClick={() => sendLed(null)} disabled={busy}>終了</button>
          </div>

          {pickingUnderglow && (
            <p className="led-test-hint">
              光っているアンダーグロウLEDの位置をキーとキーの間などクリックして指定してください
            </p>
          )}
          {!pickingUnderglow && (
            <p className="led-test-hint">点灯したキーをクリック、アンダーグロウの場合は上のボタンを押してください</p>
          )}

          <div className="led-test-layout-wrap">
            <div
              className={pickingUnderglow ? 'led-layout-bg--picking' : ''}
              style={{ position: 'relative', width: maxX, height: layoutHeight }}
              onClick={handleLayoutBgClick}
            >
              {/* キーボタン（アンダーグロウ指定中はポインターイベント無効） */}
              {layout.map((k, i) => {
                const ex     = isRight(k) ? SPLIT_GAP_PX : 0;
                const left   = k.x * (KEY_SIZE + GAP) + ex;
                const top    = k.y * (KEY_SIZE + GAP);
                const width  = (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP;
                const isBall   = k.ball === ballSide;
                const ledNum   = keyToLed[i];
                const isMapped = ledNum !== undefined;
                return (
                  <button
                    key={k.id}
                    style={{
                      position: 'absolute', left, top, width, height: KEY_SIZE,
                      pointerEvents: pickingUnderglow ? 'none' : undefined,
                    }}
                    className={[
                      'led-rec-key',
                      pickingUnderglow ? 'led-rec-key--dim' : '',
                      isMapped ? 'led-rec-key--mapped' : '',
                      isBall   ? 'led-rec-key--ball'   : '',
                    ].join(' ')}
                    onClick={() => !isBall && !pickingUnderglow && recordKey(i)}
                    disabled={busy || isBall || pickingUnderglow}
                    title={isMapped ? `LED ${ledNum}` : k.id}
                  >
                    <span className="led-rec-key__id">{k.id}</span>
                    {isMapped && <span className="led-rec-key__led">{ledNum}</span>}
                  </button>
                );
              })}

              {/* 記録済みアンダーグロウ位置ドット */}
              {recordedUnderglow.map(({ led, pixX, pixY, x, y }) => (
                <div
                  key={led}
                  className="underglow-dot--recorded"
                  style={{ left: pixX - 7, top: pixY - 7 }}
                  title={`LED ${led}: アンダーグロウ (x=${x}, y=${y})`}
                />
              ))}

              {/* アンダーグロウ指定中はクリックオーバーレイを前面に配置 */}
              {pickingUnderglow && (
                <div className="led-layout-overlay" style={{ position: 'absolute', inset: 0 }} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
