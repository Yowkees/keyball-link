import { useState, useEffect, useRef, useCallback } from 'react';
import { getKeyDisplayLabel, KEYCODES } from '../../lib/keycodes';
import type { KeyLayout } from '../../lib/keycodes';
import type { MacroSlot, MacroStep } from '../../lib/protocol';
import { MACRO_SLOT_COUNT, MACRO_BUFFER_SIZE } from '../../lib/protocol';
import { browserEventToKeycode } from '../../lib/browserKeymap';

// 1レコーディングセッションの上限（バッファの約1/3を目安）
const MAX_RECORD_STEPS = 40;

interface MacroEditorProps {
  slots: MacroSlot[];
  keyLayout: KeyLayout;
  isConnected: boolean;
  onSave: (idx: number, slot: MacroSlot) => Promise<void>;
}

type EditorState = 'idle' | 'recording' | 'editing';

function StepRow({ step, index, keyLayout, onDelete, onToggleDelay, onChangeDelay, onChangeKey, onToggleHold }: {
  step: MacroStep; index: number; keyLayout: KeyLayout;
  onDelete: () => void; onToggleDelay: () => void;
  onChangeDelay: (ms: number) => void; onChangeKey: (kc: number) => void;
  onToggleHold: () => void;
}) {
  const label = step.keycode ? getKeyDisplayLabel(step.keycode, keyLayout) : '（キーなし）';
  return (
    <div className="mstep">
      {index > 0 && (
        <div className="mstep-delay">
          {step.delayMs > 0 ? (
            <span className="mstep-delay-badge">
              ⏱ {step.delayMs}ms
              <input type="number" className="mstep-delay-input"
                value={step.delayMs} min={0} max={9999} step={50}
                onChange={e => onChangeDelay(Math.max(0, Math.min(9999, Number(e.target.value))))} />
              <button className="mstep-delay-rm" onClick={onToggleDelay} title="遅延を削除">×</button>
            </span>
          ) : (
            <button className="mstep-delay-add" onClick={onToggleDelay} title="遅延を追加">＋ 遅延</button>
          )}
        </div>
      )}
      <div className="mstep-key">
        <span className="mstep-num">{index + 1}</span>
        <select className="mstep-key-select" value={step.keycode}
          onChange={e => onChangeKey(Number(e.target.value))}>
          <option value={0}>（キーなし）</option>
          {KEYCODES.filter(k => k.code <= 0x00FF || (k.code >= 0x0200 && k.code <= 0x02FF)).map(k => (
            <option key={k.code} value={k.code}>
              {getKeyDisplayLabel(k.code, keyLayout)} — {k.short}
            </option>
          ))}
        </select>
        <span className="mstep-key-label">{label}</span>
        <button
          className={`mstep-hold-btn ${step.hold ? 'mstep-hold-btn--on' : ''}`}
          onClick={onToggleHold}
          title={step.hold ? 'マクロキーを押している間ずっと押し続けます' : '押して離します'}
        >
          {step.hold ? '🔒 ホールド' : 'タップ'}
        </button>
        <button className="mstep-delete" onClick={onDelete} title="削除">✕</button>
      </div>
    </div>
  );
}

// バッファの使用量を概算（バイト）
function estimateBufferUsage(slots: MacroSlot[]): number {
  let total = 0;
  for (const slot of slots) {
    for (const step of slot.steps) {
      if (step.keycode === 0) continue;
      if (step.delayMs > 0) total += 3; // DELAY action
      total += 3; // TAP action
    }
    total += 1; // terminator
  }
  return total;
}

