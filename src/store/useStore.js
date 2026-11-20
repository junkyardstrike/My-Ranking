import { create } from 'zustand';
import { DEFAULT_DURATIONS, normalizeGenre } from '../utils/itemMetrics';
import { getAllEntries, write, clearAll, STORES } from '../lib/db';
import { prepareImage, deleteImages, queueThumb, getImageBlob, blobToDataUrl } from '../lib/images';

// データの形
//   items:    { [id]: 作品 }            作品 1 件ずつ保存する。画像は img（画像キー）だけを持つ
//   rankings: [{ id, folderId, title, englishName, genre, cover, itemIds: [...] }]  順位 = itemIds の並び順
//   unranked: [id, ...]                 レコード（どのランキングにも入っていない作品）
//   folders:  [{ id, name, englishName, parentId, cover }]
// 以前の形式（作品の中に imageBase64、ランキングの中に items）とは、取り込み・書き出しの時に変換する。

const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));

const defaultSettings = () => ({ defaultDurations: { ...DEFAULT_DURATIONS }, useViewCount: true });
const mergeSettings = (saved) => ({
  ...defaultSettings(),
  ...(saved || {}),
  useViewCount: saved?.useViewCount ?? true,
  defaultDurations: { ...DEFAULT_DURATIONS, ...(saved?.defaultDurations || {}) },
});

// ---------------- 保存（変わった分だけ、少しまとめてから書く） ----------------
const SAVE_DELAY_MS = 200;
const dirtyItems = new Set();
const dirtyKv = new Set();
let saveTimer = null;

function flushSaves() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const state = useStore.getState();
  const ops = [];
  dirtyKv.forEach(key => ops.push({ store: STORES.kv, key, value: state[key] }));
  dirtyItems.forEach(id => ops.push({ store: STORES.items, key: id, value: state.items[id] }));
  dirtyKv.clear();
  dirtyItems.clear();
  return write(ops).catch(err => console.error('保存に失敗しました', err));
}
const scheduleSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSaves, SAVE_DELAY_MS);
};
// アプリを閉じる・別のアプリに切り替える時は待たずに保存する
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSaves(); });
window.addEventListener('pagehide', flushSaves);

// state の更新と、保存対象の記録をまとめて行う
function commit(set, next, { items = [], kv = [] } = {}) {
  set(next);
  items.forEach(id => dirtyItems.add(id));
  kv.forEach(k => dirtyKv.add(k));
  scheduleSave();
}

// ---------------- 派生データ（データが変わった時だけ作り直す） ----------------
// 作品 id → { rankingId, index }
let placementCache = { rankings: null, map: new Map() };
export function getPlacement(state) {
  if (placementCache.rankings === state.rankings) return placementCache.map;
  const map = new Map();
  state.rankings.forEach(r => r.itemIds.forEach((id, index) => { if (!map.has(id)) map.set(id, { rankingId: r.id, index }); }));
  placementCache = { rankings: state.rankings, map };
  return map;
}

// 全作品（以前の getAllItems と同じ内容・順番）。ランキング内はタイトルのある作品のみ、その後にレコード
let allCache = { rankings: null, unranked: null, items: null, list: [] };
export function getAllEntries_(state) {
  if (allCache.rankings === state.rankings && allCache.unranked === state.unranked && allCache.items === state.items) return allCache.list;
  const list = [];
  state.rankings.forEach(r => r.itemIds.forEach((id, index) => {
    const item = state.items[id];
    if (!item || !item.title) return;
    list.push({ id, item, isSelected: true, rankingId: r.id, rankingTitle: r.title, currentRank: index + 1, genre: normalizeGenre(item.genre || r.genre) });
  }));
  state.unranked.forEach(id => {
    const item = state.items[id];
    if (!item) return;
    list.push({ id, item, isSelected: false, rankingId: null, rankingTitle: null, currentRank: undefined, genre: normalizeGenre(item.genre) });
  });
  allCache = { rankings: state.rankings, unranked: state.unranked, items: state.items, list };
  return list;
}
export { getAllEntries_ as getAllItems };

// 作品のジャンル（ランキング内の作品はランキングのジャンルを既定にする）
export const itemGenre = (state, id) => {
  const item = state.items[id];
  const place = getPlacement(state).get(id);
  const rankingGenre = place ? state.rankings.find(r => r.id === place.rankingId)?.genre : undefined;
  return normalizeGenre(item?.genre || rankingGenre);
};

// ---------------- 以前の形式との変換 ----------------
const DERIVED_FIELDS = ['imageBase64', 'currentRank', 'rankingId', 'isSelected', 'rankingTitle'];
const stripItem = (raw) => {
  const item = { ...raw };
  DERIVED_FIELDS.forEach(k => delete item[k]);
  return item;
};

