import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, LayoutList, Settings, Archive } from 'lucide-react';
import { useState } from 'react';
import GlobalSearchOverlay from './GlobalSearchOverlay';

const TABS = [
  { id: 'home',     icon: Home,        label: 'HOME',    path: '/' },
  { id: 'search',   icon: Search,      label: 'SEARCH',  path: null },
  { id: 'all',      icon: Archive,     label: 'RECORDS', path: '/all' }, // Changed to Archive icon & RECORDS label
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
      setSearchOpen(!searchOpen); 
      return; 
    }
    setSearchOpen(false);
    navigate(tab.path);
  };

  return (
    <>
      {/* Bottom tab bar - Raised slightly for iOS Home bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] flex items-end justify-center pointer-events-none">
        <div className="w-full max-w-4xl mx-auto pb-6 sm:pb-8"> {/* Increased bottom padding */}
          <div className="mx-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] grid grid-cols-4 pointer-events-auto overflow-hidden">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 transition-all duration-300 relative ${isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-accent shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                  )}
                  <Icon className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className={`text-[8px] font-black tracking-[0.2em] transition-colors ${isActive ? 'text-accent' : 'text-slate-600'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {searchOpen && <GlobalSearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
