import { useState, useRef, useCallback, useEffect } from 'react';
import type { KeyLayout } from '../../layouts/types';

const KEY_SIZE = 38;
const GAP = 3;
const SPLIT_GAP_PX = 20;
const POLL_DELAY_MS = 60;

function isRight(k: KeyLayout): boolean { return k.id.startsWith('R'); }

interface MatrixTestPanelProps {
  layout: KeyLayout[];
  ballSide: 'left' | 'right';
  onGetMatrix: () => Promise<boolean[][]>;
}

export function MatrixTestPanel({ layout, ballSide, onGetMatrix }: MatrixTestPanelProps) {
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState(1);

  const activeRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // コンテナ幅に合わせて自動スケール
  const visible = layout.filter(k => k.ball !== ballSide);
  const naturalWidth = Math.max(...visible.map(k => {
    const ex = isRight(k) ? SPLIT_GAP_PX : 0;
    return k.x * (KEY_SIZE + GAP) + (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP + ex;
  }));
  const maxY = Math.max(...layout.map(k => k.y)) + 1;
  const naturalHeight = maxY * (KEY_SIZE + GAP) - GAP;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / naturalWidth);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [naturalWidth]);

  const pollLoop = useCallback(async () => {
    while (activeRef.current) {
      try {
        const matrix = await onGetMatrix();
        if (!activeRef.current) break;
        const newPressed = new Set<string>();
        matrix.forEach((cols, row) => {
          cols.forEach((on, col) => { if (on) newPressed.add(`${row}:${col}`); });
        });
        setPressed(newPressed);
        if (newPressed.size > 0) {
          setTouched(prev => {
            const next = new Set(prev);
            newPressed.forEach(k => next.add(k));
            return next;
          });
        }
      } catch {
        // 通信エラーは無視
      }
      await new Promise<void>(r => setTimeout(r, POLL_DELAY_MS));
    }
  }, [onGetMatrix]);

  const startTest = () => {
    activeRef.current = true;
    setActive(true);
    setPressed(new Set());
    setTouched(new Set());
    pollLoop();
  };

  const stopTest = () => {
    activeRef.current = false;
    setActive(false);
    setPressed(new Set());
  };

  useEffect(() => () => { activeRef.current = false; }, []);

  return (
    <div className="led-test-panel">
      <h2 className="settings-card-title">テストマトリクス</h2>

      <div className="led-test-controls">
        {!active ? (
          <button className="btn btn--primary" onClick={startTest}>テスト開始</button>
        ) : (
          <>
            <span className="led-test-index" style={{ color: 'var(--accent)' }}>● テスト中</span>
            <button className="btn btn--ghost" onClick={() => setTouched(new Set())}>ログクリア</button>
            <button className="btn btn--ghost" onClick={stopTest}>終了</button>
          </>
        )}
      </div>

      {!active && (
        <p className="led-test-desc">
          「テスト開始」を押してキーを押すと、押しているキーが緑色でハイライトされます。一度でも押したキーは薄い緑で履歴として残ります。
        </p>
      )}

      {/* wrapRef でコンテナ幅を計測し、内側を transform: scale で拡大 */}
      <div ref={wrapRef} className="matrix-layout-wrap" style={{ height: naturalHeight * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: naturalWidth, height: naturalHeight, position: 'absolute' }}>
          {layout.map(k => {
            if (k.ball === ballSide) return null;
            const ex   = isRight(k) ? SPLIT_GAP_PX : 0;
            const left = k.x * (KEY_SIZE + GAP) + ex;
            const top  = k.y * (KEY_SIZE + GAP);
            const w    = (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP;
            const key  = `${k.row}:${k.col}`;
            const isPressed = pressed.has(key);
            const isTouched = touched.has(key);

            return (
              <div
                key={k.id}
                style={{ position: 'absolute', left, top, width: w, height: KEY_SIZE }}
                className={[
                  'matrix-key',
                  isPressed ? 'matrix-key--pressed' : isTouched ? 'matrix-key--touched' : '',
                  !active   ? 'matrix-key--idle' : '',
                ].filter(Boolean).join(' ')}
                title={`${k.id} (row=${k.row}, col=${k.col})`}
              >
                <span className="matrix-key__label">{k.id}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
