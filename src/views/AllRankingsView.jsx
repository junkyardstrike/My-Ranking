import { useStore } from '../store/useStore';
import { useState, useMemo, useEffect, useDeferredValue, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RankingItem from '../components/ranking/RankingItem';
import { Search, ListFilter, SlidersHorizontal, LayoutGrid, List, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, Hash, Save, Maximize2, Minimize2 } from 'lucide-react';
import Counter from '../components/common/Counter';
import ModeBanner from '../components/common/ModeBanner';
import useIncrementalRender from '../hooks/useIncrementalRender';

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
  // この画面はタブを切り替えても保持されるため、追加先のランキングが変わったら選択をリセットする
  const [selectionTarget, setSelectionTarget] = useState(targetRankingId);
  if (selectionTarget !== targetRankingId) {
    setSelectionTarget(targetRankingId);
    setSelectedIds([]);
  }
  
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
  // スイッチ類は即座に切り替え、作品カードの作り直しは後回しにする（押した直後に画面が固まらないように）
  const listEditMode = useDeferredValue(isEditMode);
  const listReorderMode = useDeferredValue(isReorderMode);
  const listCollapsed = useDeferredValue(isActuallyCollapsed);
  // 編集用カードは重いので、最初に描く枚数を少なくする
  const [renderCount, sentinelRef] = useIncrementalRender(filteredItems.length, {
    initial: listEditMode ? 6 : 12,
    resetKey: `${searchQuery}|${selectedGenre}|${listEditMode}`,
  });

  // 作品カードは memo 化しているので、渡す関数は固定する（毎回作り直すと全カードが描き直される）
  const handleUpdate = useCallback((id, updates) => {
    updateItem(id, updates);
    setHasChanges(true);
  }, [updateItem]);

  const handleMove = useCallback((id, targetRank) => {
    const item = allItems.find(i => i.id === id);
    if (item && item.rankingId) {
      moveItemToRank(item.rankingId, id, targetRank);
      setHasChanges(true);
    }
  }, [allItems, moveItemToRank]);

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  }, []);

  const handleBulkAdd = () => {
    if (selectedIds.length === 0 || !targetRankingId) return;
    const itemsToAdd = allItems.filter(i => selectedIds.includes(i.id) && !i.isSelected);
    const inserted = bulkInsertItemsIntoRanking(targetRankingId, itemsToAdd);
    if (inserted < itemsToAdd.length) {
      alert(`ランキングの空き枠（100枠）が足りないため、${itemsToAdd.length - inserted}作品は追加されずにレコードに残りました。`);
    }
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
    <div className="pt-1 pb-32 grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="fes-pass">
        <p className="font-fes text-[11px] tracking-[0.04em] opacity-90">ARCHIVE PASS</p>
        <h1 className="font-fes text-[28px] leading-tight mt-0.5">Records</h1>
        <p className="text-[10px] font-bold tracking-[0.12em] opacity-85 mt-1">Master List ／ 全作品</p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="flex items-baseline gap-2 text-[11px] font-black">
          総作品数
          <span className="font-fes text-[28px] leading-none text-coral"><Counter value={filteredItems.length} /></span>
        </p>
        {!isEditMode && (
          <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="fes-btn">
            {isActuallyCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            {isActuallyCollapsed ? '展開' : '最小化'}
          </button>
        )}
      </div>

      <ModeBanner isEditMode={isEditMode} isReorderMode={isReorderMode} editNote="※この画面での編集操作は即時保存されます。" />

      {isSelectMode && targetRankingId && (
        <div className="bg-sun px-3 py-2.5 flex items-center justify-between gap-3">
          <p className="text-[12px] font-black text-ink min-w-0">
            「{rankings.find(r => r.id === targetRankingId)?.title}」への作品を選出中…
          </p>
          <button type="button" onClick={() => navigate(`/ranking/${targetRankingId}`)} className="fes-btn flex-shrink-0">
            キャンセル
          </button>
        </div>
      )}

      <div className="grid gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            id="records-search"
            placeholder="作品名・著者名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-ink py-3 pl-9 pr-3 text-ink font-bold placeholder:text-muted/70 focus:outline-none focus:border-teal"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {GENRE_FILTERS.map(filter => {
            const Icon = filter.icon;
            const on = selectedGenre === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSelectedGenre(filter.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 min-h-[44px] border-[1.5px] border-ink text-[11px] font-black ${on ? 'bg-ink text-white' : 'bg-white text-ink active:bg-mist'}`}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-16 text-center grid gap-2 justify-items-center border-2 border-dashed border-ink">
          <ListFilter className="w-8 h-8 text-muted" />
          <p className="text-base font-black">作品が見つかりません</p>
          <p className="text-xs text-muted font-bold">条件に一致するレコードがアーカイブにありません</p>
        </div>
      ) : (
        <div className={listCollapsed ? 'space-y-1.5' : 'space-y-3'}>
          {filteredItems.slice(0, renderCount).map((item) => (
            <div 
              key={item.id}
            >
              <RankingItem 
                item={item} 
                isEditMode={listEditMode} 
                isReorderMode={listReorderMode}
                isCollapsed={listCollapsed}
                onUpdate={handleUpdate}
                onMove={handleMove}
                genre={item.genre || 'music'}
                rankingId={item.rankingId}
                // 「レコードから追加」はレコード（未ランクイン）の作品のみ選択可能。
                // 他ランキングの作品を選ぶと同じ作品が2つのランキングに重複してしまうため
                isSelectable={isSelectMode && !item.isSelected}
                isSelectedForBulk={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          ))}
          {renderCount < filteredItems.length && <div ref={sentinelRef} className="h-24" aria-hidden="true" />}
        </div>
      )}

        {/* Bulk Add Button (Sticky Bottom) */}
        {isSelectMode && selectedIds.length > 0 && (
          <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100]">
            <button
              type="button"
              onClick={handleBulkAdd}
              className="px-6 py-3.5 bg-coral text-white font-black border-2 border-ink active:bg-ink flex items-center gap-2 whitespace-nowrap"
            >
              <Save size={20} />
              追加する ({selectedIds.length}作品)
            </button>
          </div>
        )}

    </div>
  );
}
