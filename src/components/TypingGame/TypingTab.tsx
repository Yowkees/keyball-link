import { useState, type ComponentProps } from 'react';
import { TypingGame } from './TypingGame';
import { SymbolPractice } from './SymbolPractice';

// タイピングゲームのタブ。「記号・数字の練習」（Keyballに慣れるための練習）と、
// 「カードゲーム」（ボール操作と文字入力の行き来）を切り替える（2026-10-29〜）
type Mode = 'symbol' | 'cards';
const MODE_KEY = 'typingTabMode';

export function TypingTab(props: ComponentProps<typeof SymbolPractice>) {
  const [mode, setMode] = useState<Mode>(() => { try { return localStorage.getItem(MODE_KEY) === 'cards' ? 'cards' : 'symbol'; } catch { return 'symbol'; } });
  const choose = (m: Mode) => {
    setMode(m);
    try { localStorage.setItem(MODE_KEY, m); } catch { /* 保存できなくても使える */ }
  };
  return (
    <div className="typing-tab">
      <div className="typing-tab__modes">
        <button type="button" className={`typing-tab__mode ${mode === 'symbol' ? 'typing-tab__mode--on' : ''}`} onClick={() => choose('symbol')}>記号・数字の練習</button>
        <button type="button" className={`typing-tab__mode ${mode === 'cards' ? 'typing-tab__mode--on' : ''}`} onClick={() => choose('cards')}>カードゲーム</button>
      </div>
      {mode === 'symbol' ? <SymbolPractice {...props} /> : <TypingGame />}
    </div>
  );
}
