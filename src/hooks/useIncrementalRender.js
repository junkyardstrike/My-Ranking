import { useEffect, useRef, useState } from 'react';

// 長いリストを最初から全部描画すると画面切り替えが重くなり、その間のタップが効かなくなる。
// 最初は initial 件だけ描画し、末尾が近づいたら step 件ずつ追加で描画する。
export default function useIncrementalRender(total, { initial = 30, step = 30, resetKey } = {}) {
  const [count, setCount] = useState(initial);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const sentinelRef = useRef(null);

  // 検索条件などが変わったら先頭から描画し直す
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCount(initial);
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || count >= total) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setCount(c => Math.min(total, c + step));
      }
    }, { rootMargin: '1200px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [count, total, step]);

  // 指定件数までは確実に描画しておく（順位変更で移動した先へスクロールする時など）
  const ensureRendered = (n) => setCount(c => Math.max(c, n));

  return [Math.min(count, total), sentinelRef, ensureRendered];
}
