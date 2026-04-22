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

function DroppableFolder({ folder, rankings }) {
  const isEditMode = useStore(state => state.isEditMode);
  const updateFolder = useStore(state => state.updateFolder);

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: folder.id,
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: folder.id,
    disabled: !isEditMode
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

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  const setCombinedRef = (node) => {
    if (node) {
      setDroppableRef(node);
      setDraggableRef(node);
    }
  };

  return (
    <div 
      ref={isEditMode ? setCombinedRef : null}
      style={style}
      className={`group relative overflow-hidden bg-white/5 rounded-[24px] border transition-all duration-500 shadow-xl flex flex-col justify-end h-28 w-full ${
        isDragging ? 'scale-[1.02] shadow-2xl z-50 opacity-50' :
        isOver 
          ? 'border-accent bg-accent/20 scale-[1.02] shadow-[0_0_30px_rgba(212,175,55,0.4)] z-10' 
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      <Link to={`/folder/${folder.id}`} className="absolute inset-0 z-10" />
      
      {isEditMode && <ActionButtons id={folder.id} name={folder.name} type="folder" />}

      {isEditMode && (
        <div 
          {...listeners} 
          {...attributes} 
          className="absolute top-2 right-2 p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white bg-black/40 rounded-lg hover:bg-black/60 z-20 pointer-events-auto"
        >
          <GripVertical className="w-4 h-4" />
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
        {folder.englishName && (
          <span className="text-[10px] tracking-widest text-slate-300 font-black uppercase block leading-tight truncate opacity-90 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{folder.englishName}</span>
        )}
      </div>

      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <div className="p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm shadow-lg">
          <Folder className="w-3 h-3 text-accent" />
        </div>
      </div>

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
    <div ref={isEditMode ? setNodeRef : null} style={style} className={`block w-full h-full ${isDragging ? 'scale-[1.02] shadow-2xl z-50 relative' : ''}`}>
      <div className="group relative bg-white/5 rounded-[24px] border border-white/10 hover:border-white/30 transition-all duration-500 shadow-xl h-28 overflow-hidden flex flex-col justify-end">
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

        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm shadow-lg">
            <ListOrdered className="w-3 h-3 text-accent" />
          </div>
        </div>
        
        {isEditMode && (
          <>
            <ActionButtons id={ranking.id} name={ranking.title} type="ranking" />
            <div 
              {...listeners} 
              {...attributes} 
              className="absolute top-2 right-2 p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-white bg-black/40 rounded-lg hover:bg-black/60 z-20 pointer-events-auto"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            
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
    <div className="space-y-6 animate-in fade-in duration-700 pt-0 pb-20">
      <div className="flex items-end justify-between px-1 mb-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">{isRoot ? 'Library' : currentFolder?.name}</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{isRoot ? 'コレクション・アーカイブ' : `フォルダ: ${currentFolder?.name}`}</p>
        </div>
        {!isRoot && (
          <button 
            onClick={() => navigate(currentFolder?.parentId ? `/folder/${currentFolder.parentId}` : '/')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 bg-surface/50 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-surface-light hover:border-white/10 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </button>
        )}
      </div>

      {(childFolders.length === 0 && childRankings.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white/5 rounded-[40px] border border-white/5 border-dashed mx-1">
          <Folder className="w-20 h-20 mb-6 opacity-20 text-accent" />
          <p className="text-xl font-black italic tracking-tighter">No Items Yet</p>
          <p className="text-xs mt-3 text-slate-600 uppercase font-bold tracking-widest max-w-xs text-center leading-relaxed px-4">右上のメニューから新しいフォルダやランキングを作成してください</p>
        </div>
      ) : (
        <div className="px-0">
          {childFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {childFolders.map(folder => (
                <DroppableFolder key={folder.id} folder={folder} rankings={rankings} />
              ))}
            </div>
          )}
          
          {childFolders.length > 0 && childRankings.length > 0 && (
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
          )}

          {childRankings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {childRankings.map(ranking => (
                <DraggableRanking key={ranking.id} ranking={ranking} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
