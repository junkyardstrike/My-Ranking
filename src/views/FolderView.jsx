import { useStore } from '../store/useStore';
import { Link, navigate } from '../lib/router';
import Img from '../components/common/Img';
import { saveImage } from '../lib/images';
import { compressImageFile } from '../utils/imageFile';
import { Folder, ListOrdered, GripVertical, Image as ImageIcon, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { 
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function ActionButtons({ id, name, type }) {
  const updateFolder = useStore(state => state.updateFolder);
  const deleteFolder = useStore(state => state.deleteFolder);
  const updateRanking = useStore(state => state.updateRanking);
  const deleteRanking = useStore(state => state.deleteRanking);
  const folders = useStore(state => state.folders);
  const rankings = useStore(state => state.rankings);
  const items = useStore(state => state.items);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 削除対象に含まれる作品数（フォルダの場合は配下すべて）
  const itemCount = type === 'folder'
    ? getRecursiveItemCount(id, folders, rankings, items)
    : (rankings.find(r => r.id === id)?.itemIds || []).filter(i => items[i]?.title).length;

  const runDelete = (keepItems) => {
    if (type === 'folder') deleteFolder(id, { keepItems });
    else deleteRanking(id, { keepItems });
    setIsDeleteDialogOpen(false);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newName = prompt('新しい名前を入力してください', name);
    if (newName && newName.trim() !== '') {
      if (type === 'folder') updateFolder(id, { name: newName });
      else updateRanking(id, { title: newName });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemCount === 0) {
      if (confirm(`「${name}」を削除しますか？（作品は含まれていません）`)) runDelete(false);
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAll = () => {
    if (confirm(`【最終確認】\n「${name}」と中の${itemCount}作品を完全に削除します。この操作は取り消せません。本当によろしいですか？`)) {
      runDelete(false);
    }
  };

  return (
    <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 pointer-events-auto">
      <button 
        type="button"
        aria-label="名前を変更"
        onClick={handleEdit}
        className="w-11 h-11 flex items-center justify-center bg-white text-ink border-2 border-ink active:bg-ink active:text-white"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button 
        type="button"
        aria-label="削除"
        onClick={handleDelete}
        className="w-11 h-11 flex items-center justify-center bg-white text-coral border-2 border-ink active:bg-coral active:text-white"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isDeleteDialogOpen && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-ink/60 cursor-pointer" onClick={() => setIsDeleteDialogOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-sm bg-white border border-line rounded-sm p-6 space-y-5">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-ink tracking-tight">「{name}」を削除</h2>
              <p className="text-sm text-muted leading-relaxed">
                {type === 'folder' ? 'このフォルダ内のランキング' : 'このランキング'}に含まれる
                <span className="text-accent font-black mx-1">{itemCount}作品</span>
                をどうしますか？
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => runDelete(true)}
                className="w-full py-4 rounded-sm bg-accent text-white font-black text-sm active:scale-[0.98] transition-transform"
              >
                作品はレコードに残して削除
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="w-full py-4 rounded-sm bg-red-500/15 border border-red-500/40 text-red-400 font-black text-sm active:scale-[0.98] transition-transform"
              >
                作品ごと完全に削除
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full py-3 rounded-sm text-muted font-black text-sm active:bg-mist"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// フォルダの表紙：設定した画像、無ければ最初のランキングの1位の画像、無ければ中の作品の画像
const getFolderCoverImage = (folder, rankings, items) => {
  if (folder.cover) return folder.cover;
  const folderRankings = rankings.filter(r => r.folderId === folder.id);
  const first = folderRankings[0];
  if (first) {
    const rank1 = items[first.itemIds[0]];
    if (rank1?.img) return rank1.img;
  }
  for (const ranking of folderRankings) {
    const id = ranking.itemIds.find(i => items[i]?.img);
    if (id) return items[id].img;
  }
  return null;
};

const getRecursiveItemCount = (folderId, allFolders, allRankings, items) => {
  let count = 0;
  allRankings.forEach(r => {
    if (r.folderId === folderId) count += r.itemIds.filter(id => items[id]?.title?.trim() || items[id]?.img).length;
  });
  allFolders.forEach(sf => {
    if (sf.parentId === folderId) count += getRecursiveItemCount(sf.id, allFolders, allRankings, items);
  });
  return count;
};

const SortableFolder = memo(function SortableFolder({ folder, totalItems, coverImage }) {
  const isEditMode = useStore(state => state.isEditMode);
  const isReorderMode = useStore(state => state.isReorderMode);
  const updateFolder = useStore(state => state.updateFolder);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: folder.id,
    disabled: !isReorderMode
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) updateFolder(folder.id, { cover: saveImage(await compressImageFile(file, 1200, 0.8)) });
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden bg-ink text-white flex flex-col justify-end h-28 w-full [content-visibility:auto] [contain-intrinsic-size:auto_112px] ${
        isDragging ? 'z-50 ring-4 ring-coral' :
        ''
      }`}
    >
      <Link to={`/folder/${folder.id}`} className="absolute inset-0 z-10" />
      
      {isEditMode && <ActionButtons id={folder.id} name={folder.name} type="folder" />}

      {isReorderMode && (
        <div 
          {...listeners} 
          {...attributes} 
          className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-ink bg-white z-30 pointer-events-auto"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}

      {coverImage && (
         <div className="absolute inset-0 z-0 transition-all duration-700">
           <Img k={coverImage} className="w-full h-full object-cover opacity-45" />
           <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
         </div>
      )}

      <div className="relative z-10 p-4 w-full flex flex-col pointer-events-none">
        <h3 className="text-[17px] sm:text-xl font-black text-white line-clamp-1 pr-6">{folder.name}</h3>
        <div className="flex items-center gap-2 mt-0.5 pr-2 min-w-0">
          {folder.englishName && (
            <span className="text-[9px] tracking-[0.1em] text-white/80 font-bold uppercase leading-tight truncate">{folder.englishName}</span>
          )}
          <span className="text-[10px] font-black text-sun whitespace-nowrap">
            ({totalItems}作品)
          </span>
        </div>
      </div>

      {!isReorderMode && (
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="p-1.5 bg-white/15">
            <Folder className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
          <label 
            className="w-11 h-11 cursor-pointer flex items-center justify-center bg-white border-2 border-ink active:bg-ink"
            onClick={e => e.stopPropagation()}
          >
            <ImageIcon className="w-3.5 h-3.5 text-ink" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      )}
    </div>
  );
});

const SortableRanking = memo(function SortableRanking({ ranking }) {
  const isEditMode = useStore(state => state.isEditMode);
  const isReorderMode = useStore(state => state.isReorderMode);
  const updateRanking = useStore(state => state.updateRanking);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: ranking.id,
    disabled: !isReorderMode
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) updateRanking(ranking.id, { cover: saveImage(await compressImageFile(file, 1200, 0.8)) });
  };

  return (
    <div ref={setNodeRef} style={style} className={`block w-full h-full ${isDragging ? 'z-50 relative' : ''}`}>
      <div className={`group relative bg-teal text-white h-28 overflow-hidden flex flex-col justify-end ${isDragging ? 'ring-4 ring-coral' : ''}`}>
        <Link to={`/ranking/${ranking.id}`} className="absolute inset-0 z-10" />

        {ranking.cover ? (
           <>
             <div className="absolute inset-0 z-0 transition-all duration-700">
               <Img k={ranking.cover} className="w-full h-full object-cover opacity-45" />
               <div className="absolute inset-0 bg-gradient-to-t from-teal via-teal/40 to-transparent" />
             </div>
           </>
        ) : (
           <span className="absolute left-1/2 top-2.5 h-1.5 w-8 -translate-x-1/2 rounded-full bg-white z-0 pointer-events-none" />
        )}

        <div className="relative z-10 p-4 w-full flex flex-col pointer-events-none">
          <h3 className="text-[17px] sm:text-xl font-black text-white line-clamp-1 pr-6">{ranking.title}</h3>
          {ranking.englishName && (
            <span className="text-[9px] tracking-[0.1em] text-white/85 font-bold uppercase block leading-tight truncate mt-0.5 pr-2">{ranking.englishName}</span>
          )}
        </div>

        {isReorderMode && (
          <div 
            {...listeners} 
            {...attributes} 
            className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-ink bg-white z-30 pointer-events-auto"
          style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {!isReorderMode && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none">
            <div className="p-1.5 bg-white/15">
              <ListOrdered className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {isEditMode && (
          <>
            <ActionButtons id={ranking.id} name={ranking.title} type="ranking" />
            <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
              <label 
                className="w-11 h-11 cursor-pointer flex items-center justify-center bg-white border-2 border-ink active:bg-ink"
                onClick={e => e.stopPropagation()}
              >
                <ImageIcon className="w-3.5 h-3.5 text-ink" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default function FolderView({ folderId }) {
  const folders = useStore(state => state.folders);
  const rankings = useStore(state => state.rankings);
  const items = useStore(state => state.items);
  const reorderFolders = useStore(state => state.reorderFolders);
  const reorderRankings = useStore(state => state.reorderRankings);

  const currentFolderId = folderId || null;
  const isRoot = currentFolderId === null;

  const childFolders = useMemo(() => folders.filter(f => f.parentId === currentFolderId), [folders, currentFolderId]);
  const childRankings = useMemo(() => rankings.filter(r => r.folderId === currentFolderId), [rankings, currentFolderId]);
  const currentFolder = useMemo(() => folders.find(f => f.id === currentFolderId), [folders, currentFolderId]);

  useEffect(() => {
    if (!isRoot && currentFolderId && !currentFolder) {
      navigate('/', { replace: true });
    }
  }, [isRoot, currentFolderId, currentFolder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (folders.some(f => f.id === active.id) && folders.some(f => f.id === over.id)) reorderFolders(active.id, over.id);
    else if (rankings.some(r => r.id === active.id) && rankings.some(r => r.id === over.id)) reorderRankings(active.id, over.id);
  };

  return (
    <>
      <div className="flex flex-col gap-4 pb-20 pt-1">
        {!isRoot && (
          <div>
            <button
              type="button"
              onClick={() => navigate(currentFolder?.parentId ? `/folder/${currentFolder.parentId}` : '/')}
              className="fes-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />戻る
            </button>
          </div>
        )}
        <div className={isRoot ? 'fes-pass' : 'fes-pass bg-ink'}>
          <p className="font-fes text-[11px] tracking-[0.04em] opacity-90">{isRoot ? 'MASTERPIECE FILM FES' : 'COLLECTION'}</p>
          <h1 className={isRoot ? 'font-fes text-[28px] leading-tight mt-0.5' : 'text-[26px] font-black leading-tight mt-0.5 break-words'}>
            {isRoot ? 'Ranking' : currentFolder?.name}
          </h1>
          <p className="text-[10px] font-bold tracking-[0.12em] opacity-85 mt-1">
            {isRoot ? 'Ranking Archive ／ ランキング' : (currentFolder?.englishName || 'COLLECTION ARCHIVE')}
          </p>
        </div>

      {(childFolders.length === 0 && childRankings.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted border-2 border-dashed border-ink">
          <Folder className="w-12 h-12 mb-4 text-muted" />
          <p className="font-fes text-lg text-ink">NO ITEMS YET</p>
          <p className="text-xs mt-2 font-bold max-w-xs text-center leading-relaxed px-4">右上の＋ボタンから新しいフォルダやランキングを作成してください</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="px-0">
            {childFolders.length > 0 && (
              <SortableContext 
                items={childFolders.map(f => f.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {childFolders.map((folder) => (
                    <div key={folder.id}>
                      <SortableFolder folder={folder} totalItems={getRecursiveItemCount(folder.id, folders, rankings, items)} coverImage={getFolderCoverImage(folder, rankings, items)} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
            
            {childFolders.length > 0 && childRankings.length > 0 && (
              <div className="h-px bg-gradient-to-r from-transparent to-transparent my-8" />
            )}

            {childRankings.length > 0 && (
              <SortableContext 
                items={childRankings.map(r => r.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {childRankings.map((ranking) => (
                    <div key={ranking.id}>
                      <SortableRanking ranking={ranking} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
           </div>
         </DndContext>
       )}
     </div>
     </>
  );
}
