import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import RankingItem from '../components/ranking/RankingItem';
import { Search, ListFilter, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';

export default function AllRankingsView() {
  const getAllItems = useStore(state => state.getAllItems);
  const allItems = getAllItems();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sort by date (newest first)
  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => 
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.author || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [allItems, searchQuery]);

  return (
    <div className="animate-in fade-in duration-500 pb-28">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Records</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">全作品リスト / 記録一覧</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="タイトルや作者で絞り込む..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5 border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-8 h-8 text-slate-700" />
          </div>
          <p className="text-sm text-slate-500 font-medium">作品が見つかりません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => (
            <RankingItem 
              key={`${item.id}-${idx}`}
              item={item}
              isEditMode={false}
              onUpdate={() => {}} // Read only in this view for now
              genre="other"
            />
          ))}
        </div>
      )}
    </div>
  );
}
