import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, FolderPlus, LayoutList, LayoutGrid, Film, BookOpen, Tv, Clapperboard, MoreHorizontal, FileText, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv, color: 'from-blue-500 to-cyan-500' },
  { id: 'manga', label: '漫画', icon: BookOpen, color: 'from-pink-500 to-rose-500' },
  { id: 'movie', label: '映画', icon: Film, color: 'from-amber-500 to-orange-500' },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard, color: 'from-purple-500 to-violet-500' },
  { id: 'other', label: 'その他', icon: MoreHorizontal, color: 'from-slate-500 to-slate-600' },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false);
  const [showRecordItem, setShowRecordItem] = useState(false);
  const [rankingTitle, setRankingTitle] = useState('');
  
  // For record item
  const [recordTitle, setRecordTitle] = useState('');
  
  const currentFolderId = useStore(state => state.currentFolderId);
  const folders = useStore(state => state.folders);
  const addFolder = useStore(state => state.addFolder);
  const addRanking = useStore(state => state.addRanking);
  const recordItem = useStore(state => state.recordItem);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleCreateFolder = () => {
    const name = prompt('フォルダ名を入力してください');
    if (name) addFolder(name, currentFolderId);
    setIsOpen(false);
  };

  const handleSelectGenre = (genreId) => {
    if (!rankingTitle.trim()) return;
    addRanking(rankingTitle.trim(), currentFolderId, genreId);
    setRankingTitle('');
    setShowGenreSelect(false);
    setIsOpen(false);
  };

  const handleRecordItem = () => {
    if (!recordTitle.trim()) return;
    recordItem({ title: recordTitle.trim() });
    setRecordTitle('');
    setShowRecordItem(false);
    setIsOpen(false);
    alert('「RECORDS」に追加されました');
  };

  return (
    <>
      <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-50 focus:outline-none bg-accent/20 border border-accent/30">
        <Plus className="w-5 h-5 text-accent" />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => { setIsOpen(false); setShowGenreSelect(false); setShowRecordItem(false); }}
          />

          <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/90 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl transform transition-all duration-300 ease-out ${isOpen && !showGenreSelect && !showRecordItem ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-2xl tracking-tighter text-white uppercase italic">Actions</h2>
                  <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 bg-white/5">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <button onClick={() => setShowGenreSelect(true)} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-accent text-black shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Plus className="w-6 h-6" strokeWidth={3} />
                  <span className="font-black text-lg tracking-tight">新規ランキング</span>
                </button>
                
                <button onClick={() => setShowRecordItem(true)} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-white hover:scale-[1.02] active:scale-[0.98]">
                  <FileText className="w-6 h-6 text-accent" />
                  <span className="font-black text-lg tracking-tight">作品を記録</span>
                </button>

                <button onClick={handleCreateFolder} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-slate-400 hover:scale-[1.02] active:scale-[0.98]">
                  <FolderPlus className="w-6 h-6" />
                  <span className="font-bold text-lg tracking-tight">新規フォルダ</span>
                </button>
              </div>
            </div>
          </div>

          {/* New Ranking Modal */}
          <div className={`fixed inset-0 z-[102] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/95 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl transform transition-all duration-300 ${showGenreSelect ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl text-white tracking-tighter uppercase italic">New Ranking</h2>
                  <button onClick={() => setShowGenreSelect(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 bg-white/5"><X className="w-5 h-5" /></button>
                </div>
                <input type="text" value={rankingTitle} onChange={e => setRankingTitle(e.target.value)} placeholder="タイトルを入力..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-accent transition-colors text-lg font-bold" />
                <div className="grid grid-cols-2 gap-2.5">
                  {GENRES.map(genre => {
                    const Icon = genre.icon;
                    return (
                      <button key={genre.id} onClick={() => handleSelectGenre(genre.id)} disabled={!rankingTitle.trim()} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${rankingTitle.trim() ? `bg-gradient-to-br ${genre.color} border-transparent text-white shadow-lg hover:scale-105 active:scale-95` : 'bg-white/5 border-white/5 text-slate-700 cursor-not-allowed'}`}>
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-black tracking-widest uppercase">{genre.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Record Item Modal */}
          <div className={`fixed inset-0 z-[102] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/95 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl transform transition-all duration-300 ${showRecordItem ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl text-white tracking-tighter uppercase italic">Record Item</h2>
                  <button onClick={() => setShowRecordItem(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 bg-white/5"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed px-1 text-center italic">
                    ランキングには入らない「作品リスト（RECORDS）」に追加されます。後からランキングに追加することも可能です。
                  </p>
                  <input type="text" value={recordTitle} onChange={e => setRecordTitle(e.target.value)} placeholder="作品名を入力..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-accent transition-colors text-lg font-bold" />
                  <button onClick={handleRecordItem} disabled={!recordTitle.trim()} className="w-full py-4 rounded-2xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-30">
                    記録する <Sparkles className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
