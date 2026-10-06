import { useState, useEffect, useRef, useCallback } from 'react';
import { getKeyDisplayLabel } from '../../lib/keycodes';
import type { KeyLayout } from '../../lib/keycodes';
import type { MacroSlot, MacroStep } from '../../lib/protocol';
import { MACRO_SLOT_COUNT, MACRO_BUFFER_SIZE } from '../../lib/protocol';
import { browserEventToKeycode, modifierEventToKeycode } from '../../lib/browserKeymap';
import { textToMacro, keycodeToChar, romajiToKana } from '../../lib/textToMacro';
import { TIPS } from '../../lib/tips';
import { KeyConfigModal } from '../KeyConfigModal/KeyConfigModal';

// 1レコーディングセッションの上限（バッファの約1/3を目安）
const MAX_RECORD_STEPS = 40;

// マクロのステップとして選べるキーのグループ（レイヤー切替・RGB・マクロ自身などは
// tap_code16/register_code16では正しく動作しないため候補から除外する）
const MACRO_ALLOWED_GROUPS = [
  '文字', '数字', '記号', 'Shift記号', 'JIS記号', '基本', '矢印', 'F',
  '修飾', '日本語', 'マウス', 'メディア', 'テンキー', 'システム',
];

interface MacroEditorProps {
  slots: MacroSlot[];
  keyLayout: KeyLayout;
  isConnected: boolean;
  onSave: (idx: number, slot: MacroSlot) => Promise<void>;
  bufferSize?: number;  // 接続中機種の実際のマクロバッファ容量（未指定時はMACRO_BUFFER_SIZE。Keyball61は容量が小さい）
}

type EditorState = 'idle' | 'recording' | 'editing';

