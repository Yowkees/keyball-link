import { useState } from 'react';
import { clampName, NAME_MAX_BYTES } from '../../lib/names';

// レイヤー・ジェスチャーの名前の入力欄（2026-11-04〜）。Enterか、欄の外をクリックした時に保存する。
// 日本語入力の変換中のEnterでは保存しない。長すぎる名前は保存の時に24バイト（日本語8文字）で切る。
// 呼ぶ側は key に今の名前を渡す（保存後やキーボードの切り替えで、入力中の文字を新しい名前に戻すため）。
export function NameInput({ value, placeholder, disabled, onSave }: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onSave: (name: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const tooLong = new TextEncoder().encode(draft).length > NAME_MAX_BYTES;
  const commit = () => {
    const v = clampName(draft.trim());
    setDraft(v);
    if (v !== value) onSave(v);
  };
  return (
    <input
      className={`name-input ${tooLong ? 'name-input--long' : ''}`}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      title={tooLong ? '長すぎます。保存の時に日本語8文字（英数字24文字）までに切ります' : '名前（日本語8文字・英数字24文字まで）。空にすると番号で表示します'}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { setDraft(value); setTimeout(() => (e.target as HTMLInputElement).blur(), 0); }
      }}
    />
  );
}
