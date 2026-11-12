import { create } from 'zustand';
import localforage from 'localforage';
import { DEFAULT_DURATIONS, normalizeGenre } from '../utils/itemMetrics';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

localforage.config({
  name: 'RankingPWA',
  storeName: 'data'
});

const loadData = async (key, defaultValue) => {
  try {
    const value = await localforage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (err) {
    console.error('Error loading data', err);
    return defaultValue;
  }
};

const saveDataNow = async (key, value) => {
  try {
    await localforage.setItem(key, value);
  } catch (err) {
    console.error('Error saving data', err);
  }
};

// 保存はまとめて少し遅らせる。画像を含む全データを操作のたびに保存すると、
// 閲覧回数の＋などを押すたびに画面が一瞬固まり、反応が遅く感じるため。
const SAVE_DELAY_MS = 200;
const pendingSaves = new Map();
let saveTimer = null;
const flushSaves = () => {
  clearTimeout(saveTimer);
  saveTimer = null;
  const entries = [...pendingSaves.entries()];
  pendingSaves.clear();
  return Promise.all(entries.map(([key, value]) => saveDataNow(key, value)));
};
const saveData = (key, value) => {
  pendingSaves.set(key, value);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSaves, SAVE_DELAY_MS);
};
// アプリを閉じる・別のアプリに切り替える時は、待たずにすぐ保存する
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSaves(); });
  window.addEventListener('pagehide', flushSaves);
}

// getAllItems() が表示用に付与する項目は保存データに混ぜない
const stripDerivedFields = (item) => {
  const rest = { ...item };
  delete rest.isSelected;
  delete rest.rankingTitle;
  delete rest.rankingId;
  return rest;
};

// 削除するランキングの作品をレコード（未ランクイン）に戻す形に変換する
const toUnrankedItems = (rankingsToRemove, existingUnranked) => {
  const existingIds = new Set(existingUnranked.map(i => i.id));
  return rankingsToRemove.flatMap(r =>
    (r.items || [])
      .filter(item => item.title && !existingIds.has(item.id))
      .map(item => {
        const rest = stripDerivedFields(item);
        delete rest.currentRank;
        return { ...rest, genre: item.genre || r.genre, previousRanks: [] };
      })
  );
};

const translateToEnglish = async (text) => {
  if (!text) return '';
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
  } catch (err) {
    console.error('Translation error', err);
  }
  return '';
};

// id → 作品 の索引。各作品カードが毎回全ランキングを走査しないよう、データが変わった時だけ作り直す
let itemIndexCache = { rankings: null, unrankedItems: null, map: new Map() };
export const getItemIndex = (state) => {
  if (state.rankings === itemIndexCache.rankings && state.unrankedItems === itemIndexCache.unrankedItems) {
    return itemIndexCache.map;
  }
  const map = new Map();
  (state.rankings || []).forEach(r => (r.items || []).forEach(item => { if (!map.has(item.id)) map.set(item.id, item); }));
  (state.unrankedItems || []).forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
  itemIndexCache = { rankings: state.rankings, unrankedItems: state.unrankedItems, map };
  return map;
};

