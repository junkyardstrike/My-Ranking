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
import { Save } from 'lucide-react';

function SortableItem({ item, onUpdate, genre }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

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
        isEditMode={true} 
        viewMode="list" 
        dragHandleProps={{...attributes, ...listeners}} 
        onUpdate={onUpdate}
        genre={genre}
      />
    </div>
  );
}

export default function RankingEditor({ ranking, onSave }) {
  const [items, setItems] = useState(ranking.items);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setItems(ranking.items);
  }, [ranking.items]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleUpdate = (id, updates) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Recalculate ranks and update history
    const updatedItems = items.map((item, index) => {
      const newRank = index + 1;
      let newPreviousRanks = [...item.previousRanks];
      
      // If rank changed, update history
      if (item.currentRank !== newRank) {
        newPreviousRanks = [item.currentRank, ...newPreviousRanks].slice(0, 3);
      }

      return {
        ...item,
        currentRank: newRank,
        previousRanks: newPreviousRanks
      };
    });

    onSave(updatedItems);
    setHasChanges(false);
  };

  return (
    <div className="relative pb-24">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.map(item => (
              <SortableItem 
                key={item.id} 
                item={item} 
                onUpdate={handleUpdate}
                genre={ranking.genre || 'other'}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={handleSave}
            className="bg-accent text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-accent/30 flex items-center gap-3 hover:bg-blue-600 hover:scale-105 transition-all text-lg"
          >
            <Save className="w-6 h-6" />
            変更を保存
          </button>
        </div>
      )}
    </div>
  );
}
