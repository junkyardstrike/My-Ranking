import { useState } from 'react';
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
        <div className="relative flex justify-center mb-6">
          <button 
            onClick={() => navigate(ranking.folderId ? `/folder/${ranking.folderId}` : '/')}
            className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">戻る</span>
          </button>
          
          <div className="flex flex-col items-center px-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-2xl">{ranking.title}</h1>
            {ranking.englishName && (
              <div className="mt-1.5 flex flex-col items-center">
                <div className="h-0.5 w-8 bg-accent/80 my-1" />
                <p className="text-[11px] tracking-[0.2em] text-accent font-black uppercase opacity-90">{ranking.englishName}</p>
              </div>
            )}
          </div>
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
                  <span className="text-[10px] font-black uppercase tracking-widest">折り畳む</span>
                </>
              )}
            </button>
          )}

          {isEditMode && (
            <div className="inline-block px-3 py-1.5 bg-accent/20 border border-accent/30 rounded-lg">
              <p className="text-accent text-sm font-medium text-center">
                ドラッグして順位を並び替え、内容を直接編集できます。
              </p>
            </div>
          )}
        </div>
      </div>

      {isEditMode ? (
        <RankingEditor ranking={ranking} onSave={handleSave} />
      ) : (
        <RankingList ranking={ranking} viewMode="list" isCollapsed={isCollapsed} />
      )}
    </div>
  );
}
