import { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, ListOrdered, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

/** Standalone overlay: receives onClose prop, opens immediately */
export default function GlobalSearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const folders = useStore(state => state.folders) || [];
  const rankings = useStore(state => state.rankings) || [];
  const allItems = rankings.flatMap(r =>
    (r.items || []).map(item => ({ ...item, rankingId: r.id, rankingTitle: r.title }))
  );

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const q = query.toLowerCase().trim();
  const matchedFolders  = q ? folders.filter(f => (f.name||'').toLowerCase().includes(q) || (f.englishName||'').toLowerCase().includes(q)) : [];
  const matchedRankings = q ? rankings.filter(r => (r.title||'').toLowerCase().includes(q) || (r.englishName||'').toLowerCase().includes(q)) : [];
  const matchedItems    = q ? allItems.filter(i => (i.title||'').toLowerCase().includes(q) || (i.author||'').toLowerCase().includes(q) || (i.memo||'').toLowerCase().includes(q)) : [];

  const go = (path) => { navigate(path); onClose(); };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-200">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="フォルダ、ランキング、作品を検索..."
            className="w-full bg-white/10 border border-white/20 rounded-full py-2.5 pl-10 pr-4 text-white placeholder:text-slate-400 focus:outline-none focus:border-accent"
          />
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-32">
        {!q ? (
          <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-3">
            <Search className="w-12 h-12 opacity-30" />
            <p className="text-sm">キーワードを入力してください</p>
          </div>
        ) : matchedFolders.length === 0 && matchedRankings.length === 0 && matchedItems.length === 0 ? (
          <p className="text-center text-slate-500 mt-10 text-sm">「{query}」の検索結果はありません</p>
        ) : (
          <div className="space-y-6">
            {matchedFolders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-white/10"><Folder className="w-3.5 h-3.5 text-accent" />Folders</h3>
                {matchedFolders.map(f => (
                  <div key={f.id} onClick={() => go(`/folder/${f.id}`)} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer">
                    <p className="font-bold text-white text-sm">{f.name}</p>
                    {f.englishName && <p className="text-xs text-slate-400">{f.englishName}</p>}
                  </div>
                ))}
              </div>
            )}
            {matchedRankings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-white/10"><ListOrdered className="w-3.5 h-3.5 text-accent" />Rankings</h3>
                {matchedRankings.map(r => (
                  <div key={r.id} onClick={() => go(`/ranking/${r.id}`)} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer">
                    <p className="font-bold text-white text-sm">{r.title}</p>
                    {r.englishName && <p className="text-xs text-slate-400">{r.englishName}</p>}
                  </div>
                ))}
              </div>
            )}
            {matchedItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-white/10"><FileText className="w-3.5 h-3.5 text-accent" />Items</h3>
                {matchedItems.map(i => (
                  <div key={i.id} onClick={() => go(`/ranking/${i.rankingId}`)} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer">
                    <p className="text-xs text-accent font-medium mb-0.5">{i.rankingTitle} · {i.currentRank}位</p>
                    <p className="font-bold text-white text-sm">{i.title}</p>
                    {i.author && <p className="text-xs text-slate-400">{i.author}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
