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
import useIncrementalRender from '../../hooks/useIncrementalRender';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useCallback, useMemo, useRef } from 'react';
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

  // 移動量だけを反映する（Transform だと高さの違う作品同士で拡大縮小がかかり、カードが伸び縮みして揺れる）。
  // ドラッグ中のカードにアニメーションを付けると指から遅れて追従し揺れるため、transition は付けない。
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
  };
  const dragHandleProps = useMemo(
    () => ((isEditMode || isReorderMode) ? { ...attributes, ...listeners } : null),
    [isEditMode, isReorderMode, attributes, listeners]
  );

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'shadow-[0_6px_0_#0c2b2a] bg-white' : ''}>
      <RankingItem 
        item={item} 
        isEditMode={isEditMode} 
        isReorderMode={isReorderMode}
        isCollapsed={isCollapsed}
        rankingId={rankingId}
        dragHandleProps={dragHandleProps}
        onUpdate={onUpdate}
        onMove={onMove}
        genre={item.genre || 'music'}
      />
    </div>
  );
}

export default function RankingList({ ranking, isCollapsed: propIsCollapsed = false, isEditMode = false, isReorderMode = false, onSave }) {
  const updateItem = useStore(state => state.updateItem);
  // 常にストアの最新データを使う（ローカルコピーを持つと、順位履歴などが古い内容で上書きされるため）
  const items = ranking.items;
  // Use location key to FORCE full re-mount on every navigation

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
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
      
      if (onSave) onSave(updatedWithRanks);
      useStore.getState().captureRankHistory(ranking.id);
    }
  };

  // 作品カードは memo 化しているので、ドラッグ中の再描画で毎回作り直されないよう関数を固定する
  const ensureRenderedRef = useRef(null);
  const handleLocalUpdate = useCallback((id, updates) => {
    updateItem(id, updates);
  }, [updateItem]);

  const handleLocalMove = useCallback((id, targetRank) => {
    ensureRenderedRef.current?.(targetRank + 5);
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
    if (onSave) onSave(updatedWithRanks);
    useStore.getState().captureRankHistory(ranking.id);
  }, [items, onSave, ranking.id]);


  const isActuallyCollapsed = propIsCollapsed;
  const visibleItems = items.filter(item => item.title || item.imageBase64 || isEditMode);
  // 編集用カードは重いので、最初に描く枚数を少なくする
  const [renderCount, sentinelRef, ensureRendered] = useIncrementalRender(visibleItems.length, {
    initial: isEditMode ? 6 : 12,
    resetKey: `${ranking.id}|${isEditMode}`,
  });
  ensureRenderedRef.current = ensureRendered;
  const renderedItems = visibleItems.slice(0, renderCount);

  if (visibleItems.length === 0 && !isEditMode) {
    return (
      <div className="py-20 text-center text-muted bg-mist rounded-sm border border-line border-dashed">
        <p className="text-lg font-bold">No Items Yet</p>
        <p className="text-xs mt-2 text-muted uppercase tracking-widest font-black opacity-60">右上のメニューから編集モードをONにして<br/>作品を追加してください</p>
      </div>
    );
  }

  return (
    <div className="relative">

      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={renderedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className={`space-y-1 ${isActuallyCollapsed ? 'space-y-1' : 'space-y-3'}`}>
            {renderedItems.map((item) => (
              <div 
                key={item.id}
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
          {renderCount < visibleItems.length && <div ref={sentinelRef} className="h-24" aria-hidden="true" />}
        </SortableContext>
      </DndContext>

    </div>
  );
}
