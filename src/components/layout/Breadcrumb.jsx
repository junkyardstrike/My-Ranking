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
      {folder && <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />}
      <Link 
        to={folder ? `/folder/${folder.id}` : "/"} 
        className={`p-1.5 transition-all rounded-md flex items-center ${
          isOver 
            ? 'bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110 relative z-10' 
            : 'hover:text-white hover:bg-surface-light text-slate-400'
        } ${isLast && !isOver ? 'text-white font-semibold' : ''}`}
      >
        {folder ? folder.name : <Home className="w-5 h-5 sm:w-6 sm:h-6" />}
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
      <DroppableBreadcrumbItem folder={null} isLast={path.length === 0} />
      {path.map((folder, index) => (
        <DroppableBreadcrumbItem 
          key={folder.id} 
          folder={folder} 
          isLast={index === path.length - 1} 
        />
      ))}
    </nav>
  );
}
