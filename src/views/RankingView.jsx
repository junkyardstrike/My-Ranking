import { useState, useDeferredValue } from 'react';
import { useStore } from '../store/useStore';
import { navigate } from '../lib/router';
import RankingList from '../components/ranking/RankingList';
import ModeBanner from '../components/common/ModeBanner';
import { ArrowLeft, Maximize2, Minimize2, PlusSquare } from 'lucide-react';

export default function RankingView({ rankingId }) {
  const ranking = useStore(state => state.rankings.find(r => r.id === rankingId));
  const isEditMode = useStore(state => state.isEditMode);
  const isReorderMode = useStore(state => state.isReorderMode);

  // 並び替えモード中は自動で最小化、終わったら展開する
  const [isCollapsed, setIsCollapsed] = useState(isReorderMode);
  const [seenReorder, setSeenReorder] = useState(isReorderMode);
  if (seenReorder !== isReorderMode) {
    setSeenReorder(isReorderMode);
    setIsCollapsed(isReorderMode);
  }

  // スイッチ類は即座に切り替え、作品カードの作り直しは後回しにする（押した直後に画面が固まらないように）
  const listEditMode = useDeferredValue(isEditMode);
  const listReorderMode = useDeferredValue(isReorderMode);
  const listCollapsed = useDeferredValue(isCollapsed);

  if (!ranking) {
    return <div className="p-8 text-center text-muted font-bold">ランキングが見つかりません</div>;
  }

  return (
    <div className="pt-1 grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(ranking.folderId ? `/folder/${ranking.folderId}` : '/')}
          className="fes-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />戻る
        </button>
        <div className="flex items-center gap-2">
          {!isEditMode && (
            <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="fes-btn">
              {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              {isCollapsed ? '展開' : '最小化'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/all', { state: { mode: 'select', targetRankingId: ranking.id } })}
            className="fes-btn"
          >
            <PlusSquare className="w-3.5 h-3.5" />レコードから追加
          </button>
        </div>
      </div>

      <div className="fes-pass">
        <p className="font-fes text-[11px] tracking-[0.04em] opacity-90">MASTERPIECE FILM FES</p>
        <h1 className="text-[26px] sm:text-4xl font-black leading-tight mt-0.5 break-words">{ranking.title}</h1>
        <p className="text-[10px] font-bold tracking-[0.12em] opacity-85 mt-1">{ranking.englishName || 'MASTERPIECE SELECTION ARCHIVE'}</p>
      </div>

      <ModeBanner isEditMode={isEditMode} isReorderMode={isReorderMode} editNote="※この画面での編集操作は即時保存されます。" />

      <RankingList
        ranking={ranking}
        isCollapsed={listCollapsed}
        isEditMode={listEditMode}
        isReorderMode={listReorderMode}
      />
    </div>
  );
}
