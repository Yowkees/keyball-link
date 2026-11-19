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

// ---- ヘッダーの電飾 ----
// ヘッダーの下の縁に、細い電線と暖かい白の小さな灯りをぶら下げる（大人っぽく一色にしている）。灯りはゆっくりまたたく
const BULB_COUNT = 28;


export function XmasGarland() {
  // 電線: 電球と電球の間を1区間とし、区間ごとに下へたるむ曲線を描く（横幅に合わせて伸び縮みする）
  const segW = 40;
  let d = 'M0 2';
  for (let i = 0; i < BULB_COUNT; i++) {
    const x0 = i * segW;
    d += ` Q${x0 + segW / 2} 18 ${x0 + segW} 2`;
  }
  return (
    <div className="xmas-garland" aria-hidden="true">
      <svg className="xmas-garland__wire" viewBox={`0 0 ${BULB_COUNT * segW} 20`} preserveAspectRatio="none">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: BULB_COUNT }, (_, i) => (
        <span
          key={i}
          className="xmas-garland__bulb"
          style={{
            left: `${((i + 0.5) / BULB_COUNT) * 100}%`,
            animationDelay: `${((i * 7) % 11) * 0.37}s`,  // 規則的に見えないよう、ばらばらにまたたかせる
          }}
        />
      ))}
    </div>
  );
}

// ---- 画面の飾り（フラットなイラスト） ----
// 2026-11-19 本人要望で「立体感の少ない、フラットでおしゃれなイラスト」に描き直した。
// グラデーションや陰影は使わず、少ない色の面で描く（木は左右で2色に塗り分けるだけ）。
// 画面のいちばん奥に置くので、パネルがある所では隠れ、空いている所から見える

// 色（イラスト全体でこの色だけ使う）
const C = {
  green: '#2f7a52', greenDark: '#245f40', greenLight: '#4c9a6c', greenDeep: '#1d4a34',
  red: '#c9434d', redDark: '#9e2f39', gold: '#e3b75c', cream: '#f4ead2', brown: '#6b4a35', roof: '#3a2a26',
  window: '#ffd77a',
};

// 2色に塗り分けた三角の木（左が明るい色・右が暗い色）
function FlatTier({ cx, top, bottom, half, light, dark }: { cx: number; top: number; bottom: number; half: number; light: string; dark: string }) {
  return (
    <>
      <path d={`M${cx} ${top} L${cx + half} ${bottom} L${cx - half} ${bottom} Z`} fill={light} />
      <path d={`M${cx} ${top} L${cx + half} ${bottom} L${cx} ${bottom} Z`} fill={dark} />
    </>
  );
}

