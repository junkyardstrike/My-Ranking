// 作品カード・詳細モーダル・STATS で同じ計算結果になるよう、所要時間の計算はここに集約する。
// game のみ「時間」単位、それ以外は「分」単位。

export const DEFAULT_DURATIONS = {
  movie: 120,
  music: 3,
  anime: 20,
  drama: 40,
  manga: 30,
  // ゲームは所要時間を作品ごとに入力した場合のみ集計する
  game: 0,
};

// 旧データの 'other' やジャンル未設定は「音楽」として扱う（カード表示と同じ扱い）
export const normalizeGenre = (genre) => (!genre || genre === 'other' ? 'music' : genre);

export const getDefaultDuration = (genre, settings) => {
  const g = normalizeGenre(genre);
  const raw = settings?.defaultDurations?.[g];
  const saved = Number(raw);
  if (raw !== undefined && raw !== null && raw !== '' && Number.isFinite(saved) && saved >= 0) return saved;
  return DEFAULT_DURATIONS[g] ?? 0;
};

// 1回あたりの掛け数（アニメ/ドラマ=話数、漫画=巻数、その他=1）
export const getUnitMultiplier = (item) => {
  const g = normalizeGenre(item?.genre);
  if (g === 'manga') return Number(item?.volumes) || 1;
  if (g === 'anime' || g === 'drama') return Number(item?.episodes) || 1;
  return 1;
};

export const getItemMetrics = (item, settings) => {
  const genre = normalizeGenre(item?.genre);
  const isGame = genre === 'game';
  const ownDuration = Number(item?.duration);
  const hasOwnDuration = Number.isFinite(ownDuration) && ownDuration > 0;
  const unitDuration = hasOwnDuration ? ownDuration : getDefaultDuration(genre, settings);
  const multiplier = getUnitMultiplier(item);
  const viewCount = settings?.useViewCount === false ? 1 : (Number(item?.views) || 1);
  const totalHours = isGame
    ? unitDuration * viewCount
    : (unitDuration * multiplier * viewCount) / 60;

  return { genre, isGame, unitDuration, hasOwnDuration, multiplier, viewCount, totalHours };
};

// ISO 文字列 → <input type="date"> 用の「端末のローカル日付」(YYYY-MM-DD)
export const toDateInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// <input type="date"> の値 → ISO 文字列（ローカル日付の 0 時）。空なら null
export const fromDateInputValue = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date.toISOString();
};
