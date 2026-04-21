import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, FolderPlus, FileText, Sparkles, Tv, BookOpen, Film, Clapperboard, Music } from 'lucide-react';
import { useStore } from '../../store/useStore';

const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv, color: 'from-blue-500 to-cyan-500', emoji: '📺' },
  { id: 'manga', label: '漫画', icon: BookOpen, color: 'from-pink-500 to-rose-500', emoji: '📖' },
  { id: 'movie', label: '映画', icon: Film, color: 'from-amber-500 to-orange-500', emoji: '🎬' },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard, color: 'from-purple-500 to-violet-500', emoji: '🎭' },
  { id: 'music', label: '音楽', icon: Music, color: 'from-slate-500 to-slate-600', emoji: '🎵' },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false); // for new ranking
  const [showRecordItem, setShowRecordItem] = useState(false);   // for new record
  const [rankingTitle, setRankingTitle] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const [selectedRecordGenre, setSelectedRecordGenre] = useState('music');
  
  const currentFolderId = useStore(state => state.currentFolderId);
  const addFolder = useStore(state => state.addFolder);
  const addRanking = useStore(state => state.addRanking);
  const recordItem = useStore(state => state.recordItem);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleCreateFolder = () => {
    const name = prompt('フォルダ名を入力してください');
    if (name) addFolder(name, currentFolderId);
    setIsOpen(false);
  };

  const handleSelectRankingGenre = (genreId) => {
    if (!rankingTitle.trim()) return;
    addRanking(rankingTitle.trim(), currentFolderId, genreId);
    setRankingTitle('');
    setShowGenreSelect(false);
    setIsOpen(false);
  };

  const handleRecordItem = () => {
    if (!recordTitle.trim()) return;
    recordItem({ title: recordTitle.trim(), genre: selectedRecordGenre });
    setRecordTitle('');
    setSelectedRecordGenre('music');
    setShowRecordItem(false);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-50 focus:outline-none bg-accent/20 border border-accent/30">
        <Plus className="w-5 h-5 text-accent" />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => { setIsOpen(false); setShowGenreSelect(false); setShowRecordItem(false); }}
          />

          <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/90 backdrop-blur-3xl border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl transform transition-all duration-300 ${isOpen && !showGenreSelect && !showRecordItem ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-2xl tracking-tighter text-white uppercase italic">Add Content</h2>
                  <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-600 bg-white/5"><X className="w-5 h-5" /></button>
                </div>
                
                <button onClick={() => setShowGenreSelect(true)} className="w-full flex items-center justify-center gap-4 p-5 rounded-3xl bg-accent text-black shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Plus className="w-6 h-6" strokeWidth={3} />
                  <span className="font-black text-lg tracking-tight uppercase">New Ranking</span>
                </button>
                
                <button onClick={() => setShowRecordItem(true)} className="w-full flex items-center justify-center gap-4 p-5 rounded-3xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-white hover:scale-[1.02] active:scale-[0.98]">
                  <FileText className="w-6 h-6 text-accent" />
                  <span className="font-black text-lg tracking-tight uppercase">Record Item</span>
                </button>

                <button onClick={handleCreateFolder} className="w-full flex items-center justify-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-slate-500 hover:scale-[1.02] active:scale-[0.98]">
                  <FolderPlus className="w-6 h-6" />
                  <span className="font-bold text-lg tracking-tight">New Folder</span>
                </button>
              </div>
            </div>
          </div>

          {/* New Ranking Modal */}
          <div className={`fixed inset-0 z-[102] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/95 backdrop-blur-3xl border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl transform transition-all duration-300 ${showGenreSelect ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl text-white tracking-tighter uppercase italic">Create Ranking</h2>
                  <button onClick={() => setShowGenreSelect(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-600 bg-white/5"><X className="w-5 h-5" /></button>
                </div>
                <input type="text" value={rankingTitle} onChange={e => setRankingTitle(e.target.value)} placeholder="Enter title..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-accent transition-all text-lg font-bold" />
                <div className="grid grid-cols-2 gap-2.5">
                  {GENRES.map(genre => (
                    <button key={genre.id} onClick={() => handleSelectRankingGenre(genre.id)} disabled={!rankingTitle.trim()} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${rankingTitle.trim() ? `bg-gradient-to-br ${genre.color} border-transparent text-white shadow-lg hover:scale-105 active:scale-95` : 'bg-white/5 border-white/5 text-slate-800 cursor-not-allowed'}`}>
                      <genre.icon className="w-6 h-6" />
                      <span className="text-[10px] font-black tracking-widest uppercase">{genre.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Record Item Modal - Integrated Genre Selection */}
          <div className={`fixed inset-0 z-[102] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/95 backdrop-blur-3xl border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl transform transition-all duration-300 ${showRecordItem ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl text-white tracking-tighter uppercase italic">Record Content</h2>
                  <button onClick={() => setShowRecordItem(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-600 bg-white/5"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <input type="text" value={recordTitle} onChange={e => setRecordTitle(e.target.value)} placeholder="Title..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-accent transition-all text-lg font-bold" />
                  
                  <div className="grid grid-cols-5 gap-2">
                    {GENRES.map(genre => (
                      <button 
                        key={genre.id} 
                        onClick={() => setSelectedRecordGenre(genre.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${selectedRecordGenre === genre.id ? 'bg-accent/20 border-accent/40 text-accent scale-105' : 'bg-white/5 border-white/5 text-slate-700 hover:text-slate-500'}`}
                        title={genre.label}
                      >
                        <genre.icon className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{genre.label}</span>
                      </button>
                    ))}
                  </div>

                  <button onClick={handleRecordItem} disabled={!recordTitle.trim()} className="w-full py-5 rounded-2xl bg-accent text-black font-black flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-accent/10 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-tighter">
                    COMPLETE RECORD <Sparkles className="w-5 h-5" />
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
