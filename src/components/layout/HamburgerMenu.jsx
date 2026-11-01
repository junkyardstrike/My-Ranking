import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, matchPath } from 'react-router-dom';
import { Plus, X, FolderPlus, FileText, Sparkles, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv, color: 'bg-genre-anime', emoji: '📺' },
  { id: 'manga', label: '漫画', icon: BookOpen, color: 'bg-genre-manga', emoji: '📖' },
  { id: 'movie', label: '映画', icon: Film, color: 'bg-genre-movie', emoji: '🎬' },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard, color: 'bg-genre-drama', emoji: '🎭' },
  { id: 'game', label: 'ゲーム', icon: Gamepad2, color: 'bg-genre-game', emoji: '🎮' },
  { id: 'music', label: '音楽', icon: Music, color: 'bg-genre-music', emoji: '🎵' },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenreSelect, setShowGenreSelect] = useState(false); // for new ranking
  const [showRecordItem, setShowRecordItem] = useState(false);   // for new record
  const [rankingTitle, setRankingTitle] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const [selectedRecordGenre, setSelectedRecordGenre] = useState('music');
  
  const location = useLocation();
  const rankings = useStore(state => state.rankings);
  // 作成先フォルダは「今表示している画面」から決める。
  // （以前は最後に開いたフォルダが残り、STATS画面などで作ると見えないフォルダに作られていた）
  const folderMatch = matchPath('/folder/:folderId', location.pathname);
  const rankingMatch = matchPath('/ranking/:rankingId', location.pathname);
  const currentFolderId = folderMatch
    ? folderMatch.params.folderId
    : rankingMatch
      ? (rankings.find(r => r.id === rankingMatch.params.rankingId)?.folderId ?? null)
      : null;
  const addFolder = useStore(state => state.addFolder);
  const addRanking = useStore(state => state.addRanking);
  const recordItem = useStore(state => state.recordItem);

  const toggleMenu = () => setIsOpen(open => !open);

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

    const allItems = useStore.getState().getAllItems();
    const cleanTitle = recordTitle.trim();
    const duplicateItems = allItems.filter(item => 
      item.title?.toLowerCase().trim() === cleanTitle.toLowerCase().trim()
    );

    if (duplicateItems.length > 0) {
      const GENRE_LABELS = {
        anime: 'アニメ', manga: '漫画', movie: '映画', drama: 'ドラマ', game: 'ゲーム', music: '音楽'
      };
      
      const duplicateDetails = duplicateItems.map(item => {
        const gLabel = GENRE_LABELS[item.genre] || item.genre;
        const rTitle = item.rankingTitle || 'レコード一覧';
        return `・「${gLabel}」の「${rTitle}」`;
      });
      
      const detailString = duplicateDetails.join('\n');
      
      if (!confirm(`【重複注意】\n「${cleanTitle}」は既に以下の場所に登録されています：\n\n${detailString}\n\nこのまま登録しますか？`)) {
        return;
      }
    }

    recordItem({ title: cleanTitle, genre: selectedRecordGenre });
    setRecordTitle('');
    setSelectedRecordGenre('music');
    setShowRecordItem(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        type="button"
        onClick={toggleMenu}
        aria-label="コンテンツを追加"
        className="w-10 h-10 flex items-center justify-center bg-coral text-white active:bg-ink ml-1"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`fixed inset-0 bg-ink/60  z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => { setIsOpen(false); setShowGenreSelect(false); setShowRecordItem(false); }}
          />

          <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-white border-2 border-ink w-full max-w-sm transform transition-all duration-300 ${isOpen && !showGenreSelect && !showRecordItem ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-2xl text-ink uppercase">コンテンツ追加</h2>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-3 -m-1 hover:bg-mist active:bg-mist transition-colors text-ink border-2 border-ink bg-white"
                              >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <button onClick={() => setShowRecordItem(true)} className="w-full flex items-center justify-center gap-4 p-5 rounded-sm bg-accent text-white hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <FileText className="w-6 h-6" />
                  <span className="font-black text-lg tracking-tight uppercase">レコード作成</span>
                </button>
                
                <button onClick={() => setShowGenreSelect(true)} className="w-full flex items-center justify-center gap-4 p-5 rounded-sm bg-mist hover:bg-mist border border-line transition-all text-ink hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="w-6 h-6 text-accent" strokeWidth={3} />
                  <span className="font-black text-lg tracking-tight uppercase">ランキング作成</span>
                </button>

                <button onClick={handleCreateFolder} className="w-full flex items-center justify-center gap-4 p-5 rounded-sm bg-mist hover:bg-mist border border-line transition-all text-ink hover:scale-[1.02] active:scale-[0.98]">
                  <FolderPlus className="w-6 h-6 text-emerald-500" strokeWidth={3} />
                  <span className="font-black text-lg tracking-tight uppercase">フォルダ作成</span>
                </button>
              </div>
            </div>
          </div>

          {/* New Ranking Modal */}
          <div className={`fixed inset-0 z-[102] flex items-center justify-center p-4 pointer-events-none`}>
            <div className={`bg-white border-2 border-ink w-full max-w-sm transform transition-all duration-300 ${showGenreSelect ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl text-ink uppercase">ランキングを新規作成</h2>
                  <button 
                    type="button"
                    onClick={() => setShowGenreSelect(false)}
                    className="p-3 -m-1 hover:bg-mist active:bg-mist transition-colors text-ink border-2 border-ink bg-white"
                              >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input type="text" value={rankingTitle} onChange={e => setRankingTitle(e.target.value)} placeholder="ランキングのタイトルを入力..." className="w-full bg-mist border border-line rounded-sm px-5 py-4 text-ink focus:outline-none focus:border-accent transition-all text-lg font-bold" />
                <div className="grid grid-cols-2 gap-2.5">
                  {GENRES.map(genre => (
                    <button key={genre.id} onClick={() => handleSelectRankingGenre(genre.id)} disabled={!rankingTitle.trim()} className={`flex flex-col items-center gap-2 p-4 border-2 transition-colors ${rankingTitle.trim() ? `${genre.color} border-ink text-white active:opacity-80` : 'bg-mist border-line text-ink/40 cursor-not-allowed'}`}>
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
            <div className={`bg-white border-2 border-ink w-full max-w-sm transform transition-all duration-300 ${showRecordItem ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl text-ink uppercase">レコードを作成</h2>
                  <button 
                    type="button"
                    onClick={() => setShowRecordItem(false)}
                    className="p-3 -m-1 hover:bg-mist active:bg-mist transition-colors text-ink border-2 border-ink bg-white"
                              >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <input type="text" value={recordTitle} onChange={e => setRecordTitle(e.target.value)} placeholder="タイトルを入力..." className="w-full bg-mist border border-line rounded-sm px-5 py-4 text-ink focus:outline-none focus:border-accent transition-all text-lg font-bold" />
                  
                  <div className="grid grid-cols-5 gap-2">
                    {GENRES.map(genre => (
                      <button 
                        key={genre.id} 
                        onClick={() => setSelectedRecordGenre(genre.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded border transition-all ${selectedRecordGenre === genre.id ? 'bg-mist border-accent text-accent scale-105' : 'bg-mist border-line text-ink/40 hover:text-muted'}`}
                        title={genre.label}
                      >
                        <genre.icon className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase">{genre.label}</span>
                      </button>
                    ))}
                  </div>

                  <button onClick={handleRecordItem} disabled={!recordTitle.trim()} className="w-full py-5 rounded-sm bg-accent text-white font-black flex items-center justify-center gap-3 disabled:opacity-30 hover:scale-[1.02] active:scale-95 transition-all text-lg">
                    作成を完了 <Sparkles className="w-5 h-5" />
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
