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

  // Auto-collapse when reorder mode is turned on
  useEffect(() => {
    if (isReorderMode) setIsCollapsed(true);
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
      <div className="mb-6">
        <div className="flex items-end justify-between px-1 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">{ranking.title}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{ranking.englishName || 'RANKING SELECTION'}</p>
          </div>
          <button 
            onClick={() => navigate(ranking.folderId ? `/folder/${ranking.folderId}` : '/')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
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
