import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Folder, ListOrdered, GripVertical, Image as ImageIcon, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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
    <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
      <button 
        onClick={handleEdit}
        className="bg-black/60 backdrop-blur-md p-2 rounded-full hover:bg-accent/80 transition-all text-white shadow-lg border border-white/10 hover:scale-110"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button 
        onClick={handleDelete}
        className="bg-black/60 backdrop-blur-md p-2 rounded-full hover:bg-red-500/80 transition-all text-white shadow-lg border border-white/10 hover:scale-110"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

const getFolderCoverImage = (folder, rankings) => {
  if (folder.coverImageBase64) return folder.coverImageBase64;
  
  const folderRankings = rankings.filter(r => r.folderId === folder.id);
  
  // Try rank 1 of oldest first
  if (folderRankings.length > 0) {
    const oldestRanking = folderRankings[0];
    const rank1Item = oldestRanking.items?.find(item => item.currentRank === 1);
    if (rank1Item && rank1Item.imageBase64) {
      return rank1Item.imageBase64;
    }
  }

  // Fallback: any item in any ranking in this folder
  for (const ranking of folderRankings) {
    const anyItem = ranking.items?.find(item => item.imageBase64);
    if (anyItem && anyItem.imageBase64) {
      return anyItem.imageBase64;
    }
  }

  return null;
};

