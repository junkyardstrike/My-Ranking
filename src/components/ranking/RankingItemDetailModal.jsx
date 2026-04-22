import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Eye, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, Copy, History, MoreHorizontal, Type, Sparkles, Loader, Trash2 } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRE_MAP = {
  anime: { label: 'アニメ', icon: Tv },
  manga: { label: '漫画', icon: BookOpen },
  movie: { label: '映画', icon: Film },
  drama: { label: 'ドラマ', icon: Clapperboard },
  game: { label: 'ゲーム', icon: Gamepad2 },
  music: { label: '音楽', icon: Music },
};

const compressImage = (base64Str, maxWidth = 1000, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

export default function RankingItemDetailModal({ item: propItem, isOpen, onClose, onUpdate }) {
  const isGlobalEditMode = useStore(state => state.isEditMode);
  const setEditMode = useStore(state => state.setEditMode);
  const rankings = useStore(state => state.rankings);
  const insertItemIntoRanking = useStore(state => state.insertItemIntoRanking);
  const updateItemStore = useStore(state => state.updateItem);

  const itemFromStore = useStore(state => {
    const allRanked = (state.rankings || []).flatMap(r => r.items || []);
    const allUnranked = state.unrankedItems || [];
    return [...allRanked, ...allUnranked].find(i => i.id === propItem?.id);
  });

  const liveItem = itemFromStore ? {
    ...itemFromStore,
    isSelected: propItem?.isSelected || itemFromStore.isSelected,
    rankingId: propItem?.rankingId || itemFromStore.rankingId,
    rankingTitle: propItem?.rankingTitle || itemFromStore.rankingTitle
  } : propItem;

  const [isAddingToRanking, setIsAddingToRanking] = useState(false);
  const [selectedRankingId, setSelectedRankingId] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const [localTitle, setLocalTitle] = useState(liveItem?.title || '');
  const [localAuthor, setLocalAuthor] = useState(liveItem?.author || '');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLocalTitle(liveItem?.title || '');
      setLocalAuthor(liveItem?.author || '');
    } else {
      document.body.style.overflow = 'auto';
      setIsAddingToRanking(false);
    }
  }, [isOpen, liveItem?.id]);

  if (!isOpen || !liveItem) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre = 'music', isBold = false, color = '#ffffff', fontSize = 20 } = liveItem;

  const handleUpdate = (updates) => {
    if (onUpdate) {
      onUpdate(id, updates);
    } else {
      updateItemStore(id, updates);
    }
  };

  const handleTitleSync = () => {
    if (localTitle !== title) {
      handleUpdate({ title: localTitle });
    }
  };

  const handleAuthorSync = () => {
    if (localAuthor !== author) {
      handleUpdate({ author: localAuthor });
    }
  };

  const handleAddToRanking = () => {
    if (!selectedRankingId) return;
    if (window.confirm(`${selectedRank}位に挿入します。よろしいですか？`)) {
      insertItemIntoRanking(selectedRankingId, liveItem, parseInt(selectedRank));
      setIsAddingToRanking(false);
      onClose();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        handleUpdate({ imageBase64: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoFetch = async () => {
    if (!localTitle || !localTitle.trim() || isFetching) return;
    setIsFetching(true);
    try {
      const result = await fetchMetadata(localTitle.trim(), genre);
      if (result) {
        handleUpdate({ memo: result.memo, author: result.author || author });
        if (result.author) setLocalAuthor(result.author);
      }
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  const handleCopy = () => {
    const text = `${title}\n${author ? `by ${author}\n` : ''}\n${memo || ''}`;
    navigator.clipboard.writeText(text);
    alert('作品情報をコピーしました');
  };

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.music;
  const GenreIcon = genreInfo.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-surface/98 border-x border-white/10 sm:rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col h-full sm:h-auto sm:max-h-[94vh] animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/60 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
             <div onClick={() => setEditMode(!isGlobalEditMode)} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isGlobalEditMode ? 'text-accent' : 'text-slate-500'}`}>編集モード</span>
                <div className={`w-10 h-5 rounded-full p-1 flex items-center transition-all ${isGlobalEditMode ? 'bg-accent/30 border border-accent/50' : 'bg-white/10 border border-white/10'}`}>
                   <div className={`w-3 h-3 rounded-full transition-all ${isGlobalEditMode ? 'bg-accent translate-x-5' : 'bg-slate-600'}`} />
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative w-full aspect-video sm:aspect-[24/10] bg-black group z-0">
             {imageBase64 ? <img src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={60} className="opacity-10" /></div>}
             {isGlobalEditMode && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                   <label 
                     htmlFor={`modal-upload-${id}`}
                     className="bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
                   >
                     画像を更新
                   </label>
                   <input 
                     id={`modal-upload-${id}`}
                     type="file" 
                     accept="image/*" 
                     className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto" 
                     onChange={handleImageUpload} 
                   />
                </div>
             )}
             <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface/100 via-surface/40 to-transparent" />
          </div>

          <div className="px-6 pb-12 sm:px-12 -mt-16 relative z-10 space-y-4">
            <div className="mb-2">
               {isGlobalEditMode ? (
                 <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={localTitle} 
                      onChange={e => setLocalTitle(e.target.value)} 
                      onBlur={handleTitleSync}
                      onKeyDown={e => e.key === 'Enter' && handleTitleSync()}
                      className="flex-1 bg-transparent border-b border-white/20 focus:border-accent outline-none text-white text-3xl sm:text-5xl font-black italic tracking-tighter pb-1" 
                      placeholder="作品名..." 
                    />
                    <button onClick={handleAutoFetch} disabled={isFetching} className="p-3 rounded-xl bg-accent text-black hover:scale-105 transition-all shadow-xl shadow-accent/20">
                       {isFetching ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                 </div>
               ) : (
                 <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter italic" style={{ color, textShadow: '0 10px 30px rgba(0,0,0,0.9)' }}>{title || 'Untitled'}</h2>
               )}
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {rankingId ? (
                    <div className="px-4 py-2 bg-accent text-black font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-accent/20 italic flex items-center gap-2">
                      <Crown size={14} /> Rank {currentRank}
                    </div>
                  ) : isSelected && (
                    <div className="px-4 py-2 bg-accent/20 border border-accent/30 text-accent font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm italic flex items-center gap-2">
                      <Crown size={14} /> 選出済み
                    </div>
                  )}
                  
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1 flex items-center gap-0.5">
                     {isGlobalEditMode ? (
                        Object.entries(GENRE_MAP).map(([key, info]) => {
                           const Icon = info.icon;
                           const isSelectedGenre = genre === key;
                           return (
                             <button 
                               key={key} 
                               onClick={(e) => { e.stopPropagation(); handleUpdate({ genre: key }); }} 
                               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isSelectedGenre ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm' : 'text-slate-600 hover:text-slate-400'}`}
                             >
                                <Icon size={14} />
                                {isSelectedGenre && <span className="text-[9px] font-black uppercase tracking-widest">{info.label}</span>}
                             </button>
                           );
                        })
                     ) : (
                        <div className="flex items-center gap-2 px-4 py-1.5 text-accent">
                           <GenreIcon size={16} />
                           <span className="text-[9px] font-black uppercase tracking-widest">{genreInfo.label}</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-6 pl-1">
                  <div className="flex items-center gap-2">
                     <User size={16} className="text-accent/60" />
                     {isGlobalEditMode ? (
                        <input 
                          type="text" 
                          value={localAuthor} 
                          onChange={e => setLocalAuthor(e.target.value)} 
                          onBlur={handleAuthorSync}
                          onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-accent w-[160px]" 
                          placeholder="作者名" 
                        />
                     ) : (
                        <span className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">{author || 'AUTHOR'}</span>
                     )}
                  </div>
                  <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                     <Calendar size={16} className="text-emerald-500/60" />
                     {isGlobalEditMode ? (
                        <input type="date" value={createdAt ? createdAt.split('T')[0] : ''} onChange={e => handleUpdate({ createdAt: new Date(e.target.value).toISOString() })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white outline-none focus:border-accent" />
                     ) : (
                        <span className="text-slate-500 font-bold text-[10px] tracking-widest">{createdAt ? new Date(createdAt).toLocaleDateString('ja-JP') : '---'}</span>
                     )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
               <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex items-center justify-around shadow-lg">
                     <div className="space-y-2 text-center">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Star size={10} className="text-accent" /> SCORE</p>
                        <div className="flex justify-center scale-90 origin-center">
                           <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                        </div>
                     </div>
                     
                     <div className="w-px h-10 bg-white/10" />

                     <div className="space-y-2 text-center">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Eye size={10} className="text-blue-500" /> VIEWS</p>
                        {isGlobalEditMode ? (
                           <div className="flex items-center gap-4 justify-center">
                              <button onClick={() => handleUpdate({ views: Math.max(0, views - 1) })} className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 text-white text-lg font-bold hover:bg-white/10 transition-all">-</button>
                              <span className="text-center font-mono font-black text-2xl tracking-tighter w-12">{views}</span>
                              <button onClick={() => handleUpdate({ views: views + 1 })} className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 text-white text-lg font-bold hover:bg-white/10 transition-all">+</button>
                           </div>
                        ) : (
                           <p className="text-3xl font-black text-white font-mono tracking-tighter text-center">{views.toLocaleString()}</p>
                        )}
                     </div>
                  </div>

                  {isGlobalEditMode && (
                     <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between gap-4">
                           <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2"><Type size={12} /> STYLE</p>
                           <div className="flex items-center gap-4 flex-1">
                              <span className="text-[10px] font-mono font-black text-accent w-6 text-center">{fontSize}</span>
                              <input type="range" min="14" max="80" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-slate-800 accent-accent rounded-full appearance-none cursor-pointer" />
                              <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer" />
                           </div>
                        </div>
                        <button onClick={() => handleUpdate({ isBold: !isBold })} className={`w-full py-3 rounded-xl border font-black text-[10px] tracking-widest transition-all ${isBold ? 'bg-accent text-black border-accent' : 'bg-white/5 text-slate-600 border-white/10'}`}>
                           BOLD FONT: {isBold ? 'ON' : 'OFF'}
                        </button>
                     </div>
                  )}

                  {!isSelected && !rankingId && (
                    <div className="bg-accent/5 border border-accent/10 p-6 rounded-[32px] space-y-4 shadow-xl">
                       {!isAddingToRanking ? (
                         <button onClick={() => setIsAddingToRanking(true)} className="w-full py-4 rounded-[20px] bg-accent text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 text-xl tracking-tight italic">
                            <ListPlus size={24} /> ADD TO RANKING
                         </button>
                       ) : (
                         <div className="space-y-4 animate-in slide-in-from-bottom-4">
                           <div className="grid grid-cols-1 gap-2">
                              <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent appearance-none text-sm">
                                 <option value="">Select Ranking...</option>
                                 {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                              </select>
                              <div className="relative">
                                 <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-accent text-lg" placeholder="Pos" />
                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Rank</span>
                              </div>
                           </div>
                           <div className="flex gap-4 pt-2">
                              <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-2 text-slate-600 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                              <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-3 rounded-xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-30 tracking-tight text-sm shadow-lg">INSERT NOW <ArrowRight size={18} /></button>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                   {liveItem.previousRanks && liveItem.previousRanks.length > 0 && (
                     <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 space-y-3 shadow-lg">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2"><History size={12} /> RANK HISTORY</p>
                        <div className="flex flex-wrap gap-2">
                           {liveItem.previousRanks.map((h, i) => (
                             <div key={i} className="flex flex-col items-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black text-accent italic">Rank {h.rank}</span>
                                <span className="text-[8px] text-slate-500 font-bold">{new Date(h.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
               </div>

               <div className="lg:col-span-7 space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between px-1">
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2"><AlignLeft size={12} /> NARRATIVE</p>
                      <button onClick={handleCopy} className="text-[9px] text-accent/60 hover:text-accent font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                         <Copy size={10} /> COPY TEXT
                      </button>
                   </div>
                  {isGlobalEditMode ? (
                     <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} className="flex-1 w-full bg-white/5 p-6 rounded-[32px] border border-white/5 text-slate-300 text-lg min-h-[200px] resize-none focus:outline-none focus:border-accent transition-all italic leading-relaxed shadow-inner custom-scrollbar" placeholder="..." />
                  ) : (
                     <div className="flex-1 bg-white/5 p-6 rounded-[32px] border border-white/5 text-slate-400 text-base leading-relaxed italic shadow-inner min-h-[150px] whitespace-pre-wrap custom-scrollbar">
                        {memo || <span className="opacity-10 text-3xl not-italic font-black">NO NARRATIVE.</span>}
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
