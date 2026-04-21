import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import RankingItem from '../components/ranking/RankingItem';
import { Search, ListFilter, SlidersHorizontal, LayoutGrid, List, Tv, BookOpen, Film, Clapperboard, MoreHorizontal, Hash } from 'lucide-react';

const GENRE_FILTERS = [
  { id: 'all', label: 'すべて', emoji: '🌟' },
  { id: 'anime', label: 'アニメ', emoji: '📺' },
  { id: 'manga', label: '漫画', emoji: '📖' },
  { id: 'movie', label: '映画', emoji: '🎬' },
  { id: 'drama', label: 'ドラマ', emoji: '🎭' },
  { id: 'other', label: 'その他', emoji: '✨' },
];

export default function AllRankingsView() {
  const getAllItems = useStore(state => state.getAllItems);
  const isEditMode = useStore(state => state.isEditMode);
  const updateItem = useStore(state => state.updateItem);
  const allItems = getAllItems();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  
  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => {
        const matchesSearch = 
          (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.author || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'all' || item.genre === selectedGenre;
        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [allItems, searchQuery, selectedGenre]);

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      <div className="mb-6 space-y-6">
        <div className="flex items-end justify-between px-1">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Records</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">全作品マスターリスト</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-2xl border border-accent/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Hash className="w-4 h-4 text-accent" />
              <span className="text-xl font-black text-white font-mono leading-none">{allItems.length}</span>
              <span className="text-[9px] font-black text-accent uppercase tracking-widest ml-1">Items</span>
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
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent transition-all placeholder:text-slate-800"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar px-1">
            {GENRE_FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedGenre(filter.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-xs font-black uppercase tracking-tighter ${
                  selectedGenre === filter.id 
                    ? 'bg-white text-black border-white shadow-lg' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                }`}
              >
                <span>{filter.emoji}</span>
                {filter.label}
              </button>
            ))}
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
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <RankingItem 
              key={item.id}
              item={item}
              isEditMode={isEditMode}
              onUpdate={(itemId, updates) => updateItem(itemId, updates)}
              genre={item.genre || 'other'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
