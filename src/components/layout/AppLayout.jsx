import { Outlet } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import HamburgerMenu from './HamburgerMenu';
import BottomTabBar from './BottomTabBar';
import { useStore } from '../../store/useStore';
import { useEffect } from 'react';
import { Edit3, ArrowUpDown } from 'lucide-react';


export default function AppLayout() {
  const init = useStore(state => state.init);
  const isInitialized = useStore(state => state.isInitialized);
  const isEditMode = useStore(state => state.isEditMode);
  const isReorderMode = useStore(state => state.isReorderMode);
  const setEditMode = useStore(state => state.setEditMode);
  const setReorderMode = useStore(state => state.setReorderMode);
  const folders = useStore(state => state.folders);
  const rankings = useStore(state => state.rankings);

  useEffect(() => { init(); }, [init]);

  
  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <>
      {/* Animated background orbs */}
      <div aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="relative min-h-screen text-slate-100 flex flex-col">
        {/* Header — colorful gradient */}
        <header className="sticky top-0 z-[2147483647] backdrop-blur-xl border-b border-white/10 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(10,10,20,0.85) 40%, rgba(212,175,55,0.20) 100%)',
          }}
        >
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 max-w-[40%] sm:max-w-[50%] relative z-0">
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 relative z-[10000]">
              <button 
                onPointerDown={(e) => { e.stopPropagation(); setReorderMode(!isReorderMode); }}
                className="relative flex items-center gap-2 group focus:outline-none py-2 px-3 pointer-events-auto bg-white/5 active:bg-accent/20 rounded-xl transition-all cursor-pointer active:scale-95 touch-none"
              >
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isReorderMode ? 'text-blue-400' : 'text-slate-500'}`}>
                  並び替えモード
                </span>
                <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex items-center ${isReorderMode ? 'bg-blue-400/30 border border-blue-400/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-white/20 border border-white/10'}`}>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isReorderMode ? 'bg-blue-400 translate-x-5' : 'bg-slate-400'}`} />
                </div>
              </button>

              <button 
                onPointerDown={(e) => { e.stopPropagation(); setEditMode(!isEditMode); }}
                className="relative flex items-center gap-2 group focus:outline-none py-2 px-3 pointer-events-auto bg-white/5 active:bg-accent/20 rounded-xl transition-all cursor-pointer active:scale-95 touch-none"
              >
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isEditMode ? 'text-accent' : 'text-slate-500'}`}>
                  編集モード
                </span>
                <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex items-center ${isEditMode ? 'bg-accent/30 border border-accent/50 shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-white/20 border border-white/10'}`}>
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isEditMode ? 'bg-accent translate-x-5' : 'bg-slate-400'}`} />
                </div>
              </button>
            </div>
              <HamburgerMenu />
            </div>
          </div>
          {/* Colorful header accent line */}
          <div className="h-px w-full" style={{
            background: 'linear-gradient(90deg, #7c3aed, #D4AF37, #0ea5e9, #7c3aed)'
          }} />
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pb-28">
          <Outlet />
        </main>

        <BottomTabBar />
      </div>
    </>
  );
}