function StepRow({ step, index, num, count, keyLayout, onDelete, onToggleDelay, onChangeDelay, onChangeKey, onToggleHold, onMove, dragState, setDragState }: {
  step: MacroStep; index: number; num: number; count: number; keyLayout: KeyLayout;
  onDelete: () => void; onToggleDelay: () => void;
  onChangeDelay: (ms: number) => void; onChangeKey: (kc: number) => void;
  onToggleHold: () => void;
  // ステップの並べ替え（2026-10-06〜）。▲▼ボタン、または行をドラッグして入れ替える
  onMove: (from: number, to: number) => void;
  dragState: { from: number; over: number } | null;
  setDragState: (s: { from: number; over: number } | null) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const label = step.keycode ? getKeyDisplayLabel(step.keycode, keyLayout) : '（キーなし）';
  const dragging = dragState?.from === index;
  const dropTarget = dragState && dragState.over === index && dragState.from !== index;
  return (
    <div
      className={`mstep ${dragging ? 'mstep--dragging' : ''} ${dropTarget ? 'mstep--drop' : ''}`}
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragState({ from: index, over: index }); }}
      onDragOver={e => { if (!dragState) return; e.preventDefault(); if (dragState.over !== index) setDragState({ ...dragState, over: index }); }}
      onDrop={e => { e.preventDefault(); if (dragState) onMove(dragState.from, index); setDragState(null); }}
      onDragEnd={() => setDragState(null)}
    >
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
        <span className="mstep-grip" title="ドラッグで並べ替え">⋮⋮</span>
        <span className="mstep-num">{num}</span>
        <button className="mstep-key-btn" onClick={() => setShowPicker(true)}>
          {label.replace('\n', ' / ')}
        </button>
        <button
          className={`mstep-hold-btn ${step.hold ? 'mstep-hold-btn--on' : ''}`}
          onClick={onToggleHold}
          title={step.hold ? 'マクロキーを押している間ずっと押し続けます' : '押して離します'}
        >
          {step.hold ? '🔒 ホールド' : 'タップ'}
        </button>
        <button className="mstep-move" onClick={() => onMove(index, index - 1)} disabled={index === 0} title="1つ上へ">▲</button>
        <button className="mstep-move" onClick={() => onMove(index, index + 1)} disabled={index === count - 1} title="1つ下へ">▼</button>
        <button className="mstep-delete" onClick={onDelete} title="削除">✕</button>
      </div>
      {showPicker && (
        <KeyConfigModal
          currentCode={step.keycode}
          keyLayout={keyLayout}
          hideHold
          allowedGroups={MACRO_ALLOWED_GROUPS}
          onSelect={kc => onChangeKey(kc)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// 「文を追加」で入れた文字の並び（文字になるキーが遅延なしで2つ以上続く部分）を
// 1つのブロックにまとめて表示し、後から文として編集できるようにする（2026-10-06〜）。
// 保存されるのはキーの並びだけなので、読み込み直した後もキーから文を復元してまとめる。
type StepItem = { kind: 'step'; start: number } | { kind: 'text'; start: number; end: number; text: string };

function groupSteps(steps: MacroStep[], layout: KeyLayout): StepItem[] {
  const items: StepItem[] = [];
  let i = 0;
  while (i < steps.length) {
    let j = i;
    let text = '';
    while (j < steps.length) {
      const st = steps[j];
      const ch = st.hold || st.single ? null : keycodeToChar(st.keycode, layout);
      if (ch === null || (j > i && st.delayMs > 0)) break;
      text += ch;
      j++;
    }
    if (j - i >= 2) {
      items.push({ kind: 'text', start: i, end: j, text });
      i = j;
    } else {
      items.push({ kind: 'step', start: i });
      i++;
    }
  }
  return items;
}

function TextBlockRow({ item, index, count, firstStep, onMove, dragState, setDragState, onDelete, onToggleDelay, onChangeDelay, onReplace, onSplit }: {
  item: Extract<StepItem, { kind: 'text' }>; index: number; count: number; firstStep: MacroStep;
  onMove: (from: number, to: number) => void;
  dragState: { from: number; over: number } | null;
  setDragState: (s: { from: number; over: number } | null) => void;
  onDelete: () => void; onToggleDelay: () => void; onChangeDelay: (ms: number) => void;
  onReplace: (text: string) => void;  // 文を書き換える
  onSplit: () => void;                // 1キーずつのステップとして表示する
}) {
  const [editing, setEditing] = useState(false);
  // ローマ字だけでできている文（かなに直すと英字が残らない）は、日本語として表示・編集する
  const kana = romajiToKana(item.text);
  const shown = /[a-zA-Z]/.test(kana) ? item.text : kana;
  const [value, setValue] = useState(shown);
  const dragging = dragState?.from === index;
  const dropTarget = dragState && dragState.over === index && dragState.from !== index;
  return (
    <div
      className={`mstep ${dragging ? 'mstep--dragging' : ''} ${dropTarget ? 'mstep--drop' : ''}`}
      draggable={!editing}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragState({ from: index, over: index }); }}
      onDragOver={e => { if (!dragState) return; e.preventDefault(); if (dragState.over !== index) setDragState({ ...dragState, over: index }); }}
      onDrop={e => { e.preventDefault(); if (dragState) onMove(dragState.from, index); setDragState(null); }}
      onDragEnd={() => setDragState(null)}
    >
      {index > 0 && (
        <div className="mstep-delay">
          {firstStep.delayMs > 0 ? (
            <span className="mstep-delay-badge">
              ⏱ {firstStep.delayMs}ms
              <input type="number" className="mstep-delay-input"
                value={firstStep.delayMs} min={0} max={9999} step={50}
                onChange={e => onChangeDelay(Math.max(0, Math.min(9999, Number(e.target.value))))} />
              <button className="mstep-delay-rm" onClick={onToggleDelay} title="遅延を削除">×</button>
            </span>
          ) : (
            <button className="mstep-delay-add" onClick={onToggleDelay} title="遅延を追加">＋ 遅延</button>
          )}
        </div>
      )}
      <div className="mstep-key">
        <span className="mstep-grip" title="ドラッグで並べ替え">⋮⋮</span>
        <span className="mstep-num">{item.start + 1}〜{item.end}</span>
        <span className="mstep-text-badge">文</span>
        <button className="mstep-key-btn mstep-text" onClick={() => { setValue(shown); setEditing(true); }} title={shown === item.text ? 'クリックして文を編集' : `実際に打つキー: ${item.text}（クリックして文を編集）`}>
          {shown.replace(/\n/g, '⏎')}
        </button>
        <button className="mstep-hold-btn" onClick={onSplit} title="1キーずつのステップに分けて表示">分ける</button>
        <button className="mstep-move" onClick={() => onMove(index, index - 1)} disabled={index === 0} title="1つ上へ">▲</button>
        <button className="mstep-move" onClick={() => onMove(index, index + 1)} disabled={index === count - 1} title="1つ下へ">▼</button>
        <button className="mstep-delete" onClick={onDelete} title="削除">✕</button>
      </div>
      {editing && (
        <div className="macro-text-panel" style={{ marginTop: 8, marginBottom: 0 }}>
          <textarea className="macro-text-input" rows={2} autoFocus value={value} onChange={e => setValue(e.target.value)} />
          <div className="macro-text-actions">
            <button className="btn btn--primary btn--small" onClick={() => { onReplace(value); setEditing(false); }} disabled={!value}>反映</button>
            <button className="btn btn--ghost btn--small" onClick={() => setValue(romajiToKana(value))}
              title="ローマ字で保存されている日本語を、かなに戻して表示します（英単語もかなになるので注意）">ローマ字をかなに戻す</button>
            <button className="btn btn--ghost btn--small" onClick={() => setEditing(false)}>キャンセル</button>
          </div>
        </div>
      )}
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

export function MacroEditor({ slots, keyLayout, isConnected, onSave, bufferSize = MACRO_BUFFER_SIZE }: MacroEditorProps) {
  const [selected, setSelected] = useState(0);
  const [editorState, setEditorState] = useState<EditorState>('idle');
  const [draft, setDraft] = useState<MacroSlot | null>(null);
  const [saving, setSaving] = useState(false);
  // 「文を登録」の入力欄（2026-10-06〜）。開いている間だけ表示する
  const [textOpen, setTextOpen] = useState(false);
  const [text, setText] = useState('');
  const lastKeyTimeRef = useRef<number | null>(null);

  // 修飾キー（Ctrl等）を押してから、他のキーを押さずに離した時だけ修飾キー単体として記録する。
  // 他のキーと同時に押した場合は、そのキーと合わせて「Ctrl+A」のような1ステップになる。
  const pendingModRef = useRef<{ code: string; kc: number } | null>(null);

  const addRecordedStep = useCallback((kc: number) => {
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

  const handleRecordKey = useCallback((e: KeyboardEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.repeat) return;
    const mod = modifierEventToKeycode(e);
    if (mod !== null) {
      pendingModRef.current = { code: e.code, kc: mod };
      return;
    }
    pendingModRef.current = null;  // 他のキーと組み合わせたので単体では記録しない
    const kc = browserEventToKeycode(e);
    if (kc === null) return;
    addRecordedStep(kc);
  }, [addRecordedStep]);

  // keyupも横取りする。以前はkeydownだけを止めていたため、記録開始ボタンにフォーカスが
  // 残ったままSpaceを押すと、keyupでボタンが押されて記録が止まり「Spaceが反応しない」
  // ように見えていた（2026-10-06、本人報告）。
  const handleRecordKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault(); e.stopPropagation();
    const pending = pendingModRef.current;
    if (pending && pending.code === e.code) {
      pendingModRef.current = null;
      addRecordedStep(pending.kc);
    }
  }, [addRecordedStep]);

  useEffect(() => {
    if (editorState === 'recording') {
      window.addEventListener('keydown', handleRecordKey, { capture: true });
      window.addEventListener('keyup', handleRecordKeyUp, { capture: true });
      return () => {
        window.removeEventListener('keydown', handleRecordKey, { capture: true });
        window.removeEventListener('keyup', handleRecordKeyUp, { capture: true });
      };
    }
  }, [editorState, handleRecordKey, handleRecordKeyUp]);

  const startRecording = () => {
    lastKeyTimeRef.current = null;
    pendingModRef.current = null;
    // ボタンにフォーカスが残っているとSpace/Enterでボタンが押されてしまうので外す
    (document.activeElement as HTMLElement | null)?.blur();
    setDraft({ steps: [] });
    setEditorState('recording');
  };

  const stopRecording = () => setEditorState('editing');

  const selectSlot = (idx: number) => {
    setSelected(idx);
    setDraft({ steps: [...(slots[idx]?.steps ?? [])] });
    setEditorState('editing');
  };

  // 左のスロット一覧をクリックしたときは、いきなり手動編集にはせず
  // 「記録開始」「手動編集」を選べる画面（idle状態）を表示する
  const pickSlot = (idx: number) => {
    setSelected(idx);
    setEditorState('idle');
    setDraft(null);
  };

  const cancelEdit = () => { setEditorState('idle'); setDraft(null); setTextOpen(false); setSplitAll(false); };

  const textResult = text ? textToMacro(text, keyLayout) : null;
  const addText = () => {
    if (!draft || !textResult || textResult.steps.length === 0) return;
    setDraft({ steps: [...draft.steps, ...textResult.steps] });
    setText('');
    setTextOpen(false);
  };
  const openTextFromIdle = () => {
    selectSlot(selected);
    setTextOpen(true);
  };

  const updateStep = (i: number, patch: Partial<MacroStep>) => {
    if (!draft) return;
    setDraft({ steps: draft.steps.map((s, idx) => idx === i ? { ...s, ...patch } : s) });
  };

  // 並べ替え（キー1つ、または「文」のまとまり単位）。遅延は「そのキーの前に待つ時間」なので
  // キーと一緒に動く。先頭になったステップの遅延は表示されない（記録時と同じく0にする）。
  // 「分ける」を押すと、文のまとまりを解いて全ステップを1キーずつ表示する（並べ替えても維持）。
  const [dragState, setDragState] = useState<{ from: number; over: number } | null>(null);
  const [splitAll, setSplitAll] = useState(false);
  const items: StepItem[] = !draft ? []
    : splitAll ? draft.steps.map((_, k) => ({ kind: 'step' as const, start: k }))
    : groupSteps(draft.steps, keyLayout);
  const itemRange = (it: StepItem): [number, number] => it.kind === 'text' ? [it.start, it.end] : [it.start, it.start + 1];
  const moveItem = (from: number, to: number) => {
    if (!draft || from === to || to < 0 || to >= items.length) return;
    const chunks = items.map(it => { const [a2, b2] = itemRange(it); return draft.steps.slice(a2, b2); });
    const [moved] = chunks.splice(from, 1);
    chunks.splice(to, 0, moved);
    const steps = chunks.flat();
    if (steps[0].delayMs > 0) steps[0] = { ...steps[0], delayMs: 0 };
    setDraft({ steps });
  };
  const replaceRange = (start: number, end: number, newSteps: MacroStep[]) => {
    if (!draft) return;
    const steps = [...draft.steps.slice(0, start), ...newSteps, ...draft.steps.slice(end)];
    setDraft({ steps });
  };
  const replaceText = (it: Extract<StepItem, { kind: 'text' }>, newText: string) => {
    if (!draft) return;
    const conv = textToMacro(newText, keyLayout).steps;
    if (conv.length === 0) return;
    conv[0] = { ...conv[0], delayMs: draft.steps[it.start].delayMs };  // 文の前の遅延は残す
    replaceRange(it.start, it.end, conv);
  };

  const deleteStep = (i: number) => {
    if (!draft) return;
    setDraft({ steps: draft.steps.filter((_, idx) => idx !== i) });
  };

  // 「＋ キー追加」: キー選択画面を開き、選んだキーを1ステップとして末尾に足す。
  // 以前は仮のキー（Space）を足していたため、直前の「文」にくっついて文字数が増えて見えていた。
  const [addPicker, setAddPicker] = useState(false);
  const addStep = () => { if (draft) setAddPicker(true); };
  const addPickedKey = (kc: number) => {
    setAddPicker(false);
    if (!draft || !kc) return;
    setDraft({ steps: [...draft.steps, { keycode: kc, delayMs: 0, hold: false, single: true }] });
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
    } catch (e) {
      alert(`マクロの保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const bufferUsed = estimateBufferUsage(
    draft ? slots.map((s, i) => i === selected ? draft : s) : slots
  );
  const bufferPct = Math.min(100, Math.round(bufferUsed / bufferSize * 100));
  const overCapacity = bufferUsed > bufferSize;

  return (
    <div className="macro-editor">
      {!isConnected && (
        <div className="settings-notice">キーボードに接続するとマクロを編集できます。</div>
      )}

      {/* バッファ使用量 */}
      <div className="macro-buffer-bar">
        <span className="macro-buffer-label" data-tip={TIPS.macroBuffer}>バッファ使用量</span>
        <div className="macro-buffer-track">
          <div className="macro-buffer-fill" style={{ width: `${bufferPct}%`, background: bufferPct > 90 ? 'var(--red)' : 'var(--accent)' }} />
        </div>
        <span className="macro-buffer-pct">{bufferUsed} / {bufferSize} byte ({bufferPct}%)</span>
      </div>

      <div className="macro-layout">
        {/* スロット一覧 */}
        <div className="macro-slot-list">
          {Array.from({ length: MACRO_SLOT_COUNT }, (_, i) => {
            const s = slots[i];
            const hasContent = s && s.steps.length > 0;
            return (
              <button key={i}
                className={`macro-slot-btn ${selected === i ? 'macro-slot-btn--active' : ''} ${hasContent ? 'macro-slot-btn--has-data' : ''}`}
                onClick={() => pickSlot(i)}
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
                  <button className="btn btn--ghost" onClick={openTextFromIdle} disabled={!isConnected}>Aa 文を登録</button>
                </>
              )}
              {editorState === 'recording' && (
                <button className="btn btn--record-stop" onClick={stopRecording}>■ 記録停止</button>
              )}
              {editorState === 'editing' && (
                <>
                  <button className="btn btn--ghost btn--small" onClick={addStep}>＋ キー追加</button>
                  <button className="btn btn--ghost btn--small" onClick={() => setTextOpen(o => !o)}>＋ 文を追加</button>
                  {splitAll && (
                    <button className="btn btn--ghost btn--small" onClick={() => setSplitAll(false)} title="続けて打つ文字を「文」としてまとめて表示します">文をまとめる</button>
                  )}
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

          {addPicker && (
            <KeyConfigModal
              keyIndex={-1}
              currentCode={0}
              keyLayout={keyLayout}
              hideHold
              allowedGroups={MACRO_ALLOWED_GROUPS}
              onSelect={addPickedKey}
              onClose={() => setAddPicker(false)}
            />
          )}

          {editorState === 'editing' && textOpen && (
            <div className="macro-text-panel">
              <textarea
                className="macro-text-input"
                rows={3}
                autoFocus
                placeholder="登録したい文を入力（例: Thank you! / よろしくおねがいします）"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              {textResult && (
                <div className="macro-text-info">
                  {textResult.hasJapanese && (
                    <p>日本語はローマ字で送ります: <code>{textResult.romaji}</code><br />
                      送る側のPCで日本語入力をONにしておくと、ひらがなで入力されます（漢字には変換されません）。</p>
                  )}
                  {textResult.unsupported.length > 0 && (
                    <p style={{ color: 'var(--red)' }}>送れない文字があります（漢字など）: {textResult.unsupported.join(' ')}</p>
                  )}
                  <p>{textResult.steps.length}ステップ（約{textResult.steps.length * 3}バイト）を追加します。</p>
                </div>
              )}
              <div className="macro-text-actions">
                <button className="btn btn--primary btn--small" onClick={addText} disabled={!textResult || textResult.steps.length === 0}>ステップに追加</button>
                <button className="btn btn--ghost btn--small" onClick={() => { setTextOpen(false); setText(''); }}>閉じる</button>
              </div>
            </div>
          )}

          {(editorState === 'recording' || editorState === 'editing') && draft && (
            <div className="macro-steps">
              {draft.steps.length === 0 && editorState === 'editing' && (
                <p className="macro-empty-hint">キーがありません。「記録開始」または「＋ キー追加」で登録できます。</p>
              )}
              {editorState === 'editing' && items.map((it, idx) => {
                if (it.kind === 'text') {
                  return (
                    <TextBlockRow key={`t${it.start}-${it.end}`} item={it} index={idx} count={items.length} firstStep={draft.steps[it.start]}
                      onMove={moveItem} dragState={dragState} setDragState={setDragState}
                      onDelete={() => replaceRange(it.start, it.end, [])}
                      onToggleDelay={() => updateStep(it.start, { delayMs: draft.steps[it.start].delayMs > 0 ? 0 : 200 })}
                      onChangeDelay={ms => updateStep(it.start, { delayMs: ms })}
                      onReplace={t => replaceText(it, t)}
                      onSplit={() => setSplitAll(true)} />
                  );
                }
                const i = it.start;
                const step = draft.steps[i];
                return (
                  <StepRow key={i} step={step} index={idx} num={i + 1} count={items.length} keyLayout={keyLayout}
                    onMove={moveItem} dragState={dragState} setDragState={setDragState}
                    onDelete={() => deleteStep(i)}
                    onToggleDelay={() => updateStep(i, { delayMs: step.delayMs > 0 ? 0 : 200 })}
                    onChangeDelay={ms => updateStep(i, { delayMs: ms })}
                    onChangeKey={kc => updateStep(i, { keycode: kc })}
                    onToggleHold={() => updateStep(i, { hold: !step.hold })} />
                );
              })}
              {editorState === 'recording' && draft.steps.map((step, i) =>
                (
                  <div key={i} className="mstep-recording">
                    <span className="mstep-num">{i + 1}</span>
                    <span className="mstep-rec-key">{getKeyDisplayLabel(step.keycode, keyLayout)}</span>
                    {i > 0 && step.delayMs > 0 && <span className="mstep-rec-delay">⏱ {step.delayMs}ms</span>}
                  </div>
                )
              )}
            </div>
          )}

          {editorState === 'editing' && (
            <div className="macro-edit-actions">
              {overCapacity && (
                <p className="macro-edit-desc" style={{ color: 'var(--red)' }}>
                  バッファ容量を超えています。ステップを減らすか、他のスロットのマクロを削除してください。
                </p>
              )}
              <button className="btn btn--primary" onClick={handleSave} disabled={saving || !draft || overCapacity}>
                {saving ? '保存中...' : 'キーボードに保存'}
              </button>
              <button className="btn btn--ghost" onClick={cancelEdit}>キャンセル</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
