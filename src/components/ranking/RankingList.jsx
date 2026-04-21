import { useState, useEffect } from 'react';
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

function SortableItem({ item, isEditMode, isCollapsed, rankingId, onUpdate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-2xl scale-[1.02] transition-transform duration-200' : ''}>
      <RankingItem 
        item={item} 
        isEditMode={isEditMode} 
        isCollapsed={isCollapsed}
        rankingId={rankingId}
        dragHandleProps={isEditMode ? {...attributes, ...listeners} : null}
        onUpdate={onUpdate}
      />
    </div>
  );
}

export default function RankingList({ ranking, isCollapsed = false, isEditMode = false, onSave }) {
  const updateItem = useStore(state => state.updateItem);
  const [items, setItems] = useState(ranking.items);

  useEffect(() => {
    setItems(ranking.items);
  }, [ranking.items]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Auto-save rank positions
      const updatedWithRanks = newItems.map((item, index) => ({
        ...item,
        currentRank: index + 1
      }));
      
      setItems(updatedWithRanks);
      if (onSave) onSave(updatedWithRanks);
    }
  };

  const handleLocalUpdate = (id, updates) => {
    updateItem(id, updates);
  };

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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className={`space-y-1 ${isCollapsed ? 'space-y-0.5' : 'space-y-3'}`}>
          {visibleItems.map(item => (
            <SortableItem 
              key={item.id} 
              item={item} 
              isEditMode={isEditMode}
              isCollapsed={isCollapsed}
              rankingId={ranking.id}
              onUpdate={handleLocalUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
