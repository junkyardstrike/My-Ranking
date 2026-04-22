import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import RankingEditor from '../components/ranking/RankingEditor';
import RankingList from '../components/ranking/RankingList';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

export default function RankingView() {
  const { rankingId } = useParams();
  const navigate = useNavigate();
  const rankings = useStore(state => state.rankings);
  const isEditMode = useStore(state => state.isEditMode);
  const updateRankingItems = useStore(state => state.updateRankingItems);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isReorderMode = useStore(state => state.isReorderMode);

  // Auto-collapse when reorder mode is on, auto-expand when off
  useEffect(() => {
    if (isReorderMode) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isReorderMode]);

  const ranking = rankings.find(r => r.id === rankingId);

  if (!ranking) {
    return <div className="p-8 text-center text-slate-500">ランキングが見つかりません</div>;
  }

  const handleSave = (newItems) => {
    updateRankingItems(ranking.id, newItems);
  };

  return (
    <div className="animate-in fade-in duration-500 pt-2 sm:pt-4">
      <div className="relative mb-6">
        <div className="flex flex-col items-center text-center px-1 mb-6 py-2">
          <h1 
            className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text animate-text-flash tracking-tighter uppercase italic drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] px-4"
            style={{ 
              backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%), linear-gradient(to bottom, #ffffff, #cbd5e1)',
            }}
          >
            {ranking.title}
          </h1>
          <p className="text-[11px] text-yellow-500/60 font-black uppercase tracking-[0.4em] mt-2 italic">{ranking.englishName || 'RANKING SELECTION ARCHIVE'}</p>
        </div>

        <div className="absolute left-0 top-0">
          <button 
            onClick={() => navigate(ranking.folderId ? `/folder/${ranking.folderId}` : '/')}
            className="flex-shrink-0 flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">Go Back</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* Collapse Toggle */}
          {!isEditMode && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white group"
            >
              {isCollapsed ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">展開する</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">折り畳み</span>
                </>
              )}
            </button>
          )}

          {(isEditMode || isReorderMode) && (
            <div className="inline-block px-3 py-1 bg-accent/20 border border-accent/30 rounded-lg">
              <p className="text-accent text-[10px] font-bold text-center uppercase tracking-widest">
                {isEditMode ? 'Edit Mode Active' : 'Reorder Mode Active'}
              </p>
            </div>
          )}
        </div>
      </div>

      <RankingList 
        ranking={ranking} 
        isCollapsed={isCollapsed} 
        isEditMode={isEditMode}
        onSave={handleSave}
      />
    </div>
  );
}
