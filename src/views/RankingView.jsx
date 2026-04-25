import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import RankingEditor from '../components/ranking/RankingEditor';
import RankingList from '../components/ranking/RankingList';
import { ArrowLeft, Maximize2, Minimize2, PlusSquare } from 'lucide-react';

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
            className="text-3xl sm:text-5xl font-black text-yellow-400 tracking-tighter uppercase italic drop-shadow-[0_0_35px_rgba(234,179,8,0.5)] px-4"
          >
            {ranking.title}
          </h1>
          <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-2 italic">{ranking.englishName || 'RANKING SELECTION ARCHIVE'}</p>
        </div>

        <div className="absolute left-0 top-0">
          <button 
            onClick={() => navigate(ranking.folderId ? `/folder/${ranking.folderId}` : '/')}
            className="flex-shrink-0 flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">戻る</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 flex flex-col items-end gap-2">
          <button 
            onClick={() => navigate('/all', { state: { mode: 'select', targetRankingId: ranking.id } })}
            className="flex-shrink-0 flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md active:scale-95 group"
          >
            <PlusSquare className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">レコードから追加</span>
          </button>

          {!isEditMode && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 shadow-xl backdrop-blur-md hover:bg-white/10 transition-all text-slate-400 hover:text-white group"
            >
              {isCollapsed ? (
                <>
                  <Maximize2 className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">展開</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">最小化</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          {(isEditMode || isReorderMode) && (
            <div className="inline-block px-4 py-1.5 bg-accent/20 border border-accent/30 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <p className="text-accent text-[11px] font-black text-center uppercase tracking-widest italic">
                {isEditMode ? '編集モード実行中' : '並び替えモード実行中'}
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
