// クリスマステーマの飾り（2026-11-19〜）。テーマで「クリスマス」を選んでいる時だけ App から表示する。
// 2026-11-19 本人と Claude Design で詰めたデザインに合わせ、飾りは「降る雪」だけにした
// （積もった雪・小屋・トナカイ・森などのイラストはやめた）。タブやボタンをLEDに見立てた色付けは index.css 側。
// 雪はクリックを素通りする（pointer-events: none）。動きを減らす設定の時は表示しない（CSS側で対応）。

// 雪は奥・中・手前の3層。奥ほど小さく遅く、手前ほど大きくぼけて速い
const LAYERS = [
  { name: 'far',  count: 46, size: [1.5, 3],   fall: [16, 26], opacity: [0.3, 0.5] },
  { name: 'mid',  count: 26, size: [3, 5],     fall: [10, 16], opacity: [0.55, 0.8] },
  { name: 'near', count: 8,  size: [7, 11],    fall: [7, 10],  opacity: [0.35, 0.55] },
] as const;

// 描画のたびに変わらないよう、読み込み時に1回だけ位置・大きさ・速さを決めておく
const FLAKES = LAYERS.flatMap(l => Array.from({ length: l.count }, () => ({
  layer: l.name,
  left: Math.random() * 100,                                    // 横の位置（%）
  size: l.size[0] + Math.random() * (l.size[1] - l.size[0]),
  fall: l.fall[0] + Math.random() * (l.fall[1] - l.fall[0]),    // 落ちきるまでの秒数
  delay: -Math.random() * l.fall[1],                            // 最初から画面に散らばっているよう、負の遅れにする
  sway: 3 + Math.random() * 3,                                  // 左右に揺れる周期（秒）
  opacity: l.opacity[0] + Math.random() * (l.opacity[1] - l.opacity[0]),
})));

export function XmasSnow() {
  return (
    <div className="xmas-snow" aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="xmas-snow__fall"
          style={{ left: `${f.left}%`, animationDuration: `${f.fall}s`, animationDelay: `${f.delay}s` }}
        >
          <span
            className={`xmas-snow__flake xmas-snow__flake--${f.layer}`}
            style={{ width: f.size, height: f.size, opacity: f.opacity, animationDuration: `${f.sway}s` }}
          />
        </span>
      ))}
    </div>
  );
}
