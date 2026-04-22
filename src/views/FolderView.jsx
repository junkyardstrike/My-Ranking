import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Folder, ListOrdered, GripVertical, Image as ImageIcon, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PixelItem from '../components/common/PixelItem';

function ActionButtons({ id, name, type }) {
  const updateFolder = useStore(state => state.updateFolder);
  const deleteFolder = useStore(state => state.deleteFolder);
  const updateRanking = useStore(state => state.updateRanking);
  const deleteRanking = useStore(state => state.deleteRanking);

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
    if (confirm(`本当に「${name}」を削除しますか？\n※この操作は元に戻せません。`)) {
      if (type === 'folder') deleteFolder(id);
      else deleteRanking(id);
    }
  };

  return (
    <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 pointer-events-auto">
      <button 
        onClick={handleEdit}
        className="bg-black/60 backdrop-blur-md p-1.5 rounded-full hover:bg-accent transition-all text-white border border-white/10 shadow-lg"
      >
        <Edit2 className="w-3 h-3" />
      </button>
      <button 
        onClick={handleDelete}
        className="bg-black/60 backdrop-blur-md p-1.5 rounded-full hover:bg-red-500 transition-all text-white border border-white/10 shadow-lg"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

const getFolderCoverImage = (folder, rankings) => {
  if (folder.coverImageBase64) return folder.coverImageBase64;
  
  const folderRankings = rankings.filter(r => r.folderId === folder.id);
  
  if (folderRankings.length > 0) {
    const oldestRanking = folderRankings[0];
    const rank1Item = oldestRanking.items?.find(item => item.currentRank === 1);
    if (rank1Item && rank1Item.imageBase64) {
      return rank1Item.imageBase64;
    }
  }

  for (const ranking of folderRankings) {
    const anyItem = ranking.items?.find(item => item.imageBase64);
    if (anyItem && anyItem.imageBase64) {
      return anyItem.imageBase64;
    }
  }

  return null;
};

const getRecursiveItemCount = (folderId, allFolders, allRankings) => {
  let count = 0;
  
  const folderRankings = allRankings.filter(r => r.folderId === folderId);
  folderRankings.forEach(r => {
    const validItems = (r.items || []).filter(item => item.title?.trim() || item.imageBase64);
    count += validItems.length;
  });
  
  const subFolders = allFolders.filter(f => f.parentId === folderId);
  subFolders.forEach(sf => {
    count += getRecursiveItemCount(sf.id, allFolders, allRankings);
  });
  
  return count;
};

function SortableFolder({ folder, folders, rankings }) {
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFolder(folder.id, { coverImageBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const totalItems = getRecursiveItemCount(folder.id, folders, rankings);
  const coverImage = getFolderCoverImage(folder, rankings);

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
      className={`group relative overflow-hidden bg-white/5 rounded-[24px] border transition-all duration-500 shadow-xl flex flex-col justify-end h-28 w-full ${
        isDragging ? 'scale-[1.05] shadow-2xl z-50 ring-2 ring-accent' :
        'border-white/10 hover:border-white/30'
      }`}
    >
      <Link to={`/folder/${folder.id}`} className="absolute inset-0 z-10" />
      
      {isEditMode && <ActionButtons id={folder.id} name={folder.name} type="folder" />}

      {isReorderMode && (
        <div 
          {...listeners} 
          {...attributes} 
          className="absolute top-2 right-2 p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-accent bg-black/40 rounded-lg hover:bg-black/60 z-30 pointer-events-auto transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}

      {coverImage && (
         <div className="absolute inset-0 z-0 transition-all duration-700">
           <img src={coverImage} alt="" className="w-full h-full object-cover brightness-[0.55] group-hover:brightness-[0.65] group-hover:scale-110 transition-all duration-700" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
         </div>
      )}

      <div className="relative z-10 p-4 w-full flex flex-col pointer-events-none">
        <h3 className="text-2xl sm:text-3xl font-black text-accent italic tracking-tighter line-clamp-1 drop-shadow-[0_4px_8px_rgba(0,0,0,1)] filter brightness-110">{folder.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          {folder.englishName && (
            <span className="text-[10px] tracking-widest text-slate-300 font-black uppercase leading-tight truncate opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{folder.englishName}</span>
          )}
          <span className="text-[10px] font-black text-accent/80 italic uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ({totalItems}作品)
          </span>
        </div>
      </div>

      {!isReorderMode && (
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm shadow-lg">
            <Folder className="w-3 h-3 text-accent" />
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
          <label 
            className="bg-black/60 p-2 rounded-full transition-all cursor-pointer hover:bg-black/80 flex items-center justify-center border border-white/10 hover:scale-110"
            onClick={e => e.stopPropagation()}
          >
            <ImageIcon className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      )}
    </div>
  );
}

function SortableRanking({ ranking }) {
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateRanking(ranking.id, { coverImageBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`block w-full h-full ${isDragging ? 'z-50 relative' : ''}`}>
      <div className={`group relative bg-white/5 rounded-[24px] border border-white/10 hover:border-white/30 transition-all duration-500 shadow-xl h-28 overflow-hidden flex flex-col justify-end ${isDragging ? 'scale-[1.05] ring-2 ring-accent' : ''}`}>
        <Link to={`/ranking/${ranking.id}`} className="absolute inset-0 z-10" />

        {ranking.coverImageBase64 ? (
           <>
             <div className="absolute inset-0 z-0 transition-all duration-700">
               <img src={ranking.coverImageBase64} alt="" className="w-full h-full object-cover brightness-[0.55] group-hover:brightness-[0.65] group-hover:scale-110 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
             </div>
           </>
        ) : (
           <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
        )}

        <div className="relative z-10 p-4 w-full flex flex-col pointer-events-none">
          <h3 className="text-2xl sm:text-3xl font-black text-accent italic tracking-tighter line-clamp-1 drop-shadow-[0_4px_8px_rgba(0,0,0,1)] filter brightness-110">{ranking.title}</h3>
          {ranking.englishName && (
            <span className="text-[10px] tracking-widest text-slate-300 font-black uppercase block leading-tight truncate opacity-90 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{ranking.englishName}</span>
          )}
        </div>

        {isReorderMode && (
          <div 
            {...listeners} 
            {...attributes} 
            className="absolute top-2 right-2 p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-accent bg-black/40 rounded-lg hover:bg-black/60 z-30 pointer-events-auto transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {!isReorderMode && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none">
            <div className="p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm shadow-lg">
              <ListOrdered className="w-3 h-3 text-accent" />
            </div>
          </div>
        )}

        {isEditMode && (
          <>
            <ActionButtons id={ranking.id} name={ranking.title} type="ranking" />
            <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
              <label 
                className="bg-black/60 p-2 rounded-full transition-all cursor-pointer hover:bg-black/80 flex items-center justify-center border border-white/10 hover:scale-110"
                onClick={e => e.stopPropagation()}
              >
                <ImageIcon className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FolderView() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  
  const folders = useStore(state => state.folders);
  const rankings = useStore(state => state.rankings);
  const setFolders = useStore(state => state.setFolders);
  const setRankings = useStore(state => state.setRankings);
  const isReorderMode = useStore(state => state.isReorderMode);
  const setCurrentFolderId = useStore(state => state.setCurrentFolderId);

  const currentFolderId = folderId || null;
  const isRoot = currentFolderId === null;
  
  useEffect(() => {
    setCurrentFolderId(currentFolderId);
  }, [currentFolderId, setCurrentFolderId]);

  const childFolders = useMemo(() => folders.filter(f => f.parentId === currentFolderId), [folders, currentFolderId]);
  const childRankings = useMemo(() => rankings.filter(r => r.folderId === currentFolderId), [rankings, currentFolderId]);
  const currentFolder = useMemo(() => folders.find(f => f.id === currentFolderId), [folders, currentFolderId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if we are reordering folders
    const activeFolderIdx = folders.findIndex(f => f.id === active.id);
    const overFolderIdx = folders.findIndex(f => f.id === over.id);

    if (activeFolderIdx !== -1 && overFolderIdx !== -1) {
      const newFolders = arrayMove(folders, activeFolderIdx, overFolderIdx);
      setFolders(newFolders);
      return;
    }

    // Check if we are reordering rankings
    const activeRankingIdx = rankings.findIndex(r => r.id === active.id);
    const overRankingIdx = rankings.findIndex(r => r.id === over.id);

    if (activeRankingIdx !== -1 && overRankingIdx !== -1) {
      const newRankings = arrayMove(rankings, activeRankingIdx, overRankingIdx);
      setRankings(newRankings);
      return;
    }
  };

  return (
    <div className="space-y-6 pt-0 pb-20" key={locationKey}>
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
        .premium-card-animate {
          animation: premiumEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
      <div className="flex items-start justify-between mb-10 premium-section-animate" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col gap-1">
          {isRoot ? (
            <>
              <div className="relative flex items-center gap-1 overflow-visible">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-none text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_10px_20px_rgba(212,175,55,0.3)] pr-4">
                  Ranking
                </h1>
                <PixelItem type="sword" size={40} className="mb-1" />
                <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-500 via-yellow-500/50 to-transparent rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              </div>
              <p className="text-[11px] text-slate-500 font-black tracking-[0.3em] mt-3 flex items-center gap-3">
                ランキング・アーカイブ
                <span className="w-12 h-px bg-slate-800" />
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter drop-shadow-lg">
                {currentFolder?.name}
              </h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                Folder: {currentFolder?.englishName || 'COLLECTION'}
              </p>
            </>
          )}
        </div>

        {!isRoot && (
          <button 
            onClick={() => navigate(currentFolder?.parentId ? `/folder/${currentFolder.parentId}` : '/')}
            className="flex-shrink-0 flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">Go Back</span>
          </button>
        )}
      </div>

      {(folders.length === 0 && rankings.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white/5 rounded-[40px] border border-white/5 border-dashed mx-1">
          <Folder className="w-20 h-20 mb-6 opacity-20 text-accent" />
          <p className="text-xl font-black italic tracking-tighter">No Items Yet</p>
          <p className="text-xs mt-3 text-slate-600 uppercase font-bold tracking-widest max-w-xs text-center leading-relaxed px-4">右上のメニューから新しいフォルダやランキングを作成してください</p>
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
                  {childFolders.map((folder, idx) => (
                    <div key={folder.id} className="premium-card-animate" style={{ animationDelay: `${idx * 60}ms` }}>
                      <SortableFolder folder={folder} folders={folders} rankings={rankings} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
            
            {childFolders.length > 0 && childRankings.length > 0 && (
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
            )}

            {childRankings.length > 0 && (
              <SortableContext 
                items={childRankings.map(r => r.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {childRankings.map((ranking, idx) => (
                    <div key={ranking.id} className="premium-card-animate" style={{ animationDelay: `${(childFolders.length + idx) * 60}ms` }}>
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
  );
}
