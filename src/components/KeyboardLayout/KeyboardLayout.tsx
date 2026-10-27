import { useEffect, useRef, useState } from 'react';
import type { KeyLayout as LayoutDef } from '../../layouts/types';
import type { KeyLayout } from '../../lib/keycodes';
import { getKeyDescription } from '../../lib/keycodes';
import { Key, type KeyRect } from './Key';
import type { KleKeyGeometry } from '../../layouts/kleGeometry';

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
// 縦に収めるために上下の余白を削る時の下限
const MIN_VPAD = 6;

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
  // キー配列（上下の余白込み）に使ってよい高さの上限。画面の縦が短い時にApp側で測って
  // 渡す（2026-10-07、本人要望「キーマップタブを縦スクロールなしでウィンドウ内に収める」）
  maxBoxHeight?: number | null;
  // Remapと同じキー配置（via.jsonから生成したKLE座標、"行,列"→位置）。あれば格子状の配置の代わりに使う
  // （2026-10-27、本人希望）。全てのキーの座標がそろっている時だけ使い、欠けていれば従来の配置に戻る
  geometry?: Record<string, KleKeyGeometry>;
}

// KLE座標（1=キー1個分）をpxに直し、全体が(0,0)から始まるようにずらす。傾いたキーは回転後の
// 四隅も含めて全体の大きさを求める。
function kleRects(layout: LayoutDef[], geometry: Record<string, KleKeyGeometry>): { rects: KeyRect[]; width: number; height: number } | null {
  const U = KEY_SIZE + GAP;
  const raw: KeyRect[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k of layout) {
    const g = geometry[`${k.row},${k.col}`];
    if (!g) return null;
    const left = g.x * U, top = g.y * U;
    const width = (g.w ?? 1) * U - GAP, height = (g.h ?? 1) * U - GAP;
    const rotate = g.r ?? 0;
    const ox = rotate ? (g.rx ?? 0) * U - left : 0;
    const oy = rotate ? (g.ry ?? 0) * U - top : 0;
    raw.push({ left, top, width, height, rotate, originX: ox, originY: oy });
    const rad = (rotate * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
    for (const [dx, dy] of [[0, 0], [width, 0], [0, height], [width, height]]) {
      // 回転の中心（左上からox,oy）を基準に回した四隅
      const px = left + ox + (dx - ox) * c - (dy - oy) * s;
      const py = top + oy + (dx - ox) * s + (dy - oy) * c;
      minX = Math.min(minX, px); minY = Math.min(minY, py);
      maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
    }
  }
  // 影や選択枠が切れないよう、ほんの少し余白をとる
  const pad = 4;
  const rects = raw.map(r => ({ ...r, left: r.left - minX + pad, top: r.top - minY + pad }));
  return { rects, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}

export function KeyboardLayout({ layout, keycodes, selectedIndex, ballSide, keyLayout, onKeyClick, onKeyDrop, showDescBar = true, splitGapPx = SPLIT_GAP_PX, maxBoxHeight = null, geometry }: KeyboardLayoutProps) {
  const [hoverDesc, setHoverDesc] = useState<string | null>(null);

  // ボールの位置にあるキーは表示しないので、座標の計算からも外す
  const visibleLayout = layout.filter(k => k.ball !== ballSide);
  const kle = geometry ? kleRects(visibleLayout, geometry) : null;
  const rectById = new Map<string, KeyRect>();
  if (kle) visibleLayout.forEach((k, i) => rectById.set(k.id, kle.rects[i]));

  const maxX = kle ? kle.width : Math.max(...layout.map(k => {
    const extra = isRightSide(k) ? splitGapPx : 0;
    return k.x * (KEY_SIZE + GAP) + (k.w ?? 1) * KEY_SIZE + ((k.w ?? 1) - 1) * GAP + extra;
  }));
  const maxY = Math.max(...layout.map(k => k.y + 1));
  const height = kle ? kle.height : maxY * (KEY_SIZE + GAP);

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
  let scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));
  let extraVPad = showDescBar ? EXTRA_VPAD_BASE * Math.min(PAD_SCALE_CAP, Math.max(1, rawScale)) : 0;
  // 縦に収まらない時は、まず上下の余白を削り、それでも足りなければキー配列自体を縮める
  if (maxBoxHeight != null && height * scale + extraVPad * 2 > maxBoxHeight) {
    const minPad = Math.min(extraVPad, MIN_VPAD);
    extraVPad = Math.max(minPad, (maxBoxHeight - height * scale) / 2);
    if (height * scale + extraVPad * 2 > maxBoxHeight) {
      scale = Math.max(MIN_SCALE, Math.min(scale, (maxBoxHeight - extraVPad * 2) / height));
    }
  }

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
            rect={rectById.get(k.id)}
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
