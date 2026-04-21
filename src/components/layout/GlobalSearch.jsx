import { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, ListOrdered, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const folders = useStore(state => state.folders) || [];
  const rankings = useStore(state => state.rankings) || [];
  
  // Flatten items for search
  const allItems = rankings.flatMap(r => 
    (r.items || []).map(item => ({ ...item, rankingId: r.id, rankingTitle: r.title }))
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const q = query.toLowerCase().trim();
  
  const matchedFolders = q ? folders.filter(f => 
    (f.name && f.name.toLowerCase().includes(q)) || 
    (f.englishName && f.englishName.toLowerCase().includes(q))
  ) : [];
  
  const matchedRankings = q ? rankings.filter(r => 
    (r.title && r.title.toLowerCase().includes(q)) || 
    (r.englishName && r.englishName.toLowerCase().includes(q))
  ) : [];

  const matchedItems = q ? allItems.filter(i => 
    (i.title && i.title.toLowerCase().includes(q)) || 
    (i.author && i.author.toLowerCase().includes(q)) ||
    (i.memo && i.memo.toLowerCase().includes(q))
  ) : [];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white bg-white/5 border border-transparent hover:border-white/10"
      >
        <Search className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          {/* Header */}
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
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!q ? (
              <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-3">
                <Search className="w-12 h-12 opacity-50" />
                <p>検索キーワードを入力してください</p>
              </div>
            ) : matchedFolders.length === 0 && matchedRankings.length === 0 && matchedItems.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">
                <p>「{query}」に一致する結果は見つかりませんでした</p>
              </div>
            ) : (
              <div className="space-y-8 pb-20">
                {matchedFolders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                      <Folder className="w-4 h-4 text-accent" /> Folders
                    </h3>
                    <div className="space-y-2">
                      {matchedFolders.map(f => (
                        <div 
                          key={f.id}
                          onClick={() => { navigate(`/folder/${f.id}`); handleClose(); }}
                          className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
                        >
                          <p className="font-bold text-white">{f.name}</p>
                          {f.englishName && <p className="text-xs text-slate-400">{f.englishName}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedRankings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                      <ListOrdered className="w-4 h-4 text-accent" /> Rankings
                    </h3>
                    <div className="space-y-2">
                      {matchedRankings.map(r => (
                        <div 
                          key={r.id}
                          onClick={() => { navigate(`/ranking/${r.id}`); handleClose(); }}
                          className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
                        >
                          <p className="font-bold text-white">{r.title}</p>
                          {r.englishName && <p className="text-xs text-slate-400">{r.englishName}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedItems.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                      <FileText className="w-4 h-4 text-accent" /> Items
                    </h3>
                    <div className="space-y-2">
                      {matchedItems.map(i => (
                        <div 
                          key={i.id}
                          onClick={() => { navigate(`/ranking/${i.rankingId}`); handleClose(); }}
                          className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
                        >
                          <p className="text-xs text-accent font-medium mb-1">{i.rankingTitle} - {i.currentRank}位</p>
                          <p className="font-bold text-white">{i.title}</p>
                          {i.author && <p className="text-xs text-slate-400">制作者: {i.author}</p>}
                          {i.memo && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{i.memo}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
