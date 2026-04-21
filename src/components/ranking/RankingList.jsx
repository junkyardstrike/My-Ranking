import RankingItem from './RankingItem';

export default function RankingList({ ranking, isCollapsed = false }) {
  // Only show items with title or image
  const visibleItems = ranking.items.filter(item => item.title || item.imageBase64);

  if (visibleItems.length === 0) {
    return (
      <div className="py-20 text-center text-slate-600 bg-white/5 rounded-[32px] border border-white/5 border-dashed">
        <p className="text-lg font-bold italic tracking-tighter">No Items Yet</p>
        <p className="text-xs mt-2 text-slate-500 uppercase tracking-widest font-black opacity-60">右上の「＋」メニューから編集モードをONにして<br/>作品を追加してください</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${isCollapsed ? 'space-y-0.5' : 'space-y-3'}`}>
      {visibleItems.map(item => (
        <RankingItem 
          key={item.id} 
          item={item} 
          isEditMode={false} 
          isCollapsed={isCollapsed}
          rankingId={ranking.id}
        />
      ))}
    </div>
  );
}
