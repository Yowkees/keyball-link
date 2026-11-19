// クリスマステーマの飾り（2026-11-19〜）。テーマで「クリスマス」を選んでいる時だけ App から表示する。
// どの飾りも pointer-events: none で、クリックや操作の邪魔をしない。
// 動きを減らす設定（OSの「視差効果を減らす」など）の時は、雪と電飾の点滅を止める（CSS側で対応）。

// ---- 降る雪 ----
// 画面全体に雪を降らせる。位置・大きさ・速さは最初に1回だけ乱数で決める（再描画でちらつかないように）
const FLAKE_COUNT = 46;

// 描画のたびに変わらないよう、読み込み時に1回だけ作っておく
const FLAKES = Array.from({ length: FLAKE_COUNT }, (_, i) => {
    const crystal = i % 5 === 0;                 // 5つに1つは結晶の形（❄）、他は丸い粒
    const size = crystal ? 10 + Math.random() * 8 : 3 + Math.random() * 5;
    return {
      left: Math.random() * 100,                 // 横の位置（%）
      size,
      fall: 9 + Math.random() * 12,              // 落ちきるまでの秒数
      delay: -Math.random() * 20,                // 最初から画面のあちこちに散らばっているよう、負の遅れにする
      sway: 3 + Math.random() * 3,               // 左右に揺れる周期（秒）
      opacity: 0.45 + Math.random() * 0.45,
      crystal,
    };
});

export function XmasSnow() {
  const flakes = FLAKES;

  return (
    <div className="xmas-snow" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="xmas-snow__fall"
          style={{ left: `${f.left}%`, animationDuration: `${f.fall}s`, animationDelay: `${f.delay}s` }}
        >
          <span
            className={`xmas-snow__flake ${f.crystal ? 'xmas-snow__flake--crystal' : ''}`}
            style={{
              width: f.crystal ? undefined : f.size,
              height: f.crystal ? undefined : f.size,
              fontSize: f.crystal ? f.size : undefined,
              opacity: f.opacity,
              animationDuration: `${f.sway}s`,
            }}
          >
            {f.crystal ? '❄' : null}
          </span>
        </span>
      ))}
    </div>
  );
}

// ---- 見本画像（2026-11-19 本人提供）に合わせた飾り ----
// ・各パネルの上に雪が積もる（CSSの ::after で描く。index.css 参照）
// ・タブの列の後ろに、雪の丘・木・灯りのともる小屋・トナカイのシルエット
// ・キー配列のパネルの中の下に、森のシルエットと積もった雪、灯りのついたツリー
// ・画面のいちばん下に積もった雪、左に木、右下にヒイラギ
// 色はくすんだ緑のシルエットに、暖かい灯りの黄色を差すだけにして簡素にする

// 尖った針葉樹のシルエット（段々のギザギザ）
function pine(cx: number, base: number, h: number, w: number) {
  const tiers = 4;
  let d = `M${cx} ${base - h}`;
  // 右側を上から下へ
  for (let i = 1; i <= tiers; i++) {
    const y = base - h + (h * 0.85 * i) / tiers;
    const half = (w / 2) * (i / tiers);
    d += ` L${cx + half} ${y} L${cx + half * 0.55} ${y}`;
  }
  d += ` L${cx + w * 0.06} ${base - h * 0.15} L${cx + w * 0.06} ${base} L${cx - w * 0.06} ${base} L${cx - w * 0.06} ${base - h * 0.15}`;
  // 左側を下から上へ
  for (let i = tiers; i >= 1; i--) {
    const y = base - h + (h * 0.85 * i) / tiers;
    const half = (w / 2) * (i / tiers);
    d += ` L${cx - half * 0.55} ${y} L${cx - half} ${y}`;
  }
  return d + ' Z';
}

// 木の上の灯り（またたく小さな点）。描画のたびに変わらないよう固定の並び
function treeLights(cx: number, base: number, h: number, w: number, n: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    // 決まった並びの「ばらばらな数」（毎回同じ値になる）で、灯りを木全体に散らす
    const r1 = Math.abs(Math.sin(i * 12.9898 + 1) * 43758.5453) % 1;
    const r2 = Math.abs(Math.sin(i * 78.233 + 2) * 12543.1234) % 1;
    const t = 0.15 + r1 * 0.8;                          // 上からの位置（0〜1）
    const side = (r2 - 0.5) * 1.6;                      // 左右の位置（-0.8〜0.8）
    pts.push([cx + side * (w / 2) * t * 0.9, base - h + h * 0.85 * t]);
  }
  return pts;
}

// トナカイのシルエット（左向き）
function Reindeer({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="var(--xmas-sil-near)" stroke="var(--xmas-sil-near)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 22 C18 16 36 16 42 20 C44 22 44 26 42 28 L16 28 C13 27 12 24 14 22 Z" />
      <path d="M17 21 L11 9 L6 8 L6 5 L12 5 L14 8 L19 19 Z" />
      <path d="M17 28 L16 40 M22 28 L23 40 M36 28 L35 40 M40 27 L42 40" strokeWidth="2.4" fill="none" />
      <path d="M42 21 L46 18" strokeWidth="2" fill="none" />
      <path d="M10 6 L8 0 M9 2 L5 0 M12 5 L14 -1 M13 1 L17 -1" strokeWidth="1.4" fill="none" />
    </g>
  );
}