// 丸みのある円すいの木
function RoundTree({ cx, top, base, half, light, dark }: { cx: number; top: number; base: number; half: number; light: string; dark: string }) {
  const mid = top + (base - top) * 0.45;
  return (
    <>
      <path d={`M${cx} ${top} C${cx + half * 0.55} ${mid} ${cx + half} ${base - 20} ${cx + half} ${base} L${cx - half} ${base} C${cx - half} ${base - 20} ${cx - half * 0.55} ${mid} ${cx} ${top} Z`} fill={light} />
      <path d={`M${cx} ${top} C${cx + half * 0.55} ${mid} ${cx + half} ${base - 20} ${cx + half} ${base} L${cx} ${base} Z`} fill={dark} />
    </>
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

// リボンを掛けたプレゼント
function Gift({ x, y, w, h, box, ribbon }: { x: number; y: number; w: number; h: number; box: string; ribbon: string }) {
  const cx = x + w / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={box} />
      <rect x={x - 2} y={y} width={w + 4} height={h * 0.22} fill={box} />
      <rect x={cx - 3} y={y} width={6} height={h} fill={ribbon} />
      <path d={`M${cx} ${y} L${cx - 10} ${y - 8} L${cx - 10} ${y + 2} Z M${cx} ${y} L${cx + 10} ${y - 8} L${cx + 10} ${y + 2} Z`} fill={ribbon} />
    </>
  );
}

export function XmasScene() {
  return (
    <div className="xmas-scene" aria-hidden="true">
      {/* 奥の丘（2段） */}
      <svg className="xmas-scene__hills" viewBox="0 0 1440 140" preserveAspectRatio="none">
        <path d="M0 70 C200 30 360 60 520 50 C700 38 820 80 1000 60 C1180 40 1300 60 1440 44 L1440 140 L0 140 Z" fill="var(--xmas-hill1)" />
        <path d="M0 100 C180 80 340 104 560 92 C760 80 900 108 1100 94 C1250 84 1360 96 1440 90 L1440 140 L0 140 Z" fill="var(--xmas-hill2)" />
      </svg>

      {/* 左下: 飾りつけたツリーとプレゼント */}
      <svg className="xmas-scene__left" viewBox="0 0 360 240">
        <path d="M20 140 L38 228 L2 228 Z" fill={C.greenDeep} />
        <RoundTree cx={290} top={112} base={228} half={32} light={C.greenLight} dark={C.green} />
        <rect x={103} y={204} width={14} height={24} fill={C.brown} />
        <FlatTier cx={110} top={108} bottom={208} half={78} light={C.green} dark={C.greenDark} />
        <FlatTier cx={110} top={70} bottom={150} half={60} light={C.green} dark={C.greenDark} />
        <FlatTier cx={110} top={40} bottom={102} half={42} light={C.green} dark={C.greenDark} />
        {/* ツリーの飾り（丸い玉と、ななめの帯） */}
        <path d="M74 120 L134 96" stroke={C.cream} strokeWidth="3" strokeLinecap="round" />
        <path d="M58 178 L158 140" stroke={C.cream} strokeWidth="3" strokeLinecap="round" />
        <g className="xmas-twinkle">
          <circle cx={98} cy={84} r={4} fill={C.red} />
          <circle cx={124} cy={124} r={4.5} fill={C.gold} />
          <circle cx={88} cy={136} r={4.5} fill={C.red} />
          <circle cx={140} cy={176} r={5} fill={C.red} />
          <circle cx={80} cy={190} r={5} fill={C.gold} />
          <circle cx={112} cy={164} r={4.5} fill={C.cream} />
        </g>
        <polygon className="xmas-star" points={star(110, 34, 13)} fill={C.gold} />
        {/* プレゼント */}
        <Gift x={180} y={192} w={40} h={36} box={C.red} ribbon={C.cream} />
        <Gift x={228} y={204} w={30} h={24} box={C.gold} ribbon={C.redDark} />
        <Gift x={190} y={170} w={24} h={20} box={C.cream} ribbon={C.green} />
      </svg>

      {/* 右下: 灯りのともる小屋と木々 */}
      <svg className="xmas-scene__right" viewBox="0 0 380 240">
        <RoundTree cx={70} top={92} base={228} half={36} light={C.green} dark={C.greenDark} />
        <path d="M30 150 L46 228 L14 228 Z" fill={C.greenDeep} />
        {/* 煙突と煙 */}
        <rect x={214} y={118} width={16} height={36} fill={C.roof} />
        <g className="xmas-smoke" fill="var(--xmas-smoke)">
          <circle cx={224} cy={104} r={6} />
          <circle cx={233} cy={90} r={8} />
          <circle cx={246} cy={72} r={10} />
        </g>
        {/* 小屋 */}
        <rect x={130} y={160} width={110} height={68} fill={C.red} />
        <rect x={185} y={160} width={55} height={68} fill={C.redDark} opacity=".35" />
        <polygon points="114,166 185,114 256,166" fill={C.roof} />
        <polygon points="110,166 185,108 260,166 252,169 185,120 118,169" fill="var(--xmas-snow)" />
        <rect x={150} y={192} width={22} height={36} fill={C.redDark} />
        <circle cx={161} cy={186} r={7} fill="none" stroke={C.green} strokeWidth="3" />
        <circle cx={161} cy={192} r={2} fill={C.gold} />
        <rect className="xmas-window" x={194} y={180} width={30} height={24} fill={C.window} />
        <path d="M209 180 V204 M194 192 H224" stroke={C.redDark} strokeWidth="2.5" />
        {/* 右の木 */}
        <FlatTier cx={310} top={128} bottom={228} half={42} light={C.greenLight} dark={C.green} />
        <FlatTier cx={310} top={104} bottom={172} half={32} light={C.greenLight} dark={C.green} />
        <path d="M360 150 L376 228 L344 228 Z" fill={C.greenDeep} />
      </svg>

      {/* 手前の積もった雪（木や小屋の根元にかぶせる） */}
      <svg className="xmas-scene__snow" viewBox="0 0 1440 40" preserveAspectRatio="none">
        <path d="M0 14 C120 4 260 18 420 10 C600 2 740 18 900 12 C1060 6 1200 18 1440 8 L1440 40 L0 40 Z" fill="var(--xmas-snow)" />
      </svg>

      {/* 右上: 吊るしたオーナメント（フラット。ゆっくり揺れる） */}
      <svg className="xmas-scene__ornaments" viewBox="0 0 200 260">
        {/* 赤い玉（クリーム色のジグザグの帯） */}
        <g className="xmas-orn" style={{ transformOrigin: '40px 0px', animationDuration: '5s' }}>
          <line x1="40" y1="0" x2="40" y2="70" stroke="var(--xmas-gold)" strokeWidth="1" />
          <rect x="35" y="68" width="10" height="7" fill={C.gold} />
          <circle cx="40" cy="93" r="18" fill={C.red} />
          <path d="M22 93 L28 87 L34 93 L40 87 L46 93 L52 87 L58 93" fill="none" stroke={C.cream} strokeWidth="3" strokeLinejoin="round" />
        </g>
        {/* 金の玉（しま模様） */}
        <g className="xmas-orn" style={{ transformOrigin: '100px 0px', animationDuration: '6.2s', animationDelay: '-1.4s' }}>
          <line x1="100" y1="0" x2="100" y2="128" stroke="var(--xmas-gold)" strokeWidth="1" />
          <rect x="94" y="126" width="12" height="8" fill={C.gold} />
          <circle cx="100" cy="156" r="22" fill={C.gold} />
          <rect x="78" y="146" width="44" height="5" fill={C.cream} />
          <rect x="78" y="161" width="44" height="5" fill={C.cream} />
        </g>
        {/* 緑のしずく形 */}
        <g className="xmas-orn" style={{ transformOrigin: '160px 0px', animationDuration: '5.6s', animationDelay: '-2.6s' }}>
          <line x1="160" y1="0" x2="160" y2="46" stroke="var(--xmas-gold)" strokeWidth="1" />
          <rect x="156" y="44" width="8" height="6" fill={C.gold} />
          <path d="M160 50 C172 64 176 78 176 86 C176 96 169 102 160 102 C151 102 144 96 144 86 C144 78 148 64 160 50 Z" fill={C.green} />
          <circle cx="160" cy="86" r="4" fill={C.cream} />
        </g>
        {/* 金の星 */}
        <g className="xmas-orn" style={{ transformOrigin: '70px 0px', animationDuration: '6.8s', animationDelay: '-3.1s' }}>
          <line x1="70" y1="0" x2="70" y2="168" stroke="var(--xmas-gold)" strokeWidth="1" />
          <polygon points={star(70, 186, 16)} fill="var(--xmas-star)" />
        </g>
      </svg>
    </div>
  );
}
