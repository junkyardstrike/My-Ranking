import { useDialogs, closeDetail, closeAdd } from './dialogs';
import RankingItemDetailModal from './RankingItemDetailModal';
import AddToRankingDialog from './AddToRankingDialog';

export default function DialogHost() {
  const detailId = useDialogs(s => s.detailId);
  const addId = useDialogs(s => s.addId);
  return (
    <>
      {addId && <AddToRankingDialog key={addId} id={addId} onClose={closeAdd} />}
      {detailId && <RankingItemDetailModal key={detailId} id={detailId} onClose={closeDetail} />}
    </>
  );
}