// タブの列の後ろの景色
export function XmasTabsScene() {
  return (
    <svg className="xmas-tabs-scene" viewBox="0 0 1440 90" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      {/* 遠くの木々 */}
      <g fill="var(--xmas-sil-far)">
        {[[620, 40, 22], [660, 30, 18], [760, 46, 24], [880, 34, 18], [930, 52, 26], [1010, 38, 20], [1390, 50, 24], [1420, 36, 18]].map(([x, h, w], i) => (
          <path key={i} d={pine(x, 74, h, w)} />
        ))}
      </g>
      {/* 雪の丘 */}
      <path d="M0 80 C200 70 420 78 640 72 C860 66 1000 60 1180 62 C1300 64 1380 70 1440 66 L1440 90 L0 90 Z" fill="var(--xmas-snow)" stroke="var(--xmas-snow-edge)" strokeWidth="1.5" />
      {/* 小屋（窓に灯り） */}
      <g transform="translate(1250 30)">
        <rect x="0" y="16" width="56" height="20" fill="var(--xmas-sil-near)" />
        <path d="M-6 18 L28 0 L62 18 Z" fill="var(--xmas-sil-near)" />
        <path d="M-7 18 L28 -1 L63 18 L59 19 L28 3 L-3 19 Z" fill="var(--xmas-snow)" />
        <rect x="40" y="2" width="6" height="10" fill="var(--xmas-sil-near)" />
        <g className="xmas-window" fill="var(--xmas-light)">
          <rect x="8" y="22" width="7" height="7" /><rect x="18" y="22" width="7" height="7" />
          <rect x="31" y="22" width="7" height="7" /><rect x="41" y="22" width="7" height="7" />
        </g>
      </g>
      <Reindeer x={1130} y={34} s={0.95} />
      <Reindeer x={1180} y={40} s={0.8} />
      {/* 近くの木 */}
      <g fill="var(--xmas-sil-near)">
        <path d={pine(1340, 70, 58, 30)} />
        <path d={pine(1080, 72, 44, 24)} />
      </g>
    </svg>
  );
}

// キー配列のパネルの中の景色（パネルの文字やキーより奥に置く）
export function XmasCardScene() {
  const bigTree = { cx: 90, base: 196, h: 150, w: 92 };
  return (
    <svg className="xmas-card-scene" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {/* 奥の森 */}
      <g fill="var(--xmas-sil-far)">
        {[[200, 70, 34], [250, 96, 40], [300, 60, 28], [420, 80, 34], [470, 56, 26], [700, 66, 28], [760, 92, 38], [820, 60, 26],
          [930, 84, 34], [980, 110, 44], [1040, 70, 30], [1120, 90, 36], [1170, 62, 28]].map(([x, h, w], i) => (
          <path key={i} d={pine(x, 186, h, w)} />
        ))}
      </g>
      {/* 灯りのついたツリー（左） */}
      <path d={pine(bigTree.cx, bigTree.base, bigTree.h, bigTree.w)} fill="var(--xmas-sil-near)" />
      <path d={pine(160, 194, 70, 44)} fill="var(--xmas-sil-near)" />
      <g className="xmas-twinkle" fill="var(--xmas-light)">
        {treeLights(bigTree.cx, bigTree.base, bigTree.h, bigTree.w, 22).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.7" />)}
        {treeLights(160, 194, 70, 44, 9).map(([x, y], i) => <circle key={`s${i}`} cx={x} cy={y} r="1.4" />)}
      </g>
      <polygon points={star(bigTree.cx, bigTree.base - bigTree.h - 2, 6)} fill="var(--xmas-light)" />
      {/* 積もった雪 */}
      <path d="M0 184 C140 174 300 188 480 180 C660 172 820 190 1000 180 C1100 175 1160 182 1200 178 L1200 200 L0 200 Z" fill="var(--xmas-snow)" stroke="var(--xmas-snow-edge)" strokeWidth="1.5" />
    </svg>
  );
}

// 5つの角の星
function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// 画面のいちばん下（パネルの外。いちばん奥）
export function XmasScene() {
  return (
    <div className="xmas-scene" aria-hidden="true">
      <svg className="xmas-scene__bottom" viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path d="M0 40 C160 24 300 46 480 38 C680 28 820 50 1000 40 C1180 30 1320 44 1440 34 L1440 90 L0 90 Z" fill="var(--xmas-snow)" stroke="var(--xmas-snow-edge)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg className="xmas-scene__left" viewBox="0 0 120 90">
        <path d={pine(30, 66, 56, 30)} fill="var(--xmas-sil-near)" />
        <path d={pine(62, 70, 40, 22)} fill="var(--xmas-sil-near)" />
      </svg>
      {/* 右下のヒイラギ（葉3枚と赤い実） */}
      <svg className="xmas-scene__holly" viewBox="0 0 120 70">
        <path d="M60 40 C46 26 26 22 8 30 C16 32 18 38 14 42 C22 40 26 46 24 50 C36 46 50 46 60 40 Z" fill="#2f6b4a" />
        <path d="M60 40 C74 26 94 22 112 30 C104 32 102 38 106 42 C98 40 94 46 96 50 C84 46 70 46 60 40 Z" fill="#245a3d" />
        <path d="M60 40 C58 26 62 12 72 4 C72 12 78 14 82 12 C78 18 82 24 86 24 C76 30 66 34 60 40 Z" fill="#3a7d57" />
        <circle cx="56" cy="44" r="6" fill="#c9343f" /><circle cx="66" cy="46" r="6" fill="#b12a35" /><circle cx="61" cy="36" r="6" fill="#d8434e" />
      </svg>
    </div>
  );
}
