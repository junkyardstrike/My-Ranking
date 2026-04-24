import { useStore } from '../store/useStore';
import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RankingItem from '../components/ranking/RankingItem';
import { Search, ListFilter, SlidersHorizontal, LayoutGrid, List, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, Hash, Save, Maximize2, Minimize2 } from 'lucide-react';
import Counter from '../components/common/Counter';
import PixelItem from '../components/common/PixelItem';

const GENRE_FILTERS = [
  { id: 'all', label: 'すべて', icon: Hash },
  { id: 'anime', label: 'アニメ', icon: Tv },
  { id: 'manga', label: '漫画', icon: BookOpen },
  { id: 'movie', label: '映画', icon: Film },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard },
  { id: 'game', label: 'ゲーム', icon: Gamepad2 },
  { id: 'music', label: '音楽', icon: Music },
];

export default function AllRankingsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { key: locationKey } = location;
  const isEditMode = useStore(state => state.isEditMode);
  const updateItem = useStore(state => state.updateItem);
  const moveItemToRank = useStore(state => state.moveItemToRank);
  const rankings = useStore(state => state.rankings);
  const unrankedItems = useStore(state => state.unrankedItems);
  const getAllItems = useStore(state => state.getAllItems);
  const bulkInsertItemsIntoRanking = useStore(state => state.bulkInsertItemsIntoRanking);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const targetRankingId = location.state?.targetRankingId;
  const isSelectMode = location.state?.mode === 'select';
  
  const allItems = useMemo(() => getAllItems(), [rankings, unrankedItems, getAllItems]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(location.state?.filterGenre || 'all');
  const [hasChanges, setHasChanges] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isReorderMode = useStore(state => state.isReorderMode);

  // Auto-collapse when reorder mode is on, auto-expand when off
  useEffect(() => {
    if (isReorderMode) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isReorderMode]);
  
  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => {
        const matchesSearch = 
          (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.author || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'all' || item.genre === selectedGenre;
        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        // 1. ABSOLUTE Priority: Unranked (isSelected: false) vs Ranked (isSelected: true)
        // This is the most reliable flag from useStore.js
        if (a.isSelected !== b.isSelected) {
          return a.isSelected ? 1 : -1; // false comes BEFORE true
        }

        // 2. Group by genre within those groups
        const aGenre = a.genre || 'other';
        const bGenre = b.genre || 'other';
        if (aGenre !== bGenre) {
          return aGenre.localeCompare(bGenre);
        }

        // 3. Final sorting within group
        if (!a.isSelected) {
          // Unranked: Newest first (createdAt DESC)
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || ''); // Fallback to ID for stable sort
        } else {
          // Ranked: By their position in the ranking (1, 2, 3...)
          const rankA = a.currentRank || 999;
          const rankB = b.currentRank || 999;
          return rankA - rankB;
        }
      });
  }, [allItems, searchQuery, selectedGenre]);

  const isActuallyCollapsed = isCollapsed;

  const handleUpdate = (id, updates) => {
    updateItem(id, updates);
    setHasChanges(true);
  };

  const handleMove = (id, targetRank) => {
    const item = allItems.find(i => i.id === id);
    if (item && item.rankingId) {
      moveItemToRank(item.rankingId, id, targetRank);
      setHasChanges(true);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleBulkAdd = () => {
    if (selectedIds.length === 0 || !targetRankingId) return;
    const itemsToAdd = allItems.filter(i => selectedIds.includes(i.id));
    bulkInsertItemsIntoRanking(targetRankingId, itemsToAdd);
    setSelectedIds([]);
    window.history.replaceState({}, document.title); // Clear state
    navigate(`/ranking/${targetRankingId}`);
  };

  const handleSave = () => {
    setHasChanges(false);
    // Zustand store persists to localStorage automatically in this app's current setup
    alert('変更を保存しました。');
  };

  return (
    <div className="pt-2 sm:pt-4 pb-32" key={locationKey}>
      <div className="space-y-6">
      <div className="flex items-start justify-between mb-10">
        <div className="flex flex-col gap-1">
          <div className="relative flex items-center gap-1 overflow-visible w-fit">
            <h1 
              className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-none text-blue-400 drop-shadow-[0_0_35px_rgba(59,130,246,0.6)] pr-6"
            >
              Records
            </h1>
            <PixelItem type="grimoire" size={40} className="mb-1" />
            <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-500 via-blue-500/50 to-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] w-full" />
          </div>
          <p className="text-[10px] text-white font-black tracking-widest mt-3 flex items-center gap-3">
            全作品マスターリスト
            <span className="w-12 h-px bg-white/20" />
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {!isEditMode && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white active:scale-95 shadow-xl backdrop-blur-md"
            >
              {isActuallyCollapsed ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Expand</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Collapse</span>
                </>
              )}
            </button>
          )}
          <div className="flex items-center gap-3 bg-blue-500/10 px-5 py-2.5 rounded-2xl border border-blue-500/20 shadow-lg backdrop-blur-sm whitespace-nowrap">
            <span className="text-[12px] sm:text-[14px] font-black text-slate-300 uppercase tracking-[0.2em]">総作品数</span>
            <span className="text-3xl font-black text-blue-400 font-mono leading-none">
              {allItems.length}
            </span>
          </div>
        </div>
      </div>

        {/* Search & Genre Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input 
              type="text" 
              placeholder="作品名・著者名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent transition-all placeholder:text-slate-800 font-bold"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar px-1">
            {GENRE_FILTERS.map(filter => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedGenre(filter.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-[11px] font-black uppercase tracking-tighter ${
                    selectedGenre === filter.id 
                      ? 'bg-accent text-black border-accent shadow-lg shadow-accent/20' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-white/5 rounded-[40px] border border-white/5 border-dashed">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ListFilter className="w-10 h-10 text-slate-800" />
          </div>
          <p className="text-lg font-black text-slate-600 italic tracking-tighter">No Matching Records</p>
          <p className="text-xs text-slate-700 uppercase font-bold tracking-widest">条件に一致する作品が見つかりません</p>
        </div>
      ) : (
        <div className={`space-y-1 ${isActuallyCollapsed ? 'space-y-1' : 'space-y-3'}`}>
          {filteredItems.map((item, idx) => (
            <div 
              key={item.id} 
              className="premium-item-animate"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <RankingItem 
                item={item} 
                isEditMode={isEditMode} 
                isReorderMode={isReorderMode}
                isCollapsed={isActuallyCollapsed}
                onUpdate={handleUpdate}
                onMove={handleMove}
                genre={item.genre || 'music'}
                rankingId={item.rankingId}
                isSelectable={isSelectMode}
                isSelectedForBulk={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          ))}
        </div>
      )}

        {/* Bulk Add Button (Sticky Bottom) */}
        {isSelectMode && selectedIds.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
            <button 
              onClick={handleBulkAdd}
              className="px-8 py-4 bg-accent text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <Save size={20} />
              追加する ({selectedIds.length}作品)
            </button>
          </div>
        )}

      {/* Floating Save Button for Records Tab */}
      {isEditMode && hasChanges && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10001] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={handleSave}
            className="bg-accent text-black px-8 py-4 rounded-full font-black shadow-2xl shadow-accent/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-lg italic tracking-tighter"
          >
            <Save className="w-5 h-5" strokeWidth={3} />
            変更を保存
          </button>
        </div>
      )}
    </div>
  );
}
