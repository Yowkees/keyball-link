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
// ヘッダーの下の縁に、たるんだ電線と色とりどりの電球をぶら下げる。電球は順番に点滅する
const BULB_COUNT = 28;
const BULB_COLORS = ['#ff4d5e', '#ffd34d', '#4fd17e', '#4db5ff', '#ff8a3d'];

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
            ['--bulb' as string]: BULB_COLORS[i % BULB_COLORS.length],
            animationDelay: `${(i % 4) * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}

// ---- ロゴにかぶせるサンタ帽 ----
export function SantaHat() {
  return (
    <svg className="xmas-hat" viewBox="0 0 40 34" aria-hidden="true">
      {/* 帽子の赤い部分（先が右に垂れる） */}
      <path d="M5 24 C8 10 18 2 28 4 C34 5 37 10 36 17 C33 13 29 12 27 14 C29 18 31 22 33 24 Z" fill="#d6283a" />
      <path d="M12 22 C15 12 21 7 27 7" fill="none" stroke="#ff6b78" strokeWidth="2" strokeLinecap="round" opacity=".6" />
      {/* 白いふち */}
      <rect x="2" y="22" width="34" height="8" rx="4" fill="#ffffff" />
      {/* 先の白いぽんぽん */}
      <circle cx="36" cy="18" r="4" fill="#ffffff" />
    </svg>
  );
}

// ---- 画面下の雪景色（ツリー・プレゼント・雪だるま） ----
// 画面のいちばん奥に置くので、パネルがある所では隠れ、空いている所から見える
export function XmasScene() {
  return (
    <div className="xmas-scene" aria-hidden="true">
      {/* 積もった雪 */}
      <svg className="xmas-scene__ground" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 C120 10 220 40 340 24 C470 6 560 34 700 22 C830 10 930 36 1060 20 C1120 13 1170 18 1200 22 L1200 60 L0 60 Z" fill="var(--xmas-snow-ground)" />
      </svg>

      {/* 左下: ツリーとプレゼント */}
      <svg className="xmas-scene__tree" viewBox="0 0 200 190">
        {/* 幹 */}
        <rect x="64" y="150" width="22" height="26" rx="2" fill="#7a4a2a" />
        {/* 葉（3段） */}
        <path d="M75 52 L128 118 L22 118 Z" fill="#1f7a45" />
        <path d="M75 80 L140 152 L10 152 Z" fill="#1a6b3c" />
        <path d="M75 26 L114 82 L36 82 Z" fill="#259152" />
        {/* 葉の上の雪 */}
        <path d="M48 82 Q60 76 75 80 Q92 76 104 82 Q90 86 75 84 Q60 87 48 82 Z" fill="#fff" opacity=".9" />
        <path d="M30 118 Q50 110 75 115 Q100 110 120 118 Q98 123 75 120 Q52 124 30 118 Z" fill="#fff" opacity=".9" />
        {/* モール（金） */}
        <path d="M44 100 Q75 112 108 96" fill="none" stroke="#f2c94c" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 138 Q75 152 124 132" fill="none" stroke="#f2c94c" strokeWidth="2.5" strokeLinecap="round" />
        {/* オーナメント */}
        <g className="xmas-twinkle">
          <circle cx="58" cy="66" r="4.5" fill="#ff4d5e" />
          <circle cx="92" cy="70" r="4.5" fill="#4db5ff" />
          <circle cx="50" cy="106" r="5" fill="#ffd34d" />
          <circle cx="96" cy="104" r="5" fill="#ff4d5e" />
          <circle cx="40" cy="142" r="5" fill="#4db5ff" />
          <circle cx="78" cy="132" r="5" fill="#ff8a3d" />
          <circle cx="114" cy="140" r="5" fill="#ffd34d" />
        </g>
        {/* てっぺんの星 */}
        <path className="xmas-star" d="M75 6 L80 18 L93 18 L83 26 L87 39 L75 31 L63 39 L67 26 L57 18 L70 18 Z" fill="#ffd34d" stroke="#f0a500" strokeWidth="1" />
        {/* プレゼント（赤・緑・青） */}
        <g>
          <rect x="112" y="150" width="34" height="28" rx="2" fill="#d6283a" />
          <rect x="126" y="150" width="6" height="28" fill="#f2c94c" />
          <rect x="112" y="160" width="34" height="5" fill="#f2c94c" />
          <path d="M129 150 C120 140 114 146 129 150 C144 146 138 140 129 150 Z" fill="#f2c94c" />
        </g>
        <g>
          <rect x="150" y="160" width="26" height="18" rx="2" fill="#1f7a45" />
          <rect x="160" y="160" width="5" height="18" fill="#fff" />
          <path d="M162 160 C155 152 150 157 162 160 C174 157 169 152 162 160 Z" fill="#fff" />
        </g>
        <g>
          <rect x="138" y="132" width="22" height="18" rx="2" fill="#3a7bd5" />
          <rect x="147" y="132" width="4" height="18" fill="#ff8a8a" />
        </g>
      </svg>

      {/* 右下: 雪だるま */}
      <svg className="xmas-scene__snowman" viewBox="0 0 120 170">
        {/* 体 */}
        <circle cx="60" cy="128" r="34" fill="#fff" stroke="#c9d6df" strokeWidth="2" />
        <circle cx="60" cy="78" r="24" fill="#fff" stroke="#c9d6df" strokeWidth="2" />
        {/* 腕（枝） */}
        <path d="M38 112 L12 96 M20 101 L14 92" stroke="#7a4a2a" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M82 112 L108 94 M100 99 L106 90" stroke="#7a4a2a" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* ボタン */}
        <circle cx="60" cy="118" r="3" fill="#2b2b2b" />
        <circle cx="60" cy="132" r="3" fill="#2b2b2b" />
        {/* マフラー */}
        <path d="M38 96 Q60 106 82 96 L82 103 Q60 112 38 103 Z" fill="#d6283a" />
        <rect x="66" y="100" width="9" height="22" rx="2" fill="#d6283a" />
        {/* 顔 */}
        <circle cx="52" cy="74" r="2.5" fill="#2b2b2b" />
        <circle cx="68" cy="74" r="2.5" fill="#2b2b2b" />
        <path d="M60 80 L76 84 L60 85 Z" fill="#ff8a3d" />
        <path d="M52 89 Q60 93 68 89" stroke="#2b2b2b" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 帽子 */}
        <rect x="40" y="52" width="40" height="6" rx="2" fill="#2b2b2b" />
        <rect x="47" y="28" width="26" height="26" rx="2" fill="#2b2b2b" />
        <rect x="47" y="45" width="26" height="5" fill="#d6283a" />
      </svg>
    </div>
  );
}
