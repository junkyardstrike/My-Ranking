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
  folders: [], // { id, name, parentId, coverImageBase64 }
  rankings: [], // { id, folderId, title, items: [] } 
  isEditMode: false,
  viewMode: 'list', // 'list' or 'grid'
  currentFolderId: null,

  init: async () => {
    const folders = await loadData('folders', []);
    const rankings = await loadData('rankings', []);
    const viewMode = await loadData('viewMode', 'list');
    set({ folders, rankings, viewMode, isInitialized: true });
    
    // Auto translate in background for existing ones
    setTimeout(async () => {
      let foldersUpdated = false;
      const newFolders = [...folders];
      for (let i = 0; i < newFolders.length; i++) {
        if (!newFolders[i].englishName && newFolders[i].name) {
          const en = await translateToEnglish(newFolders[i].name);
          if (en) {
            newFolders[i] = { ...newFolders[i], englishName: en.toUpperCase() };
            foldersUpdated = true;
          }
        }
      }
      if (foldersUpdated) {
        set({ folders: newFolders });
        saveData('folders', newFolders);
      }

      let rankingsUpdated = false;
      const newRankings = [...rankings];
      for (let i = 0; i < newRankings.length; i++) {
        if (!newRankings[i].englishName && newRankings[i].title) {
          const en = await translateToEnglish(newRankings[i].title);
          if (en) {
            newRankings[i] = { ...newRankings[i], englishName: en.toUpperCase() };
            rankingsUpdated = true;
          }
        }
      }
      if (rankingsUpdated) {
        set({ rankings: newRankings });
        saveData('rankings', newRankings);
      }
    }, 1000);
  },

  setCurrentFolderId: (id) => set({ currentFolderId: id }),

  setEditMode: (mode) => set({ isEditMode: mode }),
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
    saveData('viewMode', mode);
  },

  addFolder: async (name, parentId = null) => {
    const id = generateId();
    const newFolder = { 
      id, 
      name, 
      englishName: '',
      parentId,
      coverImageBase64: null
    };
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
      id: generateId(),
      currentRank: i + 1,
      previousRanks: [],
      title: '',
      color: '#ffffff',
      fontSize: 20, // Increased from 16
      imageBase64: null,
      memo: '',
      createdAt: null,
      author: '',
      isBold: false,
      views: 0,
      rating: 0
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

    if (updates.title) {
      const englishName = await translateToEnglish(updates.title);
      if (englishName) {
        set((state) => {
          const rankings = state.rankings.map(r => r.id === id ? { ...r, englishName: englishName.toUpperCase() } : r);
          saveData('rankings', rankings);
          return { rankings };
        });
      }
    }
  },

  updateRankingItems: (rankingId, newItems) => {
    set((state) => {
      const rankings = state.rankings.map(r => 
        r.id === rankingId ? { ...r, items: newItems } : r
      );
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  updateRankingItem: (rankingId, itemId, updates) => {
    set((state) => {
      const rankings = state.rankings.map(r => {
        if (r.id !== rankingId) return r;
        return {
          ...r,
          items: r.items.map(item => item.id === itemId ? { ...item, ...updates } : item)
        };
      });
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  moveRanking: (rankingId, targetFolderId) => {
    set((state) => {
      const rankings = state.rankings.map(r => 
        r.id === rankingId ? { ...r, folderId: targetFolderId === 'root' ? null : targetFolderId } : r
      );
      saveData('rankings', rankings);
      return { rankings };
    });
  },

  importData: async (data) => {
    if (!data.rankings || !data.folders) throw new Error('Invalid data format');
    
    set({ 
      rankings: data.rankings, 
      folders: data.folders,
      isInitialized: true 
    });
    
    await saveData('rankings', data.rankings);
    await saveData('folders', data.folders);
    return true;
  },

  clearData: async () => {
    await localforage.clear();
    set({ rankings: [], folders: [], currentFolderId: null });
    return true;
  }
}));
