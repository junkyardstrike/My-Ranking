// YouTube（チャンネル）の年別視聴時間。
// item.watchLog = { '2026': 754, '2025': 1930 }（単位は分）。PC の拡張機能で計った時間を年ごとに手入力する。

export const currentYear = () => new Date().getFullYear();

// [[年, 分], ...] を新しい年から順に（0 分の年も入力途中として残す）
export const logEntries = (item) =>
  Object.entries(item?.watchLog || {})
    .map(([y, m]) => [y, Math.max(0, Number(m) || 0)])
    .sort((a, b) => Number(b[0]) - Number(a[0]));

export const logTotalMinutes = (item) => logEntries(item).reduce((s, [, m]) => s + m, 0);
export const hasWatchLog = (item) => logEntries(item).length > 0;
export const yearMinutes = (item, year) => Math.max(0, Number(item?.watchLog?.[year]) || 0);

// 754 → "12時間34分"
export const fmtMinutes = (min) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}分`;
  return m ? `${h}時間${m}分` : `${h}時間`;
};

// 一覧のタグなど短い表示用：754 → "12.6h"
export const fmtHoursShort = (min) => `${(min / 60).toFixed(1)}h`;
