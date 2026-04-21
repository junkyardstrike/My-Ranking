import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, LayoutList, Settings } from 'lucide-react';
import { useState } from 'react';
import GlobalSearchOverlay from './GlobalSearchOverlay';

const TABS = [
  { id: 'home',     icon: Home,        label: 'HOME',    path: '/' },
  { id: 'search',   icon: Search,      label: 'SEARCH',  path: null },
  { id: 'all',      icon: LayoutList,  label: 'ALL',     path: '/all' },
  { id: 'settings', icon: Settings,    label: 'SETTINGS',path: '/settings' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const activeTab = searchOpen ? 'search' : (
    TABS.find(t => t.path && t.path !== '/' && location.pathname.startsWith(t.path))?.id
    || (location.pathname === '/' || location.pathname.startsWith('/folder') || location.pathname.startsWith('/ranking') ? 'home' : null)
  );

  const handleTab = (tab) => {
    if (tab.id === 'search') { 
      setSearchOpen(true); 
      return; 
    }
    setSearchOpen(false);
    navigate(tab.path);
  };

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] flex items-end justify-center pb-safe">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mx-2 mb-2 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 grid grid-cols-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200 relative ${isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {isActive && (
                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
                  )}
                  <Icon className={`transition-all duration-200 ${isActive ? 'w-5 h-5' : 'w-5 h-5'}`} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className={`text-[9px] font-bold tracking-widest transition-colors ${isActive ? 'text-accent' : 'text-slate-600'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Search overlay (triggered from tab) */}
      {searchOpen && <GlobalSearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
