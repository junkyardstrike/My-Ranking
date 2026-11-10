import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ListPlus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { normalizeGenre } from '../../utils/itemMetrics';

const GENRE_LABELS = { anime: 'アニメ', manga: '漫画', movie: '映画', drama: 'ドラマ', game: 'ゲーム', music: '音楽' };

// ランキング外の作品を、ランキングと順位を選んでその場で追加するダイアログ
export default function AddToRankingDialog({ item, onClose }) {
  const rankings = useStore(state => state.rankings);
  const insertItemIntoRanking = useStore(state => state.insertItemIntoRanking);
  const itemGenre = normalizeGenre(item.genre);

  // 同じジャンルのランキングを先に並べる
  const options = useMemo(() => rankings
    .map(r => ({ id: r.id, title: r.title, genre: normalizeGenre(r.genre), filled: (r.items || []).filter(i => i.title).length }))
    .sort((a, b) => (b.genre === itemGenre) - (a.genre === itemGenre)), [rankings, itemGenre]);

  const [selectedId, setSelectedId] = useState(options[0]?.id || '');
  const selected = options.find(o => o.id === selectedId);
  // 既定の順位は「今の最下位のひとつ下」
  const defaultRank = selected ? Math.min(100, selected.filled + 1) : 1;
  const [rankInput, setRankInput] = useState(null);
  const rank = Math.max(1, Math.min(100, parseInt(rankInput ?? defaultRank) || 1));

  const select = (id) => { setSelectedId(id); setRankInput(null); };
  const handleAdd = () => {
    if (!selected) return;
    insertItemIntoRanking(selected.id, item, rank);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-ink/60 cursor-pointer" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="add-to-ranking-title" className="relative w-full sm:max-w-md bg-white border-t-[3px] sm:border-2 border-ink max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 border-b border-line">
          <div className="min-w-0">
            <p className="font-fes text-[11px] text-muted">ADD TO RANKING</p>
            <h2 id="add-to-ranking-title" className="text-[16px] font-black leading-tight truncate">「{item.title}」を追加</h2>
          </div>
          <button type="button" aria-label="閉じる" onClick={onClose} className="flex-shrink-0 w-11 h-11 flex items-center justify-center border-2 border-ink active:bg-ink active:text-white">
            <X size={20} />
          </button>
        </div>

        {options.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-bold text-muted">ランキングがまだありません。右上の＋ボタンからランキングを作成してください。</p>
        ) : (
          <>
            <div className="overflow-y-auto overscroll-contain px-4 py-3 grid gap-2">
              <p className="text-[11px] font-black text-muted">追加するランキング</p>
              {options.map(o => {
                const on = o.id === selectedId;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => select(o.id)}
                    className={`flex items-center justify-between gap-2 min-h-[52px] px-3 border-2 text-left ${on ? 'bg-teal border-teal text-white' : 'bg-white border-ink text-ink active:bg-mist'}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-black truncate">{o.title}</span>
                      <span className={`block text-[10px] font-bold ${on ? 'text-white/85' : 'text-muted'}`}>{GENRE_LABELS[o.genre] || o.genre}{o.genre === itemGenre ? '・同じジャンル' : ''}</span>
                    </span>
                    <span className="font-fes text-[12px] flex-shrink-0">{o.filled}/100</span>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t-[3px] border-ink grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-black">順位</span>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="順位を上げる" onClick={() => setRankInput(String(Math.max(1, rank - 1)))} className="w-11 h-11 flex items-center justify-center border-2 border-ink active:bg-ink active:text-white"><Minus size={16} strokeWidth={3} /></button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="100"
                    aria-label="追加する順位"
                    value={rankInput ?? String(defaultRank)}
                    onChange={e => setRankInput(e.target.value)}
                    className="w-16 h-11 bg-ink text-white font-fes text-center outline-none focus:ring-2 focus:ring-coral"
                  />
                  <button type="button" aria-label="順位を下げる" onClick={() => setRankInput(String(Math.min(100, rank + 1)))} className="w-11 h-11 flex items-center justify-center border-2 border-ink active:bg-ink active:text-white"><Plus size={16} strokeWidth={3} /></button>
                </div>
              </div>
              {selected && selected.filled >= 100 && (
                <p className="text-[11px] font-bold text-coral">このランキングは100作品埋まっています。追加すると最下位の作品はレコードに戻ります。</p>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selected}
                className="min-h-[52px] flex items-center justify-center gap-2 bg-coral text-white font-black text-[15px] border-2 border-ink active:bg-ink disabled:opacity-40"
              >
                <ListPlus size={18} />{selected ? `「${selected.title}」の${rank}位に追加` : 'ランキングを選んでください'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
