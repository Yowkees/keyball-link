import { useEffect, useRef, useState } from 'react';
import type { KeyLayout as LayoutDef } from '../../layouts/types';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDescription } from '../../lib/keycodes';
import { Key } from './Key';

const KEY_SIZE = 52;
const GAP = 4;
const SPLIT_GAP_PX = 56;
// ウィンドウが広い時、余った横幅を無駄にせずキー配列自体を少しだけ拡大して使う。
// 【2026-09-17再調整】1.5→2.2に緩めたところ「キーマップが大きすぎる」との指摘。
// キー自体はほどほどの大きさに留め、それ以上の余った幅は（下のEXTRA_VPADのように）
// 余白として使う方針に変更し、1.3に戻した。
const MAX_SCALE = 1.3;
// キー配列の上下の余白（メイン表示のみ。全レイヤー表示の一覧では窮屈にならないよう
// 適用しない＝.all-layers-item .layout-scrollのCSS側の値をそのまま使う）。
// キー配列自体の拡大率(scale、MAX_SCALEで頭打ち)ではなく、頭打ちにしていない
// 生の比率(rawScale)を使って大きくする。これにより、キー配列がMAX_SCALEで
// 拡大をやめた後も、ウィンドウがさらに広がった分は「キーが大きくなりすぎる」
// のではなく「余白が増える」形で吸収される（本人の要望通り）。
const EXTRA_VPAD_BASE = 40;
const PAD_SCALE_CAP = 3;  // 余白の拡大にも際限なく伸びないよう緩い上限を設ける
// 【2026-09-17追加】ウィンドウを狭めた時は横スクロールにせず、画面に収まるよう
// キー配列自体を縮小する（本人要望）。縮小しすぎて読めなくならないよう下限だけ設ける。
const MIN_SCALE = 0.5;
// 【2026-09-17追加】キーマップの左右に余白が全く無いと、コンテナ幅ぴったりに
// 拡大縮小した際の端数（サブピクセル）でわずかに幅がはみ出し、.layout-scroll側の
// overflow-x:autoが反応して不要な横スクロールバーが出てしまうことがあった
// （本人指摘）。計算に使う「利用可能幅」自体から左右のマージン分を差し引いておく
// ことで、常にコンテナよりわずかに小さく収まるようにする。
const SIDE_MARGIN_PX = 16;

function isRightSide(k: LayoutDef): boolean {
  return k.id.startsWith('R');
}

interface KeyboardLayoutProps {
  layout: LayoutDef[];
  keycodes: number[];
  selectedIndex: number | null;
  ballSide: 'left' | 'right';
  keyLayout: KeyLayout;
  onKeyClick: (index: number) => void;
  onKeyDrop: (index: number, keycode: number) => void;
  showDescBar?: boolean;
  splitGapPx?: number;
}

export function KeyboardLayout({ layout, keycodes, selectedIndex, ballSide, keyLayout, onKeyClick, onKeyDrop, showDescBar = true, splitGapPx = SPLIT_GAP_PX }: KeyboardLayoutProps) {
  const [hoverDesc, setHoverDesc] = useState<string | null>(null);

  const maxX = Math.max(...layout.map(k => {
    const extra = isRightSide(k) ? splitGapPx : 0;
    return k.x * (KEY_SIZE + GAP) + (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP + extra;
  }));
  const maxY = Math.max(...layout.map(k => k.y + 1));
  const height = maxY * (KEY_SIZE + GAP);

  // 表示先（.layout-scroll、この直上の親要素）の実際の横幅を測り、キー配列の
  // 自然な横幅(maxX)より広ければその分だけ拡大表示し、逆に狭ければ縮小して
  // 画面内に収める（横スクロールにしない。MIN_SCALEを下回るほど狭い場合のみ
  // .layout-scroll側のoverflow-x:autoに任せる）。
  const wrapRef = useRef<HTMLDivElement>(null);
  const [availWidth, setAvailWidth] = useState<number | null>(null);
  useEffect(() => {
    const parent = wrapRef.current?.parentElement;
    if (!parent) return;
    const update = () => setAvailWidth(Math.max(0, parent.getBoundingClientRect().width - SIDE_MARGIN_PX * 2));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);
  const rawScale = availWidth ? availWidth / maxX : 1;
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));
  const extraVPad = showDescBar ? EXTRA_VPAD_BASE * Math.min(PAD_SCALE_CAP, Math.max(1, rawScale)) : 0;

  return (
    <div className="keyboard-layout-wrap" ref={wrapRef}>
      <div className="keyboard-layout-scale-box" style={{ width: maxX * scale, height: height * scale, marginTop: extraVPad, marginBottom: extraVPad }}>
      <div className="keyboard-layout" style={{ position: 'relative', width: maxX, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {layout.map((k, i) => (
          <Key
            key={k.id}
            layout={k}
            keycode={keycodes[i] ?? 0}
            selected={selectedIndex === i}
            ballSide={ballSide}
            keyLayout={keyLayout}
            xExtra={isRightSide(k) ? splitGapPx : 0}
            onClick={() => onKeyClick(i)}
            onDrop={code => onKeyDrop(i, code)}
            onHover={() => setHoverDesc(getKeyDescription(keycodes[i] ?? 0, keyLayout))}
            onHoverEnd={() => setHoverDesc(null)}
          />
        ))}
      </div>
      </div>
      {showDescBar && (
        <div className="key-desc-bar">
          {hoverDesc ?? 'キーをクリックで設定 ／ マウスを乗せると説明が表示されます'}
        </div>
      )}
    </div>
  );
}
