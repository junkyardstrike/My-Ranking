import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RankingItem from './RankingItem';
import { useStore } from '../../store/useStore';

function SortableItem({ item, isEditMode, isReorderMode, isCollapsed, rankingId, onUpdate, onMove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: !isEditMode && !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-2xl scale-[1.02] transition-transform duration-200' : ''}>
      <RankingItem 
        item={item} 
        isEditMode={isEditMode} 
        isReorderMode={isReorderMode}
        isCollapsed={isCollapsed}
        rankingId={rankingId}
        dragHandleProps={(isEditMode || isReorderMode) ? {...attributes, ...listeners} : null}
        onUpdate={onUpdate}
        onMove={onMove}
        genre={item.genre || 'music'}
      />
    </div>
  );
}

export default function RankingList({ ranking, isCollapsed: propIsCollapsed = false, isEditMode = false, onSave }) {
  const isReorderMode = useStore(state => state.isReorderMode);
  const updateItem = useStore(state => state.updateItem);
  const [items, setItems] = useState(ranking.items);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Use location key to force animation re-trigger on tab change
  const { pathname } = useLocation();

  useEffect(() => {
    setItems(ranking.items);
    setHasChanges(false);
  }, [ranking.id]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Auto-rank positions
      const updatedWithRanks = newItems.map((item, index) => ({
        ...item,
        currentRank: index + 1
      }));
      
      setItems(updatedWithRanks);
      setHasChanges(true);
    }
  };

  const handleLocalUpdate = (id, updates) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    updateItem(id, updates);
    setHasChanges(true);
  };

  const handleLocalMove = (id, targetRank) => {
    const itemToMove = items.find(i => i.id === id);
    if (!itemToMove) return;
    const otherItems = items.filter(i => i.id !== id);
    const newIndex = Math.max(0, Math.min(targetRank - 1, items.length - 1));
    const newItems = [...otherItems];
    newItems.splice(newIndex, 0, { ...itemToMove, currentRank: targetRank });
    const updatedWithRanks = newItems.map((item, index) => ({
      ...item,
      currentRank: index + 1
    }));
    setItems(updatedWithRanks);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) onSave(items);
    useStore.getState().captureRankHistory(ranking.id);
    setHasChanges(false);
    alert('ランキングの変更を保存しました。');
  };

  const isActuallyCollapsed = propIsCollapsed;
  const visibleItems = items.filter(item => item.title || item.imageBase64 || isEditMode);

  if (visibleItems.length === 0 && !isEditMode) {
    return (
      <div className="py-20 text-center text-slate-600 bg-white/5 rounded-[32px] border border-white/5 border-dashed">
        <p className="text-lg font-bold italic tracking-tighter">No Items Yet</p>
        <p className="text-xs mt-2 text-slate-500 uppercase tracking-widest font-black opacity-60">右上のメニューから編集モードをONにして<br/>作品を追加してください</p>
      </div>
    );
  }

  return (
    <div className="relative" key={pathname}>
      <style>{`
        @keyframes premiumFadeIn {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
            filter: blur(10px) brightness(0.5);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1);
          }
        }
        .premium-item-entry {
          animation: premiumFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className={`space-y-1 ${isActuallyCollapsed ? 'space-y-1' : 'space-y-3'}`}>
            {visibleItems.map((item, idx) => (
              <div 
                key={item.id}
                className="premium-item-entry"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <SortableItem 
                  item={item} 
                  isEditMode={isEditMode} 
                  isReorderMode={isReorderMode}
                  isCollapsed={isActuallyCollapsed}
                  rankingId={ranking.id}
                  onUpdate={handleLocalUpdate}
                  onMove={handleLocalMove}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isEditMode && hasChanges && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10001] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={handleSave}
            className="bg-accent text-black px-8 py-4 rounded-full font-black shadow-2xl shadow-accent/40 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all text-lg italic tracking-tighter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            変更を保存
          </button>
        </div>
      )}
    </div>
  );
}