// 以前の形式のデータ → { state, ops（保存する内容）, thumbs（縮小画像を作る画像） }
function fromLegacy(data) {
  const items = {};
  const ops = [];
  const thumbs = [];
  const image = (src) => {
    if (!src || typeof src !== 'string') return null;
    try {
      const p = prepareImage(src);
      ops.push(p.op);
      thumbs.push([p.key, p.blob]);
      return p.key;
    } catch {
      return null;
    }
  };
  const addItem = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    let id = raw.id || generateId();
    if (items[id]) id = generateId(); // 同じ id が重複していた場合は別の作品として扱う
    items[id] = { ...stripItem(raw), id, img: image(raw.imageBase64) };
    return id;
  };
  const folders = (data.folders || []).map(f => {
    const { coverImageBase64, ...rest } = f;
    return { ...rest, cover: image(coverImageBase64) };
  });
  const rankings = (data.rankings || []).map(r => {
    const { coverImageBase64, items: rItems, ...rest } = r;
    return { ...rest, cover: image(coverImageBase64), itemIds: (Array.isArray(rItems) ? rItems : []).map(addItem).filter(Boolean) };
  });
  const unranked = (data.unrankedItems || []).map(addItem).filter(Boolean);
  const settings = mergeSettings(data.settings);
  Object.entries(items).forEach(([id, item]) => ops.push({ store: STORES.items, key: id, value: item }));
  ops.push(
    { store: STORES.kv, key: 'folders', value: folders },
    { store: STORES.kv, key: 'rankings', value: rankings },
    { store: STORES.kv, key: 'unranked', value: unranked },
    { store: STORES.kv, key: 'settings', value: settings },
  );
  return { state: { folders, rankings, unranked, items, settings }, ops, thumbs };
}

async function readLegacy() {
  try {
    const { default: localforage } = await import('localforage');
    const lf = localforage.createInstance({ name: 'RankingPWA', storeName: 'data' });
    const [folders, rankings, unrankedItems, settings] = await Promise.all(['folders', 'rankings', 'unrankedItems', 'settings'].map(k => lf.getItem(k)));
    if (!folders && !rankings && !unrankedItems && !settings) return null;
    return { folders: folders || [], rankings: rankings || [], unrankedItems: unrankedItems || [], settings, lf };
  } catch (err) {
    console.error('以前のデータの読み込みに失敗', err);
    return null;
  }
}

// 作品を以前の形式に（書き出し用）
async function toLegacyItem(item, extra) {
  const { img, ...rest } = item;
  const blob = img ? await getImageBlob(img) : null;
  return { ...rest, ...extra, imageBase64: blob ? await blobToDataUrl(blob) : null };
}
const coverToBase64 = async (key) => {
  const blob = key ? await getImageBlob(key) : null;
  return blob ? blobToDataUrl(blob) : null;
};

const translateToEnglish = async (text) => {
  if (!text) return '';
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data?.[0]?.[0]?.[0] || '';
  } catch {
    return '';
  }
};

const newEmptyItem = (genre) => ({
  id: generateId(), previousRanks: [], title: '', color: '#ffffff', fontSize: 20, img: null, memo: '', createdAt: null, author: '', isBold: false, views: 0, rating: 0, genre,
});

// ランキングから外した作品をレコード用に整える
const toRecord = (item, rankingGenre) => ({ ...item, genre: item.genre || rankingGenre, previousRanks: [] });

// 100 枠を超えた分を、後ろの空き枠から削る。空き枠が無ければ最下位の作品をレコードに戻す
function trimTo100(ids, items, protectId) {
  const removedEmpty = [];
  const overflowed = [];
  while (ids.length > 100) {
    let emptyIdx = -1;
    for (let k = ids.length - 1; k >= 0; k--) {
      if (!items[ids[k]]?.title && ids[k] !== protectId) { emptyIdx = k; break; }
    }
    if (emptyIdx !== -1) removedEmpty.push(ids.splice(emptyIdx, 1)[0]);
    else overflowed.push(ids.pop());
  }
  return { removedEmpty, overflowed };
}

// 履歴に今の順位を記録する（順位が変わった作品のみ、最大 10 件）
function captureHistory(ranking, items) {
  const changed = {};
  ranking.itemIds.forEach((id, index) => {
    const item = items[id];
    if (!item || !item.title) return;
    const history = item.previousRanks || [];
    const rank = index + 1;
    if (history.length && history[history.length - 1].rank === rank) return;
    changed[id] = { ...item, previousRanks: [...history, { rank, date: new Date().toISOString() }].slice(-10) };
  });
  return changed;
}

