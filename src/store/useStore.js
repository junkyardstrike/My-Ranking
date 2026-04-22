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
  unrankedItems: [], 
  isEditMode: false,
  isReorderMode: false,
  viewMode: 'list', 
  currentFolderId: null,
  settings: {
    defaultDurations: {
      movie: 120,
      music: 3,
      anime: 20,
      drama: 40,
      manga: 30,
      game: 60
    },
    useViewCount: true
  },

  init: async () => {
    const folders = await loadData('folders', []);
    const rankings = await loadData('rankings', []);
    const unrankedItems = await loadData('unrankedItems', []);
    const settings = await loadData('settings', {
      defaultDurations: {
        movie: 120,
        music: 3,
        anime: 20,
        drama: 40,
        manga: 30,
        game: 60
      },
      useViewCount: true
    });
    set({ folders, rankings, unrankedItems, settings, isInitialized: true });
  },

  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  setEditMode: (mode) => set({ isEditMode: mode }),
  setReorderMode: (mode) => set({ isReorderMode: mode }),
  
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
        genre: item.genre || r.genre || 'other'
      }))
    );
    return [...rankedItems, ...state.unrankedItems.map(item => ({ 
      ...item, 
      isSelected: false,
      genre: item.genre || 'other'
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

  deleteFolder: (id) => {
    set((state) => {
      const folders = state.folders.filter(f => f.id !== id);
      saveData('folders', folders);
      return { folders };
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

  // Unified Update Action for any item
  updateItem: (itemId, updates) => {
    set(state => {
      // Update in rankings
      const newRankings = state.rankings.map(r => ({
        ...r,
        items: r.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
      }));

      // Update in unrankedItems
      const newUnrankedItems = state.unrankedItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );

      // Save both
      saveData('rankings', newRankings);
      saveData('unrankedItems', newUnrankedItems);

      return { rankings: newRankings, unrankedItems: newUnrankedItems };
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
      const itemToRank = { ...itemToInsert, currentRank: targetRank, genre: itemToInsert.genre || ranking.genre };
      let newItems = [...ranking.items].filter(i => i.id !== itemToInsert.id);
      newItems.splice(targetRank - 1, 0, itemToRank);
      const finalItems = newItems.map((item, i) => ({ ...item, currentRank: i + 1 })).slice(0, 100);
      const rankings = state.rankings.map(r => r.id === targetRankingId ? { ...r, items: finalItems } : r);
      const unrankedItems = state.unrankedItems.filter(i => i.id !== itemToInsert.id);
      saveData('rankings', rankings);
      saveData('unrankedItems', unrankedItems);
      return { rankings, unrankedItems };
    });
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
    const { rankings = [], folders = [], unrankedItems = [], settings = null } = data;
    const updateObj = { rankings, folders, unrankedItems, isInitialized: true };
    if (settings) updateObj.settings = settings;
    
    set(updateObj);
    await saveData('rankings', rankings);
    await saveData('folders', folders);
    await saveData('unrankedItems', unrankedItems);
    if (settings) await saveData('settings', settings);
    return true;
  },

  clearData: async () => {
    await localforage.clear();
    set({ 
      rankings: [], 
      folders: [], 
      unrankedItems: [], 
      currentFolderId: null,
      settings: {
        defaultDurations: {
          movie: 120,
          music: 3,
          anime: 20,
          drama: 40,
          manga: 30,
          game: 60
        },
        useViewCount: true
      }
    });
    return true;
  }
}));
