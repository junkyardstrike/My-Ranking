import { Tv, BookOpen, Film, Clapperboard, Music, Gamepad2 } from 'lucide-react';

export const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv },
  { id: 'manga', label: '漫画', icon: BookOpen },
  { id: 'movie', label: '映画', icon: Film },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard },
  { id: 'game', label: 'ゲーム', icon: Gamepad2 },
  { id: 'music', label: '音楽', icon: Music },
];

export const GENRE_COLORS = {
  anime: '#0a7a6f', manga: '#c13b7a', movie: '#ff5a3c', drama: '#e2a400', game: '#3c5bd6', music: '#7a8a89', other: '#7a8a89',
};

export const GENRE_LABELS = {
  anime: 'アニメ', manga: '漫画', movie: '映画', drama: 'ドラマ', game: 'ゲーム', music: '音楽',
};

// 同じ名前の作品が既にあれば確認する。登録してよければ true
export function confirmDuplicate(entries, title, selfId) {
  const t = title.toLowerCase().trim();
  const dups = entries.filter(e => e.id !== selfId && e.item.title?.toLowerCase().trim() === t);
  if (!dups.length) return true;
  const detail = dups.map(e => `・「${GENRE_LABELS[e.genre] || e.genre}」の「${e.rankingTitle || 'レコード一覧'}」`).join('\n');
  return confirm(`【重複注意】\n「${title}」は既に以下の場所に登録されています：\n\n${detail}\n\nこのまま登録しますか？`);
}

// 自動取得したメモから巻数・話数を読み取る
export function extractCounts(memo, genre) {
  const updates = {};
  if (!memo) return updates;
  if (genre === 'manga') {
    const m = memo.match(/VOLUMES:\s*全?(\d+)巻/i) || memo.match(/全(\d+)巻/) || memo.match(/(\d+)巻/);
    if (m?.[1]) updates.volumes = parseInt(m[1]);
  } else if (genre === 'anime' || genre === 'drama') {
    const m = memo.match(/EPISODES:\s*(\d+)話/i) || memo.match(/全(\d+)話/) || memo.match(/(\d+)話/);
    if (m?.[1]) updates.episodes = parseInt(m[1]);
  }
  return updates;
}
