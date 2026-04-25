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
  // Use location key to FORCE full re-mount on every navigation
  const { key: locationKey } = useLocation();

  useEffect(() => {
    setItems(ranking.items);
  }, [ranking.id]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 20 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 15 } }),
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
      if (onSave) onSave(updatedWithRanks);
      useStore.getState().captureRankHistory(ranking.id);
    }
  };

  const handleLocalUpdate = (id, updates) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    updateItem(id, updates);
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
    if (onSave) onSave(updatedWithRanks);
    useStore.getState().captureRankHistory(ranking.id);
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
    <div className="relative" key={locationKey}>
      <style>{`
        @keyframes premiumEntry {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className={`space-y-1 ${isActuallyCollapsed ? 'space-y-1' : 'space-y-3'}`}>
            {visibleItems.map((item, idx) => (
              <div 
                key={item.id}
                className="premium-item-animate"
                style={{ animationDelay: `${idx * 60}ms` }}
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

    </div>
  );
}
