import { translate } from '../../i18n';
import { TextKey } from '../../i18n/text.enum';
import { useEffect, useState, type CSSProperties } from 'react';

export type GuideStep =
  | 'flash' | 'connect' | 'click' | 'assign'
  | 'mods' | 'layers' | 'led' | 'save' | 'trackball' | 'others' | 'done'
  | 'backToKeymap';  // キーマップタブ以外にいるときの誘導（擬似ステップ）

interface WelcomeGuideProps {
  step: GuideStep;
  onDismiss: () => void;
  onNext?: () => void;  // 「次へ」で手動進行するステップ用
}

const STEP_ORDER: GuideStep[] = ['flash', 'connect', 'click', 'assign', 'mods', 'layers', 'led', 'save', 'trackball', 'others', 'done'];

interface StepDef {
  title: string;
  desc: string;
  targets: string[];   // 吹き出しを付ける対象（先頭から順に探し、見つかった要素に付ける）
  manual?: boolean;    // trueなら「次へ」ボタンで進行
  // 吹き出しを対象の横に置く（対象が縦長・大きくて上下に入らない時用）。入らなければ上下に置く
  side?: 'right' | 'left';
}

// 2026-10-20: 画面の作り直し（キー設定の右パネル化・設定タブの左サイドバー化・ファームウェア
// タブの①②手順化など）に合わせて文言と指す場所を更新（本人依頼）。
const STEP_DEFS: Partial<Record<GuideStep, StepDef>> = {
  flash: {
    get title() { return translate(TextKey.WelcomeGuideFlashFirmwareFirstTimeOnly); },
    get desc() { return translate(TextKey.WelcomeGuideKeyballLinkRequiresItsOwnFirmware); },
    // ファームウェアタブを開いている時は書き込みの手順のカード、それ以外はタブ見出しを指す
    targets: ['[data-guide="firmware-panel"] [data-card="flash"]', '[data-guide="firmware-tab"]'],
    manual: true,
  },
  connect: {
    get title() { return translate(TextKey.ConnectKeyboard); },
    get desc() { return translate(TextKey.WelcomeGuideConnectTheKeyboardViaUSBClick); },
    targets: ['[data-guide="connect-btn"]'],
  },
  click: {
    get title() { return translate(TextKey.WelcomeGuideClickAKey); },
    get desc() { return translate(TextKey.WelcomeGuideClickAKeyYouWantTo); },
    targets: ['[data-guide="keyboard"]'],
    side: 'right',  // キー配列は大きいので、右（キー設定パネルの上）から指す
  },
  assign: {
    get title() { return translate(TextKey.WelcomeGuideChooseANewKey); },
    get desc() { return translate(TextKey.WelcomeGuideClickAnAssignmentInTheList); },
    targets: ['[data-guide="key-picker"]', '[data-guide="keyboard"]'],
    side: 'left',   // キー設定パネルは縦長なので、左（キー配列側）から指す
  },
  mods: {
    get title() { return translate(TextKey.WelcomeGuideModifiersAndHoldActions); },
    get desc() { return translate(TextKey.WelcomeGuideTheHoldTabInTheRight); },
    targets: ['[data-guide="hold-tab"]', '[data-guide="keyboard"]'],
    manual: true,
  },
  layers: {
    get title() { return translate(TextKey.KeyConfigModalLayers); },
    get desc() { return translate(TextKey.WelcomeGuideLayersAreAlternativeKeymapsKeysSuch); },
    targets: ['[data-guide="layer-tabs"]'],
    manual: true,
  },
  led: {
    title: 'LED',
    get desc() { return translate(TextKey.WelcomeGuideTheLEDPanelBelowTheKeymap); },
    targets: ['[data-guide="led-panel"]'],
    manual: true,
  },
  save: {
    get title() { return translate(TextKey.WelcomeGuideSaveChanges); },
    get desc() { return translate(TextKey.WelcomeGuideClickThisButtonToSaveSettings); },
    targets: ['[data-guide="save-btn"]'],
  },
  trackball: {
    get title() { return translate(TextKey.TrackballSettings); },
    get desc() { return translate(TextKey.WelcomeGuideInTrackballSettingsSelectAnItem); },
    targets: ['[data-guide="trackball-tab"]'],
    manual: true,
  },
  others: {
    get title() { return translate(TextKey.WelcomeGuideOtherSettings); },
    get desc() { return translate(TextKey.WelcomeGuideMacrosMoreContainsMacrosTapDance); },
    targets: ['[data-guide="macro-tab"]'],
    manual: true,
  },
  backToKeymap: {
    get title() { return translate(TextKey.WelcomeGuideReturnToKeymap); },
    get desc() { return translate(TextKey.WelcomeGuideClickTheKeymapTabToContinue); },
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
    return <div className="guide-done">{translate(TextKey.WelcomeGuideSetupComplete)}</div>;
  }
  if (!def) return null;

  const idx = STEP_ORDER.indexOf(step);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let bubbleStyle: CSSProperties = {};
  let arrow: { style: CSSProperties; dir: 'below' | 'above' | 'right' | 'left' } | null = null;
  let highlight: CSSProperties | null = null;

  // 横に置く指定があり、その側に吹き出しが収まる時は横に置く
  const sideFits = rect && def.side
    ? (def.side === 'right' ? rect.left + rect.width + 14 + BUBBLE_W <= vw - 12 : rect.left - 14 - BUBBLE_W >= 12)
    : false;

  if (rect && sideFits) {
    const right = def.side === 'right';
    const mid   = Math.min(Math.max(rect.top + rect.height / 2, 110), vh - 110);  // 吹き出しの縦中央
    const left  = right ? rect.left + rect.width + 14 : rect.left - 14 - BUBBLE_W;
    bubbleStyle = { top: mid, left, transform: 'translateY(-50%)' };
    arrow = right
      ? { style: { top: mid - 6, left: rect.left + rect.width + 8 }, dir: 'right' }
      : { style: { top: mid - 6, left: rect.left - 20 }, dir: 'left' };
    highlight = { top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 };
  } else if (rect) {
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
            {idx >= 0 ? translate(TextKey.WelcomeGuideStep, { p0: idx + 1, p1: STEP_ORDER.length - 1 }) : translate(TextKey.WelcomeGuideTutorial)}
          </span>
          <button className="guide-tooltip__close" onClick={onDismiss}>{translate(TextKey.WelcomeGuideClose)}</button>
        </div>
        <div className="guide-tooltip__title">{def.title}</div>
        <div className="guide-tooltip__desc">{def.desc}</div>
        {onNext && (
          <div className="guide-tooltip__actions">
            <button className="btn btn--primary btn--small" onClick={onNext}>
              {step === 'others' ? translate(TextKey.WelcomeGuideDone) : translate(TextKey.WelcomeGuideNext)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