function DroppableFolder({ folder, rankings }) {
  const isEditMode = useStore(state => state.isEditMode);
  const updateFolder = useStore(state => state.updateFolder);

  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
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

  const coverImage = getFolderCoverImage(folder, rankings);

  return (
    <div 
      ref={isEditMode ? setNodeRef : null}
      className={`group relative overflow-hidden bg-surface rounded-2xl flex flex-col items-center justify-center transition-all duration-300 shadow-lg border block w-full h-full min-h-[160px] ${
        isOver 
          ? 'border-accent bg-accent/20 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10' 
          : 'border-white/5 hover:border-white/20 hover:bg-surface-light hover:-translate-y-1'
      }`}
    >
      <Link to={`/folder/${folder.id}`} className="absolute inset-0 z-10" />
      
      {isEditMode && <ActionButtons id={folder.id} name={folder.name} type="folder" />}

      {coverImage && (
         <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
           <img src={coverImage} alt="" className="w-full h-full object-cover" />
         </div>
      )}
      <div className="relative z-10 p-6 flex flex-col items-center space-y-3 pointer-events-none mt-4">
        <div className="p-3 bg-slate-800/80 backdrop-blur-md rounded-xl group-hover:scale-110 transition-transform duration-300 border border-white/5">
          <Folder className="w-10 h-10 text-accent" />
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-center line-clamp-2 text-slate-100 tracking-wide">{folder.name}</span>
          {folder.englishName && (
            <div className="mt-1 flex flex-col items-center">
              <div className="h-px w-6 bg-accent/50 my-1" />
              <span className="text-[10px] sm:text-xs tracking-wider text-slate-400 font-medium uppercase text-center block leading-tight">{folder.englishName}</span>
            </div>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-auto">
          <label 
            className="bg-black/60 p-2 rounded-full transition-all cursor-pointer hover:bg-black/80 flex items-center justify-center border border-white/10 hover:scale-110"
            onClick={e => e.stopPropagation()}
          >
            <ImageIcon className="w-4 h-4 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      )}
    </div>
  );
}

function DraggableRanking({ ranking }) {
  const isEditMode = useStore(state => state.isEditMode);
  const updateRanking = useStore(state => state.updateRanking);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ranking.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

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
    <div ref={isEditMode ? setNodeRef : null} style={style} className={`block w-full h-full min-h-[160px] ${isDragging ? 'scale-[1.02] shadow-2xl z-50 relative' : ''}`}>
      <div className="group relative bg-surface p-6 rounded-2xl flex flex-col items-center justify-center hover:bg-surface-light hover:-translate-y-1 transition-all duration-300 shadow-lg border border-white/5 hover:border-white/20 h-full min-h-[160px] overflow-hidden">
        <Link to={`/ranking/${ranking.id}`} className="absolute inset-0 z-10" />

        {ranking.coverImageBase64 ? (
           <>
             <div className="absolute inset-0 z-0 opacity-50 group-hover:opacity-70 transition-opacity">
               <img src={ranking.coverImageBase64} alt="" className="w-full h-full object-cover" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/80 z-0 pointer-events-none" />
           </>
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0 pointer-events-none" />
        )}

        {isEditMode && <ActionButtons id={ranking.id} name={ranking.title} type="ranking" />}

        <div className="flex flex-col items-center pointer-events-none z-10 w-full px-2">
          <span className="font-bold text-center line-clamp-2 text-white text-xl sm:text-2xl tracking-wide drop-shadow-lg">{ranking.title}</span>
          {ranking.englishName && (
            <div className="mt-2 flex flex-col items-center">
              <div className="h-px w-10 bg-emerald-400/70 my-1.5" />
              <span className="text-[10px] sm:text-xs tracking-widest text-emerald-100 font-medium uppercase text-center block leading-tight drop-shadow-md">{ranking.englishName}</span>
            </div>
          )}
        </div>
        
        {isEditMode && (
          <>
            <div 
              {...listeners} 
              {...attributes} 
              className="absolute top-3 right-3 p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white bg-black/40 rounded-lg hover:bg-black/60 z-20 pointer-events-auto"
            >
              <GripVertical className="w-5 h-5" />
            </div>
            
            <div className="absolute bottom-3 right-3 z-20 pointer-events-auto">
              <label 
                className="bg-black/60 p-2 rounded-full transition-all cursor-pointer hover:bg-black/80 flex items-center justify-center border border-white/10 hover:scale-110"
                onClick={e => e.stopPropagation()}
              >
                <ImageIcon className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RootFolderCard({ folder, rankings }) {
  const updateFolder = useStore(state => state.updateFolder);
  const isEditMode = useStore(state => state.isEditMode);

  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
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

  const coverImage = getFolderCoverImage(folder, rankings);

  return (
    <div 
      ref={isEditMode ? setNodeRef : null}
      className={`group relative overflow-hidden rounded-2xl w-full h-48 sm:h-56 transition-all duration-500 shadow-2xl border block ${
        isOver 
          ? 'border-accent scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.4)] z-10' 
          : 'border-white/10 hover:border-white/30 hover:-translate-y-1'
      }`}
    >
      <Link to={`/folder/${folder.id}`} className="absolute inset-0 z-10" />
      
      {isEditMode && <ActionButtons id={folder.id} name={folder.name} type="folder" />}

      {coverImage ? (
        <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 transition-transform duration-700 group-hover:scale-105 z-0" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 z-0 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full flex items-end justify-between z-20 pointer-events-none">
        <div className="transform transition-transform duration-300 group-hover:translate-x-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-wide drop-shadow-md">{folder.name}</h2>
          
          {folder.englishName && (
            <div className="mt-2 mb-1">
              <div className="h-px w-12 bg-accent/60 mb-1.5" />
              <p className="text-xs sm:text-sm tracking-[0.1em] text-white/70 font-medium uppercase drop-shadow-sm">{folder.englishName}</p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 opacity-80 bg-black/40 px-3 py-1 rounded-full w-fit backdrop-blur-sm border border-white/5">
            <Folder className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Folder</span>
          </div>
        </div>
        
        {isEditMode && (
          <div className="pointer-events-auto relative">
            <label 
              className="bg-black/60 backdrop-blur-md p-3.5 rounded-full hover:bg-black/80 transition-colors cursor-pointer border border-white/10 shadow-lg flex items-center justify-center transform hover:scale-110"
              onClick={e => e.stopPropagation()}
            >
              <ImageIcon className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FolderView() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const folders = useStore(state => state.folders);
  const rankings = useStore(state => state.rankings);
  const setCurrentFolderId = useStore(state => state.setCurrentFolderId);

  const currentFolderId = folderId || null;
  const isRoot = currentFolderId === null;
  
  useEffect(() => {
    setCurrentFolderId(currentFolderId);
  }, [currentFolderId, setCurrentFolderId]);

  const childFolders = folders.filter(f => f.parentId === currentFolderId);
  const childRankings = rankings.filter(r => r.folderId === currentFolderId);
  const currentFolder = folders.find(f => f.id === currentFolderId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-2 sm:pt-4">
      {!isRoot && (
        <div className="mb-2">
          <button 
            onClick={() => navigate(currentFolder?.parentId ? `/folder/${currentFolder.parentId}` : '/')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 bg-surface/50 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-surface-light hover:border-white/10 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">戻る</span>
          </button>
        </div>
      )}

      {(childFolders.length === 0 && childRankings.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-surface/30 backdrop-blur-sm rounded-3xl border border-white/5 border-dashed shadow-inner">
          <Folder className="w-20 h-20 mb-6 opacity-20 text-accent" />
          <p className="text-xl font-medium tracking-wide">この階層は空です</p>
          <p className="text-sm mt-3 text-slate-500 max-w-xs text-center leading-relaxed">右上のメニューから新しいフォルダやランキングを作成して始めましょう。</p>
        </div>
      ) : (
        <>


          {childFolders.length > 0 && (
            <div className={isRoot ? "space-y-6" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"}>
              {childFolders.map(folder => (
                isRoot ? 
                  <RootFolderCard key={folder.id} folder={folder} rankings={rankings} /> : 
                  <DroppableFolder key={folder.id} folder={folder} rankings={rankings} />
              ))}
            </div>
          )}
          
          {childFolders.length > 0 && childRankings.length > 0 && (
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
          )}

          {childRankings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {childRankings.map(ranking => (
                <DraggableRanking key={ranking.id} ranking={ranking} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
