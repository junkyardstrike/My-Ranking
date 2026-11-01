import { Outlet } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import HamburgerMenu from './HamburgerMenu';
import BottomTabBar from './BottomTabBar';
import { useStore } from '../../store/useStore';
import { useEffect } from 'react';


// ヘッダーの切り替えスイッチ（並び替え・編集）
function Toggle({ label, shortLabel, on, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex items-center gap-1.5 py-1.5 px-1.5 sm:px-2 active:bg-mist"
    >
      <span className={`text-[10px] font-black ${on ? 'text-ink' : 'text-muted'}`}>
        {shortLabel ? (<><span className="hidden xs:inline">{label}</span><span className="xs:hidden">{shortLabel}</span></>) : label}
      </span>
      <span className={`relative w-8 h-[18px] rounded-full transition-colors duration-150 ${on ? color : 'bg-line'}`}>
        <span className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white transition-transform duration-150 ${on ? 'translate-x-[14px]' : ''}`} />
      </span>
    </button>
  );
}

export default function AppLayout() {
  const init = useStore(state => state.init);
  const isInitialized = useStore(state => state.isInitialized);
  const isEditMode = useStore(state => state.isEditMode);
  const isReorderMode = useStore(state => state.isReorderMode);
  const setEditMode = useStore(state => state.setEditMode);
  const setReorderMode = useStore(state => state.setReorderMode);

  useEffect(() => { init(); }, [init]);

  
  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-muted font-fes">LOADING…</div>;
  }

  return (
    <div className="relative min-h-screen text-ink flex flex-col bg-white">
      <header className="sticky top-0 z-[90] bg-white border-b-[3px] border-ink pt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 max-w-[35%] sm:max-w-[50%]">
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Toggle label="並び替え" shortLabel="順序" on={isReorderMode} color="bg-coral" onClick={() => setReorderMode(!useStore.getState().isReorderMode)} />
            <Toggle label="編集" on={isEditMode} color="bg-teal" onClick={() => setEditMode(!useStore.getState().isEditMode)} />
            <HamburgerMenu />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 md:px-6 pb-28">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  );
}
