import { useStore } from '../../store/useStore';
import { Link, matchPath, useRoute } from '../../lib/router';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb() {
  const pathname = useRoute(s => s.pathname);
  const folderId = matchPath('/folder/:folderId', pathname)?.folderId;
  const folders = useStore(state => state.folders);

  // 今いるフォルダまでの道筋
  const path = [];
  let currentFolder = folders.find(f => f.id === folderId);
  while (currentFolder) {
    path.unshift(currentFolder);
    const parentId = currentFolder.parentId;
    currentFolder = folders.find(f => f.id === parentId);
  }

  return (
    <nav className="flex items-center space-x-1 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
      {path.length === 0 && <span className="font-fes text-[11px] xs:text-[13px] text-ink">MASTERPIECE</span>}
      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center space-x-1">
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />}
          <Link
            to={`/folder/${folder.id}`}
            className={`px-1.5 min-h-[44px] flex items-center hover:text-ink hover:bg-surface-light text-muted ${index === path.length - 1 ? 'text-ink font-semibold' : ''}`}
          >
            {folder.name}
          </Link>
        </div>
      ))}
    </nav>
  );
}
