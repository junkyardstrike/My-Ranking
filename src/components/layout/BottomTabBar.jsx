import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, LayoutList, Settings, Archive, BarChart3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { tabOf, usePendingTab, resolveTab } from './tabs';

const TABS = [
  { id: 'home',     icon: Trophy,      label: 'MASTERPIECE', path: '/' },
  { id: 'all',      icon: Archive,     label: 'RECORDS', path: '/all' },
  { id: 'stats',    icon: BarChart3,   label: 'STATS',   path: '/stats' },
  { id: 'settings', icon: Settings,    label: 'SETTINGS',path: '/settings' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 押した瞬間にタブの色を切り替える（画面の切り替え完了を待たない）
  const pending = usePendingTab(state => state.pending);
  const setPending = usePendingTab(state => state.setPending);
  const routeTab = tabOf(location.pathname);
  const activeTab = resolveTab(pending, location.pathname);

  // MASTERPIECE タブで最後に開いていた画面（フォルダ/ランキング）を覚えておく
  const lastHomePath = useRef('/');
  useEffect(() => {
    if (routeTab === 'home') lastHomePath.current = location.pathname;
  }, [routeTab, location.pathname]);

  // iPhone 標準のタブバーと同じく「指が触れた瞬間」に切り替える（指を離すまでの待ち時間をなくす）。
  // 同じタップで click も届くので、直前に pointerdown で処理したタブは click では処理しない。
  const handledByPointer = useRef({ id: null, at: 0 });
  const onPointerDown = (e, tab) => {
    if (e.button !== 0) return;
    handledByPointer.current = { id: tab.id, at: performance.now() };
    handleNavigate(tab);
  };
  const onClick = (tab) => {
    const h = handledByPointer.current;
    if (h.id === tab.id && performance.now() - h.at < 1000) return;
    handleNavigate(tab);
  };

  const handleNavigate = (tab) => {
    let path = tab.path;
    if (tab.id === 'home') {
      // 他のタブから戻る時は前に開いていた画面へ。MASTERPIECE で押した時はトップへ
      path = routeTab === 'home' ? '/' : lastHomePath.current;
    }
    if (path === location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPending({ id: tab.id, from: location.pathname });
    navigate(path);
  };

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
              onPointerDown={(e) => onPointerDown(e, tab)}
              onClick={() => onClick(tab)}
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
