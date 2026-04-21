import RankingItem from './RankingItem';

export default function RankingList({ ranking, viewMode }) {
  // Only show items with title or image
  const visibleItems = ranking.items.filter(item => item.title || item.imageBase64);

  if (visibleItems.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500 bg-surface/50 rounded-2xl border border-surface-light border-dashed">
        <p className="text-lg">ランキング項目がありません</p>
        <p className="text-sm mt-2 text-slate-400">右上のメニューから「編集モード」をONにして追加してください。</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' 
      : 'space-y-4'
    }>
      {visibleItems.map(item => (
        <RankingItem 
          key={item.id} 
          item={item} 
          isEditMode={false} 
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
