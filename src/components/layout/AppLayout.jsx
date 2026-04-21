import { Outlet } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import HamburgerMenu from './HamburgerMenu';
import BottomTabBar from './BottomTabBar';
import { useStore } from '../../store/useStore';
import { useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

export default function AppLayout() {
  const init = useStore(state => state.init);
  const isInitialized = useStore(state => state.isInitialized);
  const isEditMode = useStore(state => state.isEditMode);
  const setEditMode = useStore(state => state.setEditMode);
  const moveRanking = useStore(state => state.moveRanking);

  useEffect(() => { init(); }, [init]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) moveRanking(active.id, over.id);
  };

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {/* Animated background orbs */}
      <div aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="relative min-h-screen text-slate-100 flex flex-col">
        {/* Header — colorful gradient */}
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(10,10,20,0.85) 40%, rgba(212,175,55,0.20) 100%)',
          }}
        >
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!isEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 border text-sm ${
                  isEditMode
                    ? 'bg-accent/20 border-accent/50 text-accent shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="font-semibold tracking-wide hidden sm:inline">Edit</span>
              </button>
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
    </DndContext>
  );
}