export function MacroEditor({ slots, keyLayout, isConnected, onSave }: MacroEditorProps) {
  const [selected, setSelected] = useState(0);
  const [editorState, setEditorState] = useState<EditorState>('idle');
  const [draft, setDraft] = useState<MacroSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const lastKeyTimeRef = useRef<number | null>(null);

  const handleRecordKey = useCallback((e: KeyboardEvent) => {
    e.preventDefault(); e.stopPropagation();
    const kc = browserEventToKeycode(e);
    if (kc === null) return;
    setDraft(prev => {
      if (!prev || prev.steps.length >= MAX_RECORD_STEPS) return prev;
      const now = Date.now();
      const delayMs = lastKeyTimeRef.current !== null
        ? Math.min(9999, Math.round(now - lastKeyTimeRef.current)) : 0;
      lastKeyTimeRef.current = now;
      const newStep: MacroStep = { keycode: kc, delayMs: prev.steps.length === 0 ? 0 : delayMs, hold: false };
      return { steps: [...prev.steps, newStep] };
    });
  }, []);

  useEffect(() => {
    if (editorState === 'recording') {
      window.addEventListener('keydown', handleRecordKey, { capture: true });
      return () => window.removeEventListener('keydown', handleRecordKey, { capture: true });
    }
  }, [editorState, handleRecordKey]);

  const startRecording = () => {
    lastKeyTimeRef.current = null;
    setDraft({ steps: [] });
    setEditorState('recording');
  };

  const stopRecording = () => setEditorState('editing');

  const selectSlot = (idx: number) => {
    setSelected(idx);
    setDraft({ steps: [...(slots[idx]?.steps ?? [])] });
    setEditorState('editing');
  };

  const cancelEdit = () => { setEditorState('idle'); setDraft(null); };

  const updateStep = (i: number, patch: Partial<MacroStep>) => {
    if (!draft) return;
    setDraft({ steps: draft.steps.map((s, idx) => idx === i ? { ...s, ...patch } : s) });
  };

  const deleteStep = (i: number) => {
    if (!draft) return;
    setDraft({ steps: draft.steps.filter((_, idx) => idx !== i) });
  };

  const addStep = () => {
    if (!draft) return;
    setDraft({ steps: [...draft.steps, { keycode: 0x002C, delayMs: 0, hold: false }] });
  };

  const removeAllDelays = () => {
    if (!draft) return;
    setDraft({ steps: draft.steps.map(s => ({ ...s, delayMs: 0 })) });
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await onSave(selected, draft);
      setEditorState('idle');
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const bufferUsed = estimateBufferUsage(
    draft ? slots.map((s, i) => i === selected ? draft : s) : slots
  );
  const bufferPct = Math.min(100, Math.round(bufferUsed / MACRO_BUFFER_SIZE * 100));

  return (
    <div className="macro-editor">
      {!isConnected && (
        <div className="settings-notice">キーボードに接続するとマクロを編集できます。</div>
      )}

      {/* バッファ使用量 */}
      <div className="macro-buffer-bar">
        <span className="macro-buffer-label">バッファ使用量</span>
        <div className="macro-buffer-track">
          <div className="macro-buffer-fill" style={{ width: `${bufferPct}%`, background: bufferPct > 90 ? 'var(--red)' : 'var(--accent)' }} />
        </div>
        <span className="macro-buffer-pct">{bufferUsed} / {MACRO_BUFFER_SIZE} byte ({bufferPct}%)</span>
      </div>

      <div className="macro-layout">
        {/* スロット一覧 */}
        <div className="macro-slot-list">
          {Array.from({ length: MACRO_SLOT_COUNT }, (_, i) => {
            const s = slots[i];
            const hasContent = s && s.steps.length > 0;
            return (
              <button key={i}
                className={`macro-slot-btn ${selected === i && editorState !== 'idle' ? 'macro-slot-btn--active' : ''} ${hasContent ? 'macro-slot-btn--has-data' : ''}`}
                onClick={() => selectSlot(i)}
                disabled={!isConnected || editorState === 'recording'}>
                <span className="macro-slot-id">M{i}</span>
                <span className="macro-slot-preview">
                  {hasContent
                    ? `${s.steps.length}ステップ: ` + s.steps.slice(0, 4).map(st => getKeyDisplayLabel(st.keycode, keyLayout)).join(' → ') + (s.steps.length > 4 ? '…' : '')
                    : '（空）'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 編集パネル */}
        <div className="macro-edit-panel">
          <div className="macro-edit-header">
            <div className="macro-edit-title">Macro {selected}</div>
            <div className="macro-edit-toolbar">
              {editorState === 'idle' && (
                <>
                  <button className="btn btn--primary" onClick={startRecording} disabled={!isConnected}>● 記録開始</button>
                  <button className="btn btn--ghost" onClick={() => selectSlot(selected)} disabled={!isConnected}>✎ 手動編集</button>
                </>
              )}
              {editorState === 'recording' && (
                <button className="btn btn--record-stop" onClick={stopRecording}>■ 記録停止</button>
              )}
              {editorState === 'editing' && (
                <>
                  <button className="btn btn--ghost btn--small" onClick={addStep}>＋ キー追加</button>
                  <button className="btn btn--ghost btn--small" onClick={removeAllDelays} disabled={!draft}>遅延を全削除</button>
                  <button className="btn btn--ghost btn--small" onClick={() => setDraft({ steps: [] })}>全クリア</button>
                </>
              )}
            </div>
          </div>

          {editorState === 'recording' && (
            <div className="macro-recording-indicator">
              <span className="macro-rec-dot">●</span>
              記録中… キーを押してください
              {draft && draft.steps.length > 0 && (
                <span className="macro-rec-count">{draft.steps.length}ステップ記録済み（上限 {MAX_RECORD_STEPS}）</span>
              )}
            </div>
          )}

          {(editorState === 'recording' || editorState === 'editing') && draft && (
            <div className="macro-steps">
              {draft.steps.length === 0 && editorState === 'editing' && (
                <p className="macro-empty-hint">キーがありません。「記録開始」または「＋ キー追加」で登録できます。</p>
              )}
              {draft.steps.map((step, i) =>
                editorState === 'recording' ? (
                  <div key={i} className="mstep-recording">
                    <span className="mstep-num">{i + 1}</span>
                    <span className="mstep-rec-key">{getKeyDisplayLabel(step.keycode, keyLayout)}</span>
                    {i > 0 && step.delayMs > 0 && <span className="mstep-rec-delay">⏱ {step.delayMs}ms</span>}
                  </div>
                ) : (
                  <StepRow key={i} step={step} index={i} keyLayout={keyLayout}
                    onDelete={() => deleteStep(i)}
                    onToggleDelay={() => updateStep(i, { delayMs: step.delayMs > 0 ? 0 : 200 })}
                    onChangeDelay={ms => updateStep(i, { delayMs: ms })}
                    onChangeKey={kc => updateStep(i, { keycode: kc })}
                    onToggleHold={() => updateStep(i, { hold: !step.hold })} />
                )
              )}
            </div>
          )}

          {editorState === 'editing' && (
            <div className="macro-edit-actions">
              <button className="btn btn--primary" onClick={handleSave} disabled={saving || !draft}>
                {saving ? '保存中...' : 'キーボードに保存'}
              </button>
              <button className="btn btn--ghost" onClick={cancelEdit}>キャンセル</button>
            </div>
          )}

          {editorState === 'idle' && (
            <p className="macro-edit-desc">
              スロットを選択して「記録開始」を押し、入力したいキーを順番に押してください。<br />
              記録後に遅延の調整・キーの追加・削除ができます。<br />
              保存後、キーマップで「Macro 0〜9」に割り当てると実行できます。<br />
              ※ バッファ（{MACRO_BUFFER_SIZE}バイト）を全スロットで共有しています。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