export const useStore = create((set, get) => ({
  isInitialized: false,
  folders: [], 
  rankings: [], 
  unrankedItems: [], 
  isEditMode: false,
  isReorderMode: false,
  viewMode: 'list', 
  currentFolderId: null,
  settings: {
    defaultDurations: { ...DEFAULT_DURATIONS },
    useViewCount: true
  },

  init: async () => {
    const folders = await loadData('folders', []);
    const rankings = await loadData('rankings', []);
    const unrankedItems = await loadData('unrankedItems', []);
    
    const defaultSettings = {
      defaultDurations: { ...DEFAULT_DURATIONS },
      useViewCount: true
    };
    
    const savedSettings = await loadData('settings', defaultSettings);
    // Merge saved settings with defaults to ensure new fields (like useViewCount) exist
    const settings = {
      ...defaultSettings,
      ...savedSettings,
      defaultDurations: {
        ...defaultSettings.defaultDurations,
        ...(savedSettings?.defaultDurations || {})
      }
    };

    set({ folders, rankings, unrankedItems, settings, isInitialized: true });
  },

  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  // 編集モードと並び替えモードは同時にONにしない
  setEditMode: (mode) => set(mode ? { isEditMode: true, isReorderMode: false } : { isEditMode: false }),
  setReorderMode: (mode) => set(mode ? { isReorderMode: true, isEditMode: false } : { isReorderMode: false }),
  
  setFolders: (folders) => {
    set({ folders });
    saveData('folders', folders);
  },

  setRankings: (rankings) => {
    set({ rankings });
    saveData('rankings', rankings);
  },

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      saveData('settings', newSettings);
      return { settings: newSettings };
    });
  },
  
  getAllItems: () => {
    const state = get();
    const rankedItems = state.rankings.flatMap(r => 
      (r.items || []).filter(item => item.title).map(item => ({ 
        ...item, 
        rankingId: r.id, 
        isSelected: true,
        rankingTitle: r.title,
        genre: normalizeGenre(item.genre || r.genre)
      }))
    );
    return [...rankedItems, ...state.unrankedItems.map(item => ({ 
      ...item, 
      isSelected: false,
      genre: normalizeGenre(item.genre)
    }))];
  },

  addFolder: async (name, parentId = null) => {
    const id = generateId();
    const newFolder = { id, name, englishName: '', parentId, coverImageBase64: null };
    set((state) => {
      const folders = [...state.folders, newFolder];
      saveData('folders', folders);
      return { folders };
    });
    const englishName = await translateToEnglish(name);
    if (englishName) {
      set((state) => {
        const folders = state.folders.map(f => f.id === id ? { ...f, englishName: englishName.toUpperCase() } : f);
        saveData('folders', folders);
        return { folders };
      });
    }
  },

  updateFolder: async (id, updates) => {
    set((state) => {
      const folders = state.folders.map(f => f.id === id ? { ...f, ...updates } : f);
      saveData('folders', folders);
      return { folders };
    });
  },

  // keepItems: true なら中のランキングの作品をレコードに戻す。false なら作品ごと削除
  deleteFolder: (id, { keepItems = false } = {}) => {
    set((state) => {
      // Helper for recursive deletion
      const getAllChildFolderIds = (parentId, allFolders) => {
        let ids = [parentId];
        const children = allFolders.filter(f => f.parentId === parentId);
        children.forEach(child => {
          ids = [...ids, ...getAllChildFolderIds(child.id, allFolders)];
        });
        return ids;
      };

      const folderIdsToDelete = getAllChildFolderIds(id, state.folders);
      
      const folders = state.folders.filter(f => !folderIdsToDelete.includes(f.id));
      const rankings = state.rankings.filter(r => !folderIdsToDelete.includes(r.folderId));
      const removedRankings = state.rankings.filter(r => folderIdsToDelete.includes(r.folderId));
      const unrankedItems = keepItems
        ? [...toUnrankedItems(removedRankings, state.unrankedItems), ...state.unrankedItems]
        : state.unrankedItems;
      
      saveData('folders', folders);
      saveData('rankings', rankings);
      saveData('unrankedItems', unrankedItems);
      
      return { folders, rankings, unrankedItems };
    });
  },

  addRanking: async (title, folderId = null, genre = 'other') => {
    const initialItems = Array.from({ length: 100 }, (_, i) => ({
      id: generateId(), currentRank: i + 1, previousRanks: [], title: '', color: '#ffffff', fontSize: 20, imageBase64: null, memo: '', createdAt: null, author: '', isBold: false, views: 0, rating: 0, genre
    }));
    const id = generateId();
    const newRanking = { id, folderId, title, englishName: '', coverImageBase64: null, genre, items: initialItems };
    set((state) => {
      const rankings = [...state.rankings, newRanking];
      saveData('rankings', rankings);
      return { rankings };
    });
    const englishName = await translateToEnglish(title);
    if (englishName) {
      set((state) => {
        const rankings = state.rankings.map(r => r.id === id ? { ...r, englishName: englishName.toUpperCase() } : r);
        saveData('rankings', rankings);
        return { rankings };
      });
    }
  },

  // keepItems: true なら作品をレコードに戻す。false なら作品ごと削除
  deleteRanking: (id, { keepItems = false } = {}) => {
    set((state) => {
      const rankings = state.rankings.filter(r => r.id !== id);
      const removed = state.rankings.filter(r => r.id === id);
      const unrankedItems = keepItems
        ? [...toUnrankedItems(removed, state.unrankedItems), ...state.unrankedItems]
        : state.unrankedItems;
      saveData('rankings', rankings);
      saveData('unrankedItems', unrankedItems);
      return { rankings, unrankedItems };
    });
  },

  updateRanking: async (id, updates) => {
    set((state) => {
      const rankings = state.rankings.map(r => r.id === id ? { ...r, ...updates } : r);
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  updateRankingItems: (rankingId, newItems) => {
    set((state) => {
      const rankings = state.rankings.map(r => r.id === rankingId ? { ...r, items: newItems } : r);
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  updateRankingItem: (rankingId, itemId, updates) => {
    set((state) => {
      const rankings = state.rankings.map(r => {
        if (r.id !== rankingId) return r;
        return { ...r, items: r.items.map(item => item.id === itemId ? { ...item, ...updates } : item) };
      });
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  // Unified Update Action for any item
  updateItem: (itemId, updates) => {
    set(state => {
      // Update in rankings
      const newRankings = state.rankings.map(r => (
        r.items.some(item => item.id === itemId)
          ? { ...r, items: r.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }
          : r
      ));

      // Update in unrankedItems
      const newUnrankedItems = state.unrankedItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );

      // 変わった方だけ保存し、変わっていない方は同じ配列を返して再描画も避ける
      const rankingsChanged = state.rankings.some(r => r.items.some(item => item.id === itemId));
      const unrankedChanged = state.unrankedItems.some(item => item.id === itemId);
      const next = {};
      if (rankingsChanged) { saveData('rankings', newRankings); next.rankings = newRankings; }
      if (unrankedChanged) { saveData('unrankedItems', newUnrankedItems); next.unrankedItems = newUnrankedItems; }
      return next;
    });
  },

  recordItem: (data) => {
    const newItem = {
      id: generateId(),
      title: data.title || '',
      author: data.author || '',
      memo: data.memo || '',
      rating: data.rating || 0,
      imageBase64: data.imageBase64 || null,
      createdAt: new Date().toISOString(),
      views: 0,
      fontSize: 20,
      color: '#ffffff',
      isBold: false,
      previousRanks: [],
      genre: data.genre || 'other'
    };
    set(state => {
      const unrankedItems = [newItem, ...state.unrankedItems];
      saveData('unrankedItems', unrankedItems);
      return { unrankedItems };
    });
    return newItem;
  },

  moveItemToRank: (rankingId, itemId, targetRank) => {
    set(state => {
      const ranking = state.rankings.find(r => r.id === rankingId);
      if (!ranking) return state;
      
      const itemToMove = ranking.items.find(i => i.id === itemId);
      if (!itemToMove) return state;

      const otherItems = ranking.items.filter(i => i.id !== itemId);
      const newIndex = Math.max(0, Math.min(targetRank - 1, ranking.items.length - 1));
      
      const newItems = [...otherItems];
      newItems.splice(newIndex, 0, { ...itemToMove, currentRank: targetRank });
      
      const finalItems = newItems.map((item, i) => ({ ...item, currentRank: i + 1 }));
      const rankings = state.rankings.map(r => r.id === rankingId ? { ...r, items: finalItems } : r);
      
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  insertItemIntoRanking: (targetRankingId, itemToInsert, targetRank) => {
    set(state => {
      const ranking = state.rankings.find(r => r.id === targetRankingId);
      if (!ranking) return state;
      const itemToRank = { ...stripDerivedFields(itemToInsert), currentRank: targetRank, genre: itemToInsert.genre || ranking.genre };
      let newItems = [...ranking.items].filter(i => i.id !== itemToInsert.id);
      newItems.splice(targetRank - 1, 0, itemToRank);
      // 100枠を超えた分は、後ろの空き枠から削る。空き枠が無ければ最下位の作品をレコードに戻す（作品を消さない）
      const overflowed = [];
      while (newItems.length > 100) {
        let emptyIdx = -1;
        for (let k = newItems.length - 1; k >= 0; k--) {
          if (!newItems[k].title && newItems[k].id !== itemToInsert.id) { emptyIdx = k; break; }
        }
        if (emptyIdx !== -1) newItems.splice(emptyIdx, 1);
        else overflowed.push(newItems.pop());
      }
      const finalItems = newItems.map((item, i) => ({ ...item, currentRank: i + 1 }));
      const rankings = state.rankings.map(r => r.id === targetRankingId ? { ...r, items: finalItems } : r);
      const unrankedItems = [
        ...overflowed.map(item => {
          const rest = stripDerivedFields(item);
          delete rest.currentRank;
          return rest;
        }),
        ...state.unrankedItems.filter(i => i.id !== itemToInsert.id)
      ];
      saveData('rankings', rankings);
      saveData('unrankedItems', unrankedItems);
      return { rankings, unrankedItems };
    });
  },

  bulkInsertItemsIntoRanking: (targetRankingId, itemsToInsert) => {
    let insertedCount = 0;
    set(state => {
      const ranking = state.rankings.find(r => r.id === targetRankingId);
      if (!ranking) return state;

      // Filter out items that are already in the ranking
      const existingIds = new Set(ranking.items.filter(i => i.title).map(i => i.id));
      const currentItems = [...ranking.items];
      const filledItems = currentItems.filter(i => i.title);
      const emptyItems = currentItems.filter(i => !i.title);
      // 100枠に収まる分だけ追加し、入りきらない作品はレコードに残す
      const capacity = Math.max(0, 100 - filledItems.length);
      const validNewItems = itemsToInsert.filter(i => !existingIds.has(i.id)).slice(0, capacity);
      const insertedIds = new Set(validNewItems.map(i => i.id));
      insertedCount = validNewItems.length;

      // Add new items
      const newFilledItems = [
        ...filledItems,
        ...validNewItems.map((item, idx) => ({
          ...stripDerivedFields(item),
          genre: item.genre || ranking.genre,
          currentRank: filledItems.length + idx + 1
        }))
      ];

      // Re-fill to 100
      const finalItems = [
        ...newFilledItems,
        ...emptyItems.slice(0, Math.max(0, 100 - newFilledItems.length))
      ].map((item, i) => ({ ...item, currentRank: i + 1 }));

      const rankings = state.rankings.map(r => r.id === targetRankingId ? { ...r, items: finalItems } : r);
      const unrankedItems = state.unrankedItems.filter(i => !insertedIds.has(i.id));

      saveData('rankings', rankings);
      saveData('unrankedItems', unrankedItems);
      return { rankings, unrankedItems };
    });
    return insertedCount;
  },

  captureRankHistory: (rankingId) => {
    set(state => {
      const rankings = state.rankings.map(r => {
        if (r.id !== rankingId) return r;
        const newItems = (r.items || []).map(item => {
          if (!item.title) return item;
          const history = item.previousRanks || [];
          const lastRank = history.length > 0 ? history[history.length - 1].rank : null;
          if (lastRank === item.currentRank) return item;
          
          return {
            ...item,
            previousRanks: [
              ...history,
              { rank: item.currentRank, date: new Date().toISOString() }
            ].slice(-10)
          };
        });
        return { ...r, items: newItems };
      });
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  moveRanking: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.rankings.findIndex(r => r.id === activeId);
      const newIndex = state.rankings.findIndex(r => r.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      
      const newRankings = [...state.rankings];
      const [moved] = newRankings.splice(oldIndex, 1);
      newRankings.splice(newIndex, 0, moved);
      
      saveData('rankings', newRankings);
      return { rankings: newRankings };
    });
  },

  moveFolder: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.folders.findIndex(f => f.id === activeId);
      const newIndex = state.folders.findIndex(f => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      
      const newFolders = [...state.folders];
      const [moved] = newFolders.splice(oldIndex, 1);
      newFolders.splice(newIndex, 0, moved);
      
      saveData('folders', newFolders);
      return { folders: newFolders };
    });
  },

  importData: async (data) => {
    if (!data || typeof data !== 'object' || !Array.isArray(data.rankings ?? []) || !Array.isArray(data.folders ?? []) || !Array.isArray(data.unrankedItems ?? [])) {
      throw new Error('Invalid backup format');
    }
    const folders = data.folders ?? [];
    const unrankedItems = data.unrankedItems ?? [];
    // items が欠けたランキングがあると各画面が落ちるため補完する
    const rankings = (data.rankings ?? []).map(r => ({ ...r, items: Array.isArray(r.items) ? r.items : [] }));
    const settings = data.settings
      ? {
          ...data.settings,
          useViewCount: data.settings.useViewCount ?? true,
          defaultDurations: { ...DEFAULT_DURATIONS, ...(data.settings.defaultDurations || {}) }
        }
      : null;
    const updateObj = { rankings, folders, unrankedItems, isInitialized: true };
    if (settings) updateObj.settings = settings;
    
    set(updateObj);
    pendingSaves.clear();
    await saveDataNow('rankings', rankings);
    await saveDataNow('folders', folders);
    await saveDataNow('unrankedItems', unrankedItems);
    if (settings) await saveDataNow('settings', settings);
    return true;
  },

  clearData: async () => {
    // 保存待ちのデータが消去後に書き戻されないよう破棄する
    pendingSaves.clear();
    clearTimeout(saveTimer);
    await localforage.clear();
    set({ 
      rankings: [], 
      folders: [], 
      unrankedItems: [], 
      currentFolderId: null,
      settings: {
        defaultDurations: { ...DEFAULT_DURATIONS },
        useViewCount: true
      }
    });
    return true;
  }
}));
