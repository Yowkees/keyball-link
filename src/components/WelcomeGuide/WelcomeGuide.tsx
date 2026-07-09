import { useEffect, useState, type CSSProperties } from 'react';

export type GuideStep =
  | 'flash' | 'connect' | 'click' | 'assign'
  | 'mods' | 'layers' | 'save' | 'trackball' | 'done'
  | 'backToKeymap';  // キーマップタブ以外にいるときの誘導（擬似ステップ）

interface WelcomeGuideProps {
  step: GuideStep;
  onDismiss: () => void;
  onNext?: () => void;  // 「次へ」で手動進行するステップ用
}

const STEP_ORDER: GuideStep[] = ['flash', 'connect', 'click', 'assign', 'mods', 'layers', 'save', 'trackball', 'done'];

interface StepDef {
  title: string;
  desc: string;
  targets: string[];   // 吹き出しを付ける対象（先頭から順に探し、見つかった要素に付ける）
  manual?: boolean;    // trueなら「次へ」ボタンで進行
}

const STEP_DEFS: Partial<Record<GuideStep, StepDef>> = {
  flash: {
    title: 'ファームウェアを書き込む',
    desc: 'この「ファームウェア」タブから専用ファームウェアを書き込みます（初回のみ）。書き込みが済んだら「次へ」を押してください。',
    targets: ['[data-guide="firmware-tab"]'],
    manual: true,
  },
  connect: {
    title: 'キーボードに接続',
    desc: 'このボタンを押して、一覧から Keyball を選んでください。',
    targets: ['[data-guide="connect-btn"]'],
  },
  click: {
    title: 'キーをクリック',
    desc: '変更したいキーをクリックしてください。設定画面が開きます。',
    targets: ['[data-guide="keyboard"]'],
  },
  assign: {
    title: '新しいキーを選ぶ',
    desc: 'この一覧から割り当てたいキーをクリックすると、選んだキーに設定されます。',
    targets: ['[data-guide="key-picker"]', '[data-guide="keyboard"]'],
  },
  mods: {
    title: '修飾キーとホールド',
    desc: 'キー設定画面の「ホールド」タブでは、タップ＝通常キー／長押し＝Shift・Ctrl やレイヤー切替、という1キー2役の設定ができます。',
    targets: ['[data-guide="hold-tab"]', '[data-guide="keyboard"]'],
    manual: true,
  },
  layers: {
    title: 'レイヤー',
    desc: 'レイヤーはキーマップの切り替えページです。MO(1) などの切替キーを押している間だけ別の配列になります。このタブで各レイヤーを編集できます。',
    targets: ['[data-guide="layer-tabs"]'],
    manual: true,
  },
  save: {
    title: '保存する',
    desc: 'このボタンを押して、設定をキーボード本体に保存しましょう。',
    targets: ['[data-guide="save-btn"]'],
  },
  trackball: {
    title: 'トラックボール設定',
    desc: 'ここでカーソル速度（CPI）・スクロール・自動マウスレイヤーなどを調整できます。以上で基本の使い方は終わりです！',
    targets: ['[data-guide="trackball-card"]'],
    manual: true,
  },
  backToKeymap: {
    title: 'キーマップに戻る',
    desc: '「キーマップ」タブをクリックして、続きの設定に進みましょう。',
    targets: ['[data-guide="keymap-tab"]'],
  },
};

interface Rect { top: number; left: number; width: number; height: number; bottom: number }

function findTargetRect(selectors: string[]): Rect | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom };
      }
    }
  }
  return null;
}

const BUBBLE_W = 320;

export function WelcomeGuide({ step, onDismiss, onNext }: WelcomeGuideProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const def = STEP_DEFS[step];

  // 対象要素の位置を追跡（モーダルの開閉・リサイズ・スクロールに追従）
  useEffect(() => {
    if (!def) return;
    let prevKey = '';
    const update = () => {
      const r = findTargetRect(def.targets);
      const key = r ? [r.top, r.left, r.width, r.height].map(Math.round).join(',') : 'none';
      if (key !== prevKey) { prevKey = key; setRect(r); }
    };
    update();
    const timer = setInterval(update, 300);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [def]);

  // 完了表示は少し見せてから自動で閉じる
  useEffect(() => {
    if (step !== 'done') return;
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [step, onDismiss]);

  if (step === 'done') {
    return <div className="guide-done">設定完了！お疲れ様でした</div>;
  }
  if (!def) return null;

  const idx = STEP_ORDER.indexOf(step);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let bubbleStyle: CSSProperties = {};
  let arrow: { style: CSSProperties; dir: 'below' | 'above' } | null = null;
  let highlight: CSSProperties | null = null;

  if (rect) {
    const below = rect.bottom + 180 < vh;
    const above = !below && rect.top > 180;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - BUBBLE_W / 2, 12), Math.max(vw - BUBBLE_W - 12, 12));
    if (below || above) {
      bubbleStyle = below
        ? { top: rect.bottom + 14, left }
        : { top: rect.top - 14, left, transform: 'translateY(-100%)' };
      const arrowLeft = Math.min(Math.max(rect.left + rect.width / 2 - 6, left + 14), left + BUBBLE_W - 26);
      arrow = below
        ? { style: { top: rect.bottom + 8, left: arrowLeft }, dir: 'below' }
        : { style: { top: rect.top - 20, left: arrowLeft }, dir: 'above' };
    }
    // 上下どちらにも入らない（対象が画面いっぱい等）場合は画面下部中央に表示（bubbleStyle空のまま）
    highlight = { top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 };
  }

  return (
    <>
      {highlight && <div className="guide-highlight" style={highlight} />}
      {arrow && <div className={`guide-arrow guide-arrow--${arrow.dir}`} style={arrow.style} />}
      <div className={`guide-tooltip ${arrow ? '' : 'guide-tooltip--floating'}`} style={bubbleStyle}>
        <div className="guide-tooltip__head">
          <span className="guide-tooltip__step">
            {idx >= 0 ? `ステップ ${idx + 1} / ${STEP_ORDER.length - 1}` : 'チュートリアル'}
          </span>
          <button className="guide-tooltip__close" onClick={onDismiss}>✕ 閉じる</button>
        </div>
        <div className="guide-tooltip__title">{def.title}</div>
        <div className="guide-tooltip__desc">{def.desc}</div>
        {onNext && (
          <div className="guide-tooltip__actions">
            <button className="btn btn--primary btn--small" onClick={onNext}>
              {step === 'trackball' ? '完了' : '次へ'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
