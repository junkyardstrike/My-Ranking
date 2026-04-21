import { create } from 'zustand';
import localforage from 'localforage';

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

const saveData = async (key, value) => {
  try {
    await localforage.setItem(key, value);
  } catch (err) {
    console.error('Error saving data', err);
  }
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

export const useStore = create((set, get) => ({
  isInitialized: false,
  folders: [], 
  rankings: [], 
  unrankedItems: [], // New: Store for items not in any specific ranking yet
  isEditMode: false,
  viewMode: 'list', 
  currentFolderId: null,

  init: async () => {
    const folders = await loadData('folders', []);
    const rankings = await loadData('rankings', []);
    const unrankedItems = await loadData('unrankedItems', []);
    set({ folders, rankings, unrankedItems, isInitialized: true });
  },

  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  setEditMode: (mode) => set({ isEditMode: mode }),
  
  // ALL Tab Data Helper: Returns all items from all rankings + unranked ones
  getAllItems: () => {
    const state = get();
    const rankedItems = state.rankings.flatMap(r => 
      (r.items || []).filter(item => item.title).map(item => ({ ...item, rankingId: r.id, isSelected: true }))
    );
    return [...rankedItems, ...state.unrankedItems.map(item => ({ ...item, isSelected: false }))];
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
    if (updates.name) {
      const englishName = await translateToEnglish(updates.name);
      if (englishName) {
        set((state) => {
          const folders = state.folders.map(f => f.id === id ? { ...f, englishName: englishName.toUpperCase() } : f);
          saveData('folders', folders);
          return { folders };
        });
      }
    }
  },

  deleteFolder: (id) => {
    set((state) => {
      const folders = state.folders.filter(f => f.id !== id);
      saveData('folders', folders);
      return { folders };
    });
  },

  addRanking: async (title, folderId = null, genre = 'other') => {
    const initialItems = Array.from({ length: 100 }, (_, i) => ({
      id: generateId(), currentRank: i + 1, previousRanks: [], title: '', color: '#ffffff', fontSize: 20, imageBase64: null, memo: '', createdAt: null, author: '', isBold: false, views: 0, rating: 0
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

  deleteRanking: (id) => {
    set((state) => {
      const rankings = state.rankings.filter(r => r.id !== id);
      saveData('rankings', rankings);
      return { rankings };
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

  // Record a standalone item (作品を記録)
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
      previousRanks: []
    };
    set(state => {
      const unrankedItems = [newItem, ...state.unrankedItems];
      saveData('unrankedItems', unrankedItems);
      return { unrankedItems };
    });
    return newItem;
  },

  // Move an item into a ranking and push out existing ones
  insertItemIntoRanking: (targetRankingId, itemToInsert, targetRank) => {
    set(state => {
      const ranking = state.rankings.find(r => r.id === targetRankingId);
      if (!ranking) return state;

      let newItems = [...ranking.items];
      // Prepare the item for ranking
      const itemToRank = { ...itemToInsert, currentRank: targetRank };
      
      // The push-out logic:
      // 1. Remove the empty slot/old item at targetRank
      // 2. Insert the new item
      // 3. Re-index everything from that point onwards
      const index = targetRank - 1;
      
      // Filter out this item if it was already in this ranking (to prevent duplicates)
      newItems = newItems.filter(i => i.id !== itemToInsert.id);
      
      // Actually we want to keep the 100-item limit usually, 
      // but let's just insert and shift.
      newItems.splice(index, 0, itemToRank);
      
      // Re-calculate all ranks
      const finalItems = newItems.map((item, i) => ({
        ...item,
        currentRank: i + 1
      })).slice(0, 100); // Keep top 100

      const rankings = state.rankings.map(r => 
        r.id === targetRankingId ? { ...r, items: finalItems } : r
      );

      // Also remove from unranked if it was there
      const unrankedItems = state.unrankedItems.filter(i => i.id !== itemToInsert.id);
      
      saveData('rankings', rankings);
      saveData('unrankedItems', unrankedItems);
      return { rankings, unrankedItems };
    });
  },

  importData: async (data) => {
    const rankings = data.rankings || [];
    const folders = data.folders || [];
    const unrankedItems = data.unrankedItems || [];
    set({ rankings, folders, unrankedItems, isInitialized: true });
    await saveData('rankings', rankings);
    await saveData('folders', folders);
    await saveData('unrankedItems', unrankedItems);
    return true;
  },

  clearData: async () => {
    await localforage.clear();
    set({ rankings: [], folders: [], unrankedItems: [], currentFolderId: null });
    return true;
  }
}));
