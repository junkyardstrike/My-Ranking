import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, LayoutList, Settings, Archive, BarChart3 } from 'lucide-react';
import { useCallback } from 'react';

const TABS = [
  { id: 'home',     icon: Trophy,      label: 'MASTERPIECE', path: '/' },
  { id: 'all',      icon: Archive,     label: 'RECORDS', path: '/all' },
  { id: 'stats',    icon: BarChart3,   label: 'STATS',   path: '/stats' },
  { id: 'settings', icon: Settings,    label: 'SETTINGS',path: '/settings' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = TABS.find(t => t.path && t.path !== '/' && location.pathname.startsWith(t.path))?.id
    || (location.pathname === '/' || location.pathname.startsWith('/folder') || location.pathname.startsWith('/ranking') ? 'home' : null);

  const handleNavigate = useCallback((path) => {
    if (location.pathname === path || (path === '/' && location.pathname === '/ranking')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  }, [navigate, location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[80] bg-ink pb-[max(8px,env(safe-area-inset-bottom))]">
      <div className="max-w-4xl mx-auto grid grid-cols-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNavigate(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 pt-3 pb-2 active:bg-white/10 ${isActive ? 'text-sun' : 'text-[#9cbdb9]'}`}
            >
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-sun" />}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="font-fes text-[9px] tracking-[0.06em]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
