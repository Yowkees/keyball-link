interface WelcomeGuideProps {
  step: 'click' | 'assign' | 'save' | 'done';
  onDismiss: () => void;
}

const STEPS = [
  {
    id: 'click',
    icon: '👆',
    title: 'キーをクリック',
    desc: '変更したいキーをクリックしてください',
  },
  {
    id: 'assign',
    icon: '🔍',
    title: '新しいキーを選ぶ',
    desc: '一覧から割り当てたいキーを選択します',
  },
  {
    id: 'save',
    icon: '💾',
    title: '保存する',
    desc: '右上の「● 保存する」ボタンで確定します',
  },
] as const;

const STEP_ORDER = ['click', 'assign', 'save', 'done'] as const;

export function WelcomeGuide({ step, onDismiss }: WelcomeGuideProps) {
  const currentIdx = STEP_ORDER.indexOf(step);
  const isDone = step === 'done';

  if (isDone) {
    // 完了アニメーション表示後に自動dismiss
    setTimeout(onDismiss, 2000);
    return (
      <div className="welcome-guide welcome-guide--done">
        <span className="welcome-done-icon">✅</span>
        <span className="welcome-done-text">設定完了！お疲れ様でした</span>
      </div>
    );
  }

  return (
    <div className="welcome-guide">
      <div className="welcome-guide__header">
        <span className="welcome-guide__title">🎉 接続できました！まずここから始めましょう</span>
        <button className="welcome-guide__close" onClick={onDismiss} title="ガイドを閉じる">
          ✕ 閉じる
        </button>
      </div>

      <div className="welcome-steps">
        {STEPS.map((s, i) => {
          const stepIdx = STEP_ORDER.indexOf(s.id as typeof STEP_ORDER[number]);
          const done    = stepIdx < currentIdx;
          const active  = stepIdx === currentIdx;
          return (
            <div
              key={s.id}
              className={`welcome-step ${done ? 'welcome-step--done' : ''} ${active ? 'welcome-step--active' : ''}`}
            >
              <div className="welcome-step__icon">
                {done ? '✅' : s.icon}
              </div>
              <div className="welcome-step__body">
                <div className="welcome-step__num">ステップ {i + 1}</div>
                <div className="welcome-step__title">{s.title}</div>
                <div className="welcome-step__desc">{s.desc}</div>
              </div>
              {i < STEPS.length - 1 && <div className="welcome-step__arrow">→</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
