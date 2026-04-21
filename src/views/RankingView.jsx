import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import RankingEditor from '../components/ranking/RankingEditor';
import RankingList from '../components/ranking/RankingList';
import { ArrowLeft } from 'lucide-react';

export default function RankingView() {
  const { rankingId } = useParams();
  const navigate = useNavigate();
  const rankings = useStore(state => state.rankings);
  const isEditMode = useStore(state => state.isEditMode);
  const viewMode = useStore(state => state.viewMode);
  const updateRankingItems = useStore(state => state.updateRankingItems);

  const ranking = rankings.find(r => r.id === rankingId);

  if (!ranking) {
    return <div className="p-8 text-center text-slate-500">ランキングが見つかりません</div>;
  }

  const handleSave = (newItems) => {
    updateRankingItems(ranking.id, newItems);
  };

  return (
    <div className="animate-in fade-in duration-500 pt-2 sm:pt-4">
      <div className="mb-8">
        <div className="relative flex justify-center mb-6">
          <button 
            onClick={() => navigate(ranking.folderId ? `/folder/${ranking.folderId}` : '/')}
            className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 bg-surface/50 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-surface-light hover:border-white/10 shadow-sm"
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

        {isEditMode && (
          <div className="flex justify-center">
            <div className="inline-block px-3 py-1.5 bg-accent/20 border border-accent/30 rounded-lg">
              <p className="text-accent text-sm font-medium text-center">
                右側のハンドルをドラッグして順位を並び替え、各項目の内容を編集できます。
              </p>
            </div>
          </div>
        )}
      </div>

      {isEditMode ? (
        <RankingEditor ranking={ranking} onSave={handleSave} />
      ) : (
        <RankingList ranking={ranking} viewMode={viewMode} />
      )}
    </div>
  );
}
