import { useStore } from '../store/useStore';
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { key: locationKey } = location;
  const isEditMode = useStore(state => state.isEditMode);
  const updateItem = useStore(state => state.updateItem);
  const moveItemToRank = useStore(state => state.moveItemToRank);
  const rankings = useStore(state => state.rankings);
  const unrankedItems = useStore(state => state.unrankedItems);
  const getAllItems = useStore(state => state.getAllItems);
  
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
        // 1. Unranked items (NO rankingId) MUST come first
        const aIsUnranked = !a.rankingId;
        const bIsUnranked = !b.rankingId;

        if (aIsUnranked !== bIsUnranked) {
          return aIsUnranked ? -1 : 1;
        }

        // 2. Group by genre within those groups
        const aGenre = a.genre || 'other';
        const bGenre = b.genre || 'other';
        if (aGenre !== bGenre) {
          return aGenre.localeCompare(bGenre);
        }

        // 3. Final sorting within group
        if (aIsUnranked) {
          // Unranked: Newest added first
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        } else {
          // Ranked: By their rank position (1, 2, 3...)
          return (a.currentRank || 999) - (b.currentRank || 999);
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

  const handleSave = () => {
    setHasChanges(false);
    // Zustand store persists to localStorage automatically in this app's current setup
    alert('変更を保存しました。');
  };

  return (
    <div className="pt-2 sm:pt-4 pb-32" key={locationKey}>
      <style>{`
        @keyframes premiumEntry {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
            filter: blur(15px) brightness(0.5);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1);
          }
        }
        .premium-item-animate {
          animation: premiumEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
      <div className="space-y-6">
      <div className="flex items-start justify-between mb-10">
        <div className="flex flex-col gap-1">
          <div className="relative flex items-center gap-1 overflow-visible">
            <h1 
              className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-none text-transparent bg-clip-text animate-text-flash drop-shadow-[0_15px_30px_rgba(59,130,246,0.4)] pr-6"
              style={{ 
                backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%), linear-gradient(to bottom right, #dbeafe, #60a5fa, #1d4ed8)',
              }}
            >
              Records
            </h1>
            <PixelItem type="grimoire" size={40} className="mb-1" />
            <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-500 via-blue-500/50 to-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-line-run" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-[11px] text-slate-500 font-black tracking-[0.3em] mt-3 flex items-center gap-3">
            作品マスターリスト
            <span className="w-12 h-px bg-slate-800" />
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
          <div className="inline-flex items-center gap-3 bg-blue-500/10 px-5 py-2.5 rounded-2xl border border-blue-500/20 shadow-lg backdrop-blur-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">総作品数</span>
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
              />
            </div>
          ))}
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
