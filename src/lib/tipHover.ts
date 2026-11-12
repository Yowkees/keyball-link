// ホバーの詳細説明（[data-tip]、index.css）の出し方（2026-11-12、本人希望）。
// マウスを止めて0.6秒たったら出し、マウスが少しでも動いたらすぐに消す。
// 動いている間は<html>に tip-moving を付け、CSS側でその間は説明を隠す。
const SHOW_DELAY_MS = 600;

export function installTipHover(): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  let timer: ReturnType<typeof setTimeout> | null = null;
  root.classList.add('tip-moving');  // 最初は隠しておき、止まってから出す
  window.addEventListener('mousemove', () => {
    root.classList.add('tip-moving');
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => root.classList.remove('tip-moving'), SHOW_DELAY_MS);
  }, { passive: true });
}
