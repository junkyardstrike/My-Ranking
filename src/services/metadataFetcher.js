/**
 * Auto-fetch metadata from external APIs based on genre.
 * - Anime: Jikan API (MyAnimeList)
 * - Manga: Jikan API (MyAnimeList)
 * - Drama/Movie: TVMaze API
 */

const JIKAN_BASE = 'https://api.jikan.moe/v4';
const TVMAZE_BASE = 'https://api.tvmaze.com';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function fetchAnimeMetadata(title) {
  try {
    const res = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    
    const anime = data.data[0];
    const studios = (anime.studios || []).map(s => s.name).join(', ');
    const genres = (anime.genres || []).map(g => g.name).join(', ');
    const producers = (anime.producers || []).map(p => p.name).join(', ');
    const status = anime.status || '不明';
    const episodes = anime.episodes ? `${anime.episodes}話` : '不明';
    const score = anime.score ? `${anime.score} / 10` : '未評価';
    const aired = anime.aired?.string || '不明';
    const synopsis = anime.synopsis ? anime.synopsis.substring(0, 200) + (anime.synopsis.length > 200 ? '...' : '') : '';
    const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null;
    
    const memo = [
      `━━━ AUTO FETCHED ━━━`,
      `STUDIO: ${studios || '不明'}`,
      `GENRE: ${genres || '不明'}`,
      `PRODUCER: ${producers || '不明'}`,
      `STATUS: ${status}`,
      `EPISODES: ${episodes}`,
      `AIRED: ${aired}`,
      `SCORE: ${score}`,
      synopsis ? `\n${synopsis}` : '',
    ].filter(Boolean).join('\n');

    return { 
      memo, 
      author: studios || '',
      imageUrl,
    };
  } catch (err) {
    console.error('Anime fetch error:', err);
    return null;
  }
}

export async function fetchMangaMetadata(title) {
  try {
    const res = await fetch(`${JIKAN_BASE}/manga?q=${encodeURIComponent(title)}&limit=1`);
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    
    const manga = data.data[0];
    const authors = (manga.authors || []).map(a => a.name).join(', ');
    const genres = (manga.genres || []).map(g => g.name).join(', ');
    const serializations = (manga.serializations || []).map(s => s.name).join(', ');
    const status = manga.status || '不明';
    const chapters = manga.chapters ? `${manga.chapters}話` : '連載中';
    const volumes = manga.volumes ? `全${manga.volumes}巻` : '刊行中';
    const score = manga.score ? `${manga.score} / 10` : '未評価';
    const synopsis = manga.synopsis ? manga.synopsis.substring(0, 200) + (manga.synopsis.length > 200 ? '...' : '') : '';
    const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || null;
    
    const memo = [
      `━━━ AUTO FETCHED ━━━`,
      `AUTHOR: ${authors || '不明'}`,
      `GENRE: ${genres || '不明'}`,
      `SERIALIZATION: ${serializations || '不明'}`,
      `STATUS: ${status}`,
      `VOLUMES: ${volumes}`,
      `CHAPTERS: ${chapters}`,
      `SCORE: ${score}`,
      synopsis ? `\n${synopsis}` : '',
    ].filter(Boolean).join('\n');

    return { 
      memo, 
      author: authors || '',
      imageUrl,
    };
  } catch (err) {
    console.error('Manga fetch error:', err);
    return null;
  }
}

export async function fetchDramaMetadata(title) {
  try {
    const res = await fetch(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(title)}`);
    const data = await res.json();
    if (!data || data.length === 0) return null;
    
    const show = data[0].show;
    const genres = (show.genres || []).join(', ');
    const network = show.network?.name || show.webChannel?.name || '不明';
    const status = show.status || '不明';
    const premiered = show.premiered || '不明';
    const rating = show.rating?.average ? `${show.rating.average} / 10` : '未評価';
    const language = show.language || '不明';
    const summary = stripHtml(show.summary || '');
    const shortSummary = summary.substring(0, 200) + (summary.length > 200 ? '...' : '');
    const imageUrl = show.image?.original || show.image?.medium || null;
    
    const memo = [
      `━━━ AUTO FETCHED ━━━`,
      `PLATFORM: ${network}`,
      `GENRE: ${genres || '不明'}`,
      `STATUS: ${status}`,
      `PREMIERED: ${premiered}`,
      `LANGUAGE: ${language}`,
      `RATING: ${rating}`,
      shortSummary ? `\n${shortSummary}` : '',
    ].filter(Boolean).join('\n');

    return { 
      memo, 
      author: network || '',
      imageUrl,
    };
  } catch (err) {
    console.error('Drama/Movie fetch error:', err);
    return null;
  }
}

export async function fetchMovieMetadata(title) {
  // TVMaze is primarily for TV shows. For movies we attempt the same API
  // but note results may be less accurate without a dedicated movie API.
  return fetchDramaMetadata(title);
}

export async function fetchMetadata(title, genre) {
  switch (genre) {
    case 'anime':
      return fetchAnimeMetadata(title);
    case 'manga':
      return fetchMangaMetadata(title);
    case 'drama':
      return fetchDramaMetadata(title);
    case 'movie':
      return fetchMovieMetadata(title);
    default:
      return null;
  }
}
