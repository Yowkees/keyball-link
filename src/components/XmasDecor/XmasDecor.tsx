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

// ---- 画面の飾り（金の線画のツリー・吊るしたオーナメント・遠くの森） ----
// 2026-11-19 本人要望で「おしゃれで大人っぽい」方向に描き直した（以前のツリー・雪だるま・サンタ帽はやめた）。
// 画面のいちばん奥に置くので、パネルがある所では隠れ、空いている所から見える
export function XmasScene() {
  return (
    <div className="xmas-scene" aria-hidden="true">
      {/* 遠くの森のシルエット（細い三角の木を高さを変えて並べる） */}
      <svg className="xmas-scene__forest" viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="xmas-fog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--xmas-forest)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--xmas-forest)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <g fill="var(--xmas-forest)">
          {FOREST.map(([x, h, w], i) => (
            <path key={i} d={`M${x} ${140 - h} L${x + w / 2} 140 L${x - w / 2} 140 Z`} />
          ))}
        </g>
        <rect x="0" y="100" width="1200" height="40" fill="url(#xmas-fog)" />
      </svg>

      {/* 左下: 金の細い線で描いたツリー（一筆書きのジグザグ）と、またたく小さな灯り */}
      <svg className="xmas-scene__tree" viewBox="0 0 160 230">
        <g fill="none" stroke="var(--xmas-gold)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
          {/* てっぺんの星（線だけ） */}
          <path d="M80 8 L84 19 L96 19 L86 26 L90 38 L80 31 L70 38 L74 26 L64 19 L76 19 Z" />
          <path d="M80 44 L62 70 L98 70 L50 106 L110 106 L40 146 L120 146 L30 188 L130 188" />
          <path d="M80 188 L80 214" />
          <path d="M66 214 L94 214" />
        </g>
        <g className="xmas-twinkle" fill="var(--xmas-light)">
          {TREE_LIGHTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" />)}
        </g>
      </svg>

      {/* 右上: 細い糸で吊るしたオーナメント（ゆっくり揺れる） */}
      <svg className="xmas-scene__ornaments" viewBox="0 0 200 260">
        <defs>
          <radialGradient id="xmas-orn-red" cx=".35" cy=".35" r=".75">
            <stop offset="0" stopColor="#c4535c" /><stop offset="1" stopColor="#5e1219" />
          </radialGradient>
          <radialGradient id="xmas-orn-green" cx=".35" cy=".35" r=".75">
            <stop offset="0" stopColor="#3f8a66" /><stop offset="1" stopColor="#0f3324" />
          </radialGradient>
          <radialGradient id="xmas-orn-gold" cx=".35" cy=".35" r=".75">
            <stop offset="0" stopColor="#f1d9a0" /><stop offset="1" stopColor="#8f6a2a" />
          </radialGradient>
        </defs>
        {ORNAMENTS.map((o, i) => (
          <g key={i} className="xmas-orn" style={{ transformOrigin: `${o.x}px 0px`, animationDelay: `${-i * 1.3}s`, animationDuration: `${5 + i}s` }}>
            <line x1={o.x} y1="0" x2={o.x} y2={o.len} stroke="var(--xmas-gold)" strokeWidth="0.8" />
            <rect x={o.x - 4} y={o.len} width="8" height="6" rx="1" fill="var(--xmas-gold)" />
            <circle cx={o.x} cy={o.len + 6 + o.r} r={o.r} fill={`url(#xmas-orn-${o.color})`} />
            {/* 金の細い帯と光の反射 */}
            <ellipse cx={o.x} cy={o.len + 6 + o.r} rx={o.r} ry={o.r * 0.22} fill="none" stroke="var(--xmas-gold)" strokeWidth="0.7" opacity=".8" />
            <circle cx={o.x - o.r * 0.38} cy={o.len + 6 + o.r * 0.6} r={o.r * 0.16} fill="#fff" opacity=".35" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// 森の木: [横位置, 高さ, 幅]。描画のたびに変わらないよう固定値にしている
const FOREST: [number, number, number][] = [
  [40, 70, 26], [70, 100, 30], [105, 60, 22], [190, 85, 28], [230, 120, 34], [262, 75, 24],
  [360, 90, 28], [395, 65, 22], [470, 110, 32], [505, 80, 26], [590, 70, 24], [640, 95, 30],
  [720, 125, 34], [758, 85, 26], [840, 70, 22], [880, 105, 30], [960, 80, 26], [1000, 118, 34],
  [1040, 72, 24], [1110, 95, 30], [1150, 130, 36], [1185, 78, 24],
];
// ツリーの灯り（ジグザグの線の上に置く）
const TREE_LIGHTS: [number, number][] = [
  [71, 57], [89, 57], [74, 88], [92, 88], [62, 97], [56, 126], [76, 126], [100, 126],
  [48, 167], [70, 167], [92, 167], [112, 167], [80, 70], [80, 106], [80, 146],
];
// オーナメント: 横位置・糸の長さ・半径・色
const ORNAMENTS = [
  { x: 40,  len: 70,  r: 16, color: 'red' },
  { x: 100, len: 130, r: 20, color: 'gold' },
  { x: 160, len: 50,  r: 13, color: 'green' },
];
