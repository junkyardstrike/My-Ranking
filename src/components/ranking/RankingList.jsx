import { DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { memo, useCallback, useMemo } from 'react';
import RankingItem from './RankingItem';
import useIncrementalRender from '../../hooks/useIncrementalRender';
import { useStore } from '../../store/useStore';

const SortableItem = memo(function SortableItem({ id, isEditMode, isReorderMode, isCollapsed, onMoved }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode && !isReorderMode });

  // 移動量だけを反映する（拡大縮小を含めると高さの違う作品同士でカードが伸び縮みして揺れる）。
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
        id={id}
        isEditMode={isEditMode}
        isReorderMode={isReorderMode}
        isCollapsed={isCollapsed}
        dragHandleProps={dragHandleProps}
        historyOnMove
        onMoved={onMoved}
      />
    </div>
  );
});

export default function RankingList({ ranking, isCollapsed = false, isEditMode = false, isReorderMode = false }) {
  const items = useStore(state => state.items);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) useStore.getState().reorderRankingItems(ranking.id, active.id, over.id);
  };

  // 表示する作品（編集モードでは空き枠も表示して入力できるようにする）
  const visibleIds = useMemo(
    () => (isEditMode ? ranking.itemIds : ranking.itemIds.filter(id => items[id]?.title || items[id]?.img)),
    [ranking.itemIds, items, isEditMode]
  );
  // 最初は画面に収まる枚数だけ描き、残りは表示した直後に描き足す（編集用カードは大きいので少なめ）
  const [renderCount, sentinelRef, ensureRendered] = useIncrementalRender(visibleIds.length, {
    initial: isEditMode ? 3 : isCollapsed ? 16 : 6,
    resetKey: `${ranking.id}|${isEditMode}`,
  });
  // 順位を変えた作品へスクロールできるよう、移動先まで描画しておく
  const handleMoved = useCallback((targetRank) => ensureRendered(targetRank + 5), [ensureRendered]);
  const renderedIds = useMemo(() => visibleIds.slice(0, renderCount), [visibleIds, renderCount]);

  if (visibleIds.length === 0 && !isEditMode) {
    return (
      <div className="py-20 text-center text-muted bg-mist rounded-sm border border-line border-dashed">
        <p className="text-lg font-bold">No Items Yet</p>
        <p className="text-xs mt-2 text-muted uppercase tracking-widest font-black opacity-60">右上のメニューから編集モードをONにして<br/>作品を追加してください</p>
      </div>
    );
  }

  // 並び替え・編集をしていない時はドラッグの仕組みを使わない（作る部品が減り、開くのが速くなる）
  if (!isEditMode && !isReorderMode) {
    return (
      <div className="relative">
        <div className={`space-y-1 ${isCollapsed ? 'space-y-1' : 'space-y-3'}`}>
          {renderedIds.map(id => (
            <div key={id}>
              <div style={{ zIndex: 1, position: 'relative' }}>
                <RankingItem id={id} isEditMode={false} isReorderMode={false} isCollapsed={isCollapsed} dragHandleProps={null} historyOnMove onMoved={handleMoved} />
              </div>
            </div>
          ))}
        </div>
        {renderCount < visibleIds.length && <div ref={sentinelRef} className="h-24" aria-hidden="true" />}
      </div>
    );
  }

  return (
    <div className="relative">
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={renderedIds} strategy={verticalListSortingStrategy}>
          <div className={`space-y-1 ${isCollapsed ? 'space-y-1' : 'space-y-3'}`}>
            {renderedIds.map(id => (
              <div key={id}>
                <SortableItem id={id} isEditMode={isEditMode} isReorderMode={isReorderMode} isCollapsed={isCollapsed} onMoved={handleMoved} />
              </div>
            ))}
          </div>
          {renderCount < visibleIds.length && <div ref={sentinelRef} className="h-24" aria-hidden="true" />}
        </SortableContext>
      </DndContext>
    </div>
  );
}
