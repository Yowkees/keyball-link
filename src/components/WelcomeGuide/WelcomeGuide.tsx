import { useEffect, useState, type CSSProperties } from 'react';

export type GuideStep =
  | 'flash' | 'connect' | 'click' | 'assign'
  | 'mods' | 'layers' | 'save' | 'trackball' | 'others' | 'done'
  | 'backToKeymap';  // キーマップタブ以外にいるときの誘導（擬似ステップ）

interface WelcomeGuideProps {
  step: GuideStep;
  onDismiss: () => void;
  onNext?: () => void;  // 「次へ」で手動進行するステップ用
}

const STEP_ORDER: GuideStep[] = ['flash', 'connect', 'click', 'assign', 'mods', 'layers', 'save', 'trackball', 'others', 'done'];

interface StepDef {
  title: string;
  desc: string;
  targets: string[];   // 吹き出しを付ける対象（先頭から順に探し、見つかった要素に付ける）
  manual?: boolean;    // trueなら「次へ」ボタンで進行
}

// 2026-10-20: 画面の作り直し（キー設定の右パネル化・設定タブの左サイドバー化・ファームウェア
// タブの①②手順化など）に合わせて文言と指す場所を更新（本人依頼）。
const STEP_DEFS: Partial<Record<GuideStep, StepDef>> = {
  flash: {
    title: 'ファームウェアを書き込む（初回のみ）',
    desc: 'Keyball Linkを使うには、専用のファームウェアが必要です。購入時のファームウェア（Remap用）のままでは接続できません。「ファームウェア」タブを開き、①で機種・チップ（AVR/RP2040）・内蔵ファームウェアを選んで、②「書き込む」を押します（左右それぞれ）。もう書き込み済みなら「次へ」を押してください。',
    // ファームウェアタブを開いている時は書き込みの手順のカード、それ以外はタブ見出しを指す
    targets: ['[data-guide="firmware-panel"] [data-card="flash"]', '[data-guide="firmware-tab"]'],
    manual: true,
  },
  connect: {
    title: 'キーボードに接続',
    desc: 'キーボードをUSBでつないでから、このボタンを押し、一覧から Keyball を選んで「接続」を押してください。',
    targets: ['[data-guide="connect-btn"]'],
  },
  click: {
    title: 'キーをクリック',
    desc: '変更したいキーをクリックしてください。右側のキー設定パネルに、割り当てられるキーの一覧が出ます。',
    targets: ['[data-guide="keyboard"]'],
  },
  assign: {
    title: '新しいキーを選ぶ',
    desc: '右側の一覧から割り当てたいキーをクリックすると、選んだキーにすぐ設定されます。',
    targets: ['[data-guide="key-picker"]', '[data-guide="keyboard"]'],
  },
  mods: {
    title: '修飾キーとホールド',
    desc: '右側のキー設定パネルの「ホールド」タブでは、タップ＝通常キー／長押し＝Shift・Ctrl やレイヤー切替、という1キー2役の設定ができます。',
    targets: ['[data-guide="hold-tab"]', '[data-guide="keyboard"]'],
    manual: true,
  },
  layers: {
    title: 'レイヤー',
    desc: 'レイヤーはキー配列の切り替えページです。MO(1) などの切替キーを押している間だけ別の配列になります。ここで編集するレイヤーを選べます。「全レイヤー」で全部を並べて見比べたり、ドラッグで並べ替えたりもできます。',
    targets: ['[data-guide="layer-tabs"]'],
    manual: true,
  },
  save: {
    title: '保存する',
    desc: 'このボタンを押して、設定をキーボード本体に保存しましょう。保存しないと、電源を抜いた時に元に戻ります。',
    targets: ['[data-guide="save-btn"]'],
  },
  trackball: {
    title: 'トラックボール設定',
    desc: '「トラックボール設定」タブでは、左の一覧から項目を選んで調整します。ボール動作（カーソルの速さ・精密モード）、スクロール、ジェスチャー、オートマウスレイヤー、シェイク・ダブルフリックが設定できます。',
    targets: ['[data-guide="trackball-tab"]'],
    manual: true,
  },
  others: {
    title: 'その他の設定',
    desc: '「マクロ拡張」ではマクロ・タップダンス・コンボ、「詳細設定」ではキー動作（長押しの判定時間など）・OS自動判別・キー表示の配列（JIS/US）などを設定できます。項目にマウスを乗せると説明が出ます。以上で基本の使い方は終わりです！',
    targets: ['[data-guide="macro-tab"]'],
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
              {step === 'others' ? '完了' : '次へ'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
