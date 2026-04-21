import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, FolderPlus, LayoutList, LayoutGrid, Film, BookOpen, Tv, Clapperboard, MoreHorizontal } from 'lucide-react';
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
  const [rankingTitle, setRankingTitle] = useState('');
  const currentFolderId = useStore(state => state.currentFolderId);
  
  const viewMode = useStore(state => state.viewMode);
  const setViewMode = useStore(state => state.setViewMode);
  const folders = useStore(state => state.folders);
  
  const addFolder = useStore(state => state.addFolder);
  const addRanking = useStore(state => state.addRanking);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleCreateFolder = () => {
    let level = 0;
    let folder = folders.find(f => f.id === currentFolderId);
    while (folder) {
      level++;
      folder = folders.find(f => f.id === folder.parentId);
    }
    
    if (level >= 5) {
      alert('フォルダの階層は5階層までです');
      return;
    }

    const name = prompt('フォルダ名を入力してください');
    if (name) {
      addFolder(name, currentFolderId);
    }
    setIsOpen(false);
  };

  const handleStartCreateRanking = () => {
    setShowGenreSelect(true);
  };

  const handleSelectGenre = (genreId) => {
    if (!rankingTitle.trim()) return;
    addRanking(rankingTitle.trim(), currentFolderId, genreId);
    setRankingTitle('');
    setShowGenreSelect(false);
    setIsOpen(false);
  };

  const handleCloseGenreSelect = () => {
    setShowGenreSelect(false);
    setRankingTitle('');
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-50 focus:outline-none bg-accent/20 border border-accent/30">
        <Plus className="w-5 h-5 text-accent" />
      </button>

      {/* Portal for Overlay and Modal */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay */}
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => { setIsOpen(false); handleCloseGenreSelect(); }}
          />

          {/* Main Menu Modal */}
          <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/90 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl transform transition-all duration-300 ease-out ${isOpen && !showGenreSelect ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-2xl tracking-wide text-white">Menu</h2>
                  <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white bg-white/5">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <button onClick={handleStartCreateRanking} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-accent to-yellow-600 text-black shadow-lg shadow-accent/30 hover:from-yellow-500 hover:to-amber-500 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="w-6 h-6" />
                  <span className="font-bold text-lg tracking-wide">新規ランキング作成</span>
                </button>
                
                <button onClick={handleCreateFolder} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-slate-200 hover:scale-[1.02] active:scale-[0.98]">
                  <FolderPlus className="w-6 h-6 text-accent" />
                  <span className="font-semibold text-lg tracking-wide">新規フォルダ作成</span>
                </button>

                <div className="py-2">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <button onClick={toggleViewMode} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all text-slate-300 border border-transparent hover:border-white/10 active:scale-[0.98]">
                  {viewMode === 'list' ? <LayoutGrid className="w-6 h-6" /> : <LayoutList className="w-6 h-6" />}
                  <span className="font-medium text-lg tracking-wide">{viewMode === 'list' ? 'グリッド表示に切替' : 'リスト表示に切替'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Genre Selection Modal */}
          <div className={`fixed inset-0 z-[102] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-surface/95 backdrop-blur-2xl border border-accent/20 w-full max-w-sm rounded-3xl shadow-2xl shadow-accent/10 transform transition-all duration-300 ease-out ${showGenreSelect ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl tracking-wide text-white">新規ランキング</h2>
                  <button onClick={handleCloseGenreSelect} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white bg-white/5">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Title Input */}
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wider">タイトル</label>
                  <input
                    type="text"
                    value={rankingTitle}
                    onChange={e => setRankingTitle(e.target.value)}
                    placeholder="ランキングのタイトル"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors text-lg"
                    autoFocus
                  />
                </div>

                {/* Genre Grid */}
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-3 block uppercase tracking-wider">ジャンル選択</label>
                  <div className="grid grid-cols-2 gap-3">
                    {GENRES.map(genre => {
                      const Icon = genre.icon;
                      return (
                        <button
                          key={genre.id}
                          onClick={() => handleSelectGenre(genre.id)}
                          disabled={!rankingTitle.trim()}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                            rankingTitle.trim()
                              ? `bg-gradient-to-br ${genre.color} border-transparent text-white shadow-lg hover:scale-105 active:scale-95 hover:shadow-xl`
                              : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                          <span className="text-sm font-bold tracking-wide">{genre.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  ジャンルに応じて作品情報を自動取得できます
                </p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