const removeItems = (items, ids) => {
  const next = { ...items };
  const images = [];
  ids.forEach(id => { if (next[id]?.img) images.push(next[id].img); delete next[id]; });
  return { next, images };
};

const collectFolderIds = (rootId, folders) => {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) folders.forEach(f => { if (f.parentId === ids[i]) ids.push(f.id); });
  return ids;
};

export const useStore = create((set, get) => ({
  isInitialized: false,
  folders: [],
  rankings: [],
  unranked: [],
  items: {},
  settings: defaultSettings(),
  isEditMode: false,
  isReorderMode: false,

  init: async () => {
    if (get().isInitialized) return;
    const kv = await getAllEntries(STORES.kv);
    if (Object.keys(kv).length) {
      const items = await getAllEntries(STORES.items);
      set({ folders: kv.folders || [], rankings: kv.rankings || [], unranked: kv.unranked || [], items, settings: mergeSettings(kv.settings), isInitialized: true });
      return;
    }
    // 初回：以前の保存データ（RankingPWA）を新しい形式に移す。以前のデータはそのまま残しておく
    const legacy = await readLegacy();
    if (legacy) {
      const { state, ops, thumbs } = fromLegacy(legacy);
      await write(ops);
      set({ ...state, isInitialized: true });
      thumbs.forEach(([key, blob]) => queueThumb(key, blob));
      return;
    }
    // データが何も無い（初めて使う）場合も、新しい形式で保存済みの印を残す
    await write(['folders', 'rankings', 'unranked'].map(key => ({ store: STORES.kv, key, value: [] })));
    set({ isInitialized: true });
  },

  // 編集モードと並び替えモードは同時にONにしない
  setEditMode: (mode) => set(mode ? { isEditMode: true, isReorderMode: false } : { isEditMode: false }),
  setReorderMode: (mode) => set(mode ? { isReorderMode: true, isEditMode: false } : { isReorderMode: false }),

  updateSettings: (updates) => {
    commit(set, { settings: { ...get().settings, ...updates } }, { kv: ['settings'] });
  },

  // ---- フォルダ ----
  addFolder: async (name, parentId = null) => {
    const id = generateId();
    commit(set, { folders: [...get().folders, { id, name, englishName: '', parentId, cover: null }] }, { kv: ['folders'] });
    const englishName = await translateToEnglish(name);
    if (englishName) get().updateFolder(id, { englishName: englishName.toUpperCase() });
  },
  updateFolder: (id, updates) => {
    const prev = get().folders.find(f => f.id === id);
    if (updates.cover !== undefined && prev?.cover && prev.cover !== updates.cover) deleteImages([prev.cover]);
    commit(set, { folders: get().folders.map(f => (f.id === id ? { ...f, ...updates } : f)) }, { kv: ['folders'] });
  },
  // keepItems: true なら中のランキングの作品をレコードに戻す。false なら作品ごと削除
  deleteFolder: (id, { keepItems = false } = {}) => {
    const s = get();
    const folderIds = new Set(collectFolderIds(id, s.folders));
    const removedFolders = s.folders.filter(f => folderIds.has(f.id));
    const removedRankings = s.rankings.filter(r => folderIds.has(r.folderId));
    get()._removeRankings(removedRankings, keepItems, {
      folders: s.folders.filter(f => !folderIds.has(f.id)),
      rankings: s.rankings.filter(r => !folderIds.has(r.folderId)),
    }, removedFolders.map(f => f.cover));
  },
  reorderFolders: (activeId, overId) => {
    const folders = [...get().folders];
    const from = folders.findIndex(f => f.id === activeId);
    const to = folders.findIndex(f => f.id === overId);
    if (from === -1 || to === -1) return;
    folders.splice(to, 0, folders.splice(from, 1)[0]);
    commit(set, { folders }, { kv: ['folders'] });
  },

  // ---- ランキング ----
  addRanking: async (title, folderId = null, genre = 'other') => {
    const id = generateId();
    const empties = Array.from({ length: 100 }, () => newEmptyItem(genre));
    const items = { ...get().items };
    empties.forEach(it => { items[it.id] = it; });
    const ranking = { id, folderId, title, englishName: '', cover: null, genre, itemIds: empties.map(it => it.id) };
    commit(set, { rankings: [...get().rankings, ranking], items }, { kv: ['rankings'], items: empties.map(it => it.id) });
    const englishName = await translateToEnglish(title);
    if (englishName) get().updateRanking(id, { englishName: englishName.toUpperCase() });
  },
  updateRanking: (id, updates) => {
    const prev = get().rankings.find(r => r.id === id);
    if (updates.cover !== undefined && prev?.cover && prev.cover !== updates.cover) deleteImages([prev.cover]);
    commit(set, { rankings: get().rankings.map(r => (r.id === id ? { ...r, ...updates } : r)) }, { kv: ['rankings'] });
  },
  deleteRanking: (id, { keepItems = false } = {}) => {
    const s = get();
    get()._removeRankings(s.rankings.filter(r => r.id === id), keepItems, { rankings: s.rankings.filter(r => r.id !== id) }, []);
  },
  _removeRankings: (removed, keepItems, base, extraImages) => {
    const s = get();
    const unrankedSet = new Set(s.unranked);
    const kept = [];
    const dropped = [];
    let items = s.items;
    removed.forEach(r => r.itemIds.forEach(id => {
      const item = s.items[id];
      if (keepItems && item?.title && !unrankedSet.has(id)) kept.push([id, toRecord(item, r.genre)]);
      else dropped.push(id);
    }));
    const { next, images } = removeItems(items, dropped);
    items = next;
    kept.forEach(([id, item]) => { items[id] = item; });
    deleteImages([...images, ...removed.map(r => r.cover), ...extraImages]);
    commit(set, { ...base, items, unranked: keepItems ? [...kept.map(([id]) => id), ...s.unranked] : s.unranked },
      { kv: [...Object.keys(base), 'unranked'], items: [...dropped, ...kept.map(([id]) => id)] });
  },
  reorderRankings: (activeId, overId) => {
    const rankings = [...get().rankings];
    const from = rankings.findIndex(r => r.id === activeId);
    const to = rankings.findIndex(r => r.id === overId);
    if (from === -1 || to === -1) return;
    rankings.splice(to, 0, rankings.splice(from, 1)[0]);
    commit(set, { rankings }, { kv: ['rankings'] });
  },

  // ---- 作品 ----
  updateItem: (id, updates) => {
    const prev = get().items[id];
    if (!prev) return;
    if (updates.img !== undefined && prev.img && prev.img !== updates.img) deleteImages([prev.img]);
    commit(set, { items: { ...get().items, [id]: { ...prev, ...updates, id } } }, { items: [id] });
  },

  recordItem: (data) => {
    const item = {
      id: generateId(), title: data.title || '', author: data.author || '', memo: data.memo || '', rating: data.rating || 0, img: null,
      createdAt: new Date().toISOString(), views: 1, fontSize: 20, color: '#ffffff', isBold: false, previousRanks: [], genre: data.genre || 'other',
    };
    commit(set, { items: { ...get().items, [item.id]: item }, unranked: [item.id, ...get().unranked] }, { items: [item.id], kv: ['unranked'] });
    return item;
  },

  // 順位を変更する。captureHistory=true なら変更後の順位を履歴に残す（ランキング画面での操作）
  moveItem: (rankingId, itemId, targetRank, { captureHistory: withHistory = false } = {}) => {
    const s = get();
    const ranking = s.rankings.find(r => r.id === rankingId);
    if (!ranking || !ranking.itemIds.includes(itemId)) return;
    const ids = ranking.itemIds.filter(id => id !== itemId);
    ids.splice(Math.max(0, Math.min(targetRank - 1, ranking.itemIds.length - 1)), 0, itemId);
    get()._setRankingOrder(ranking, ids, withHistory);
  },
  // ドラッグでの並び替え（active を over の位置へ）
  reorderRankingItems: (rankingId, activeId, overId) => {
    const ranking = get().rankings.find(r => r.id === rankingId);
    if (!ranking) return;
    const from = ranking.itemIds.indexOf(activeId);
    const to = ranking.itemIds.indexOf(overId);
    if (from === -1 || to === -1) return;
    const ids = [...ranking.itemIds];
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    get()._setRankingOrder(ranking, ids, true);
  },
  _setRankingOrder: (ranking, ids, withHistory) => {
    const s = get();
    const nextRanking = { ...ranking, itemIds: ids };
    const rankings = s.rankings.map(r => (r.id === ranking.id ? nextRanking : r));
    if (!withHistory) { commit(set, { rankings }, { kv: ['rankings'] }); return; }
    const changed = captureHistory(nextRanking, s.items);
    commit(set, { rankings, items: { ...s.items, ...changed } }, { kv: ['rankings'], items: Object.keys(changed) });
  },

  insertItemIntoRanking: (rankingId, itemId, targetRank) => {
    const s = get();
    const ranking = s.rankings.find(r => r.id === rankingId);
    const item = s.items[itemId];
    if (!ranking || !item) return;
    const ids = ranking.itemIds.filter(id => id !== itemId);
    ids.splice(targetRank - 1, 0, itemId);
    const { removedEmpty, overflowed } = trimTo100(ids, s.items, itemId);
    const { next: items } = removeItems(s.items, removedEmpty);
    items[itemId] = { ...item, genre: item.genre || ranking.genre };
    commit(set, {
      items,
      rankings: s.rankings.map(r => (r.id === rankingId ? { ...r, itemIds: ids } : r)),
      unranked: [...overflowed, ...s.unranked.filter(id => id !== itemId)],
    }, { kv: ['rankings', 'unranked'], items: [itemId, ...removedEmpty] });
  },

  bulkInsertItemsIntoRanking: (rankingId, itemIds) => {
    const s = get();
    const ranking = s.rankings.find(r => r.id === rankingId);
    if (!ranking) return 0;
    const filled = ranking.itemIds.filter(id => s.items[id]?.title);
    const empty = ranking.itemIds.filter(id => !s.items[id]?.title);
    const existing = new Set(filled);
    // 100 枠に収まる分だけ追加し、入りきらない作品はレコードに残す
    const toAdd = itemIds.filter(id => !existing.has(id) && s.items[id]).slice(0, Math.max(0, 100 - filled.length));
    const newFilled = [...filled, ...toAdd];
    const keptEmpty = empty.slice(0, Math.max(0, 100 - newFilled.length));
    const { next: items } = removeItems(s.items, empty.slice(keptEmpty.length));
    toAdd.forEach(id => { items[id] = { ...items[id], genre: items[id].genre || ranking.genre }; });
    const added = new Set(toAdd);
    commit(set, {
      items,
      rankings: s.rankings.map(r => (r.id === rankingId ? { ...r, itemIds: [...newFilled, ...keptEmpty] } : r)),
      unranked: s.unranked.filter(id => !added.has(id)),
    }, { kv: ['rankings', 'unranked'], items: [...toAdd, ...empty.slice(keptEmpty.length)] });
    return toAdd.length;
  },

  // ---- バックアップ ----
  exportData: async () => {
    await flushSaves();
    const s = get();
    const rankings = [];
    for (const r of s.rankings) {
      const { cover, itemIds, ...rest } = r;
      const items = [];
      for (let i = 0; i < itemIds.length; i++) {
        const item = s.items[itemIds[i]];
        if (item) items.push(await toLegacyItem(item, { currentRank: i + 1 }));
      }
      rankings.push({ ...rest, coverImageBase64: await coverToBase64(cover), items });
    }
    const folders = [];
    for (const f of s.folders) {
      const { cover, ...rest } = f;
      folders.push({ ...rest, coverImageBase64: await coverToBase64(cover) });
    }
    const unrankedItems = [];
    for (const id of s.unranked) if (s.items[id]) unrankedItems.push(await toLegacyItem(s.items[id], {}));
    return { rankings, folders, unrankedItems, settings: s.settings, exportedAt: new Date().toISOString() };
  },

  importData: async (data) => {
    if (!data || typeof data !== 'object' || !Array.isArray(data.rankings ?? []) || !Array.isArray(data.folders ?? []) || !Array.isArray(data.unrankedItems ?? [])) {
      throw new Error('Invalid backup format');
    }
    const { state, ops, thumbs } = fromLegacy({ ...data, settings: data.settings || get().settings });
    clearTimeout(saveTimer);
    dirtyItems.clear();
    dirtyKv.clear();
    await clearAll();
    await write(ops);
    set({ ...state, isInitialized: true });
    thumbs.forEach(([key, blob]) => queueThumb(key, blob));
    return true;
  },

  clearData: async () => {
    // 保存待ちのデータが消去後に書き戻されないよう破棄する
    clearTimeout(saveTimer);
    dirtyItems.clear();
    dirtyKv.clear();
    await clearAll();
    // 空の状態を保存しておく（次回起動時に以前の形式のデータを再度移行しないように）
    await write([
      { store: STORES.kv, key: 'folders', value: [] },
      { store: STORES.kv, key: 'rankings', value: [] },
      { store: STORES.kv, key: 'unranked', value: [] },
      { store: STORES.kv, key: 'settings', value: defaultSettings() },
    ]);
    const legacy = await readLegacy();
    if (legacy) await legacy.lf.clear().catch(() => {});
    set({ folders: [], rankings: [], unranked: [], items: {}, settings: defaultSettings() });
    return true;
  },
}));

export { flushSaves };
