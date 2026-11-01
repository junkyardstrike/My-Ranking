import { useStore } from '../../store/useStore';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

function DroppableBreadcrumbItem({ folder, index, isLast }) {
  const { isOver, setNodeRef } = useDroppable({
    id: folder ? folder.id : 'root',
  });

  const isEditMode = useStore(state => state.isEditMode);

  return (
    <div className="flex items-center space-x-1" ref={isEditMode ? setNodeRef : null}>
      {index > 0 && <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />}
      <Link 
        to={folder ? `/folder/${folder.id}` : "/"} 
        className={`p-1.5 transition-all rounded-md flex items-center ${
          isOver 
            ? 'bg-accent text-ink scale-110 relative z-10' 
            : 'hover:text-ink hover:bg-surface-light text-muted'
        } ${isLast && !isOver ? 'text-ink font-semibold' : ''}`}
      >
        {folder ? folder.name : <span className="text-[10px] font-black uppercase tracking-[0.2em] px-1">Top</span>}
      </Link>
    </div>
  );
}

export default function Breadcrumb() {
  const { folderId } = useParams();
  const folders = useStore(state => state.folders);

  // Reconstruct path
  const path = [];
  let currentFolder = folders.find(f => f.id === folderId);
  while (currentFolder) {
    path.unshift(currentFolder);
    currentFolder = folders.find(f => f.id === currentFolder.parentId);
  }

  return (
    <nav className="flex items-center space-x-1 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
      {path.length === 0 && <span className="font-fes text-[11px] xs:text-[13px] text-ink">MASTERPIECE</span>}
      {path.map((folder, index) => (
        <DroppableBreadcrumbItem 
          key={folder.id} 
          folder={folder} 
          index={index}
          isLast={index === path.length - 1} 
        />
      ))}
    </nav>
  );
}
