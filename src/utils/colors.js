// 白背景で読めない明るい文字色（旧テーマの既定値 #ffffff など）は本文色に置き換える
export const readableTitleColor = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return undefined;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? undefined : `#${m[1]}`;
};
