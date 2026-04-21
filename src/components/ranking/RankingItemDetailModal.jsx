import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Eye, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, MoreHorizontal, Type, Sparkles, Loader, Trash2 } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRE_MAP = {
  anime: { label: 'アニメ', icon: Tv },
  manga: { label: '漫画', icon: BookOpen },
  movie: { label: '映画', icon: Film },
  drama: { label: 'ドラマ', icon: Clapperboard },
  other: { label: '他', icon: MoreHorizontal },
};

export default function RankingItemDetailModal({ item, isOpen, onClose }) {
  const isGlobalEditMode = useStore(state => state.isEditMode);
  const setEditMode = useStore(state => state.setEditMode);
  const rankings = useStore(state => state.rankings);
  const insertItemIntoRanking = useStore(state => state.insertItemIntoRanking);
  const updateItem = useStore(state => state.updateItem);

  const [isAddingToRanking, setIsAddingToRanking] = useState(false);
  const [selectedRankingId, setSelectedRankingId] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  // Local state for title to fix IME duplication bug
  const [localTitle, setLocalTitle] = useState(item?.title || '');
  const [localAuthor, setLocalAuthor] = useState(item?.author || '');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLocalTitle(item?.title || '');
      setLocalAuthor(item?.author || '');
    } else {
      document.body.style.overflow = 'auto';
      setIsAddingToRanking(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre = 'other', isBold = false, color = '#ffffff', fontSize = 20 } = item;

  const handleUpdate = (updates) => {
    updateItem(id, updates);
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
      insertItemIntoRanking(selectedRankingId, item, parseInt(selectedRank));
      setIsAddingToRanking(false);
      onClose();
    }
  };

  const handleAutoFetch = async () => {
    if (!localTitle || !localTitle.trim() || isFetching) return;
    setIsFetching(true);
    try {
      const result = await fetchMetadata(localTitle.trim(), genre);
      if (result) {
        updateItem(id, { memo: result.memo, author: result.author || author });
        if (result.author) setLocalAuthor(result.author);
      }
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.other;
  const GenreIcon = genreInfo.icon;

  // Portal to body to ensure it's above everything including fixed navigation bars
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-surface/98 border-x border-white/10 sm:rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col h-full sm:h-auto sm:max-h-[94vh] animate-in zoom-in-95 duration-300">
        
        {/* Top Control Bar */}
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
          {/* Hero Image Section */}
          <div className="relative w-full aspect-video sm:aspect-[21/9] bg-black group z-0">
             {imageBase64 ? <img src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={60} className="opacity-10" /></div>}
             {isGlobalEditMode && (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 backdrop-blur-sm">
                   <div className="bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl">画像を更新</div>
                   <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => handleUpdate({ imageBase64: reader.result });
                        reader.readAsDataURL(file);
                      }
                   }} />
                </label>
             )}
             {/* Gradient for title contrast - deeper and taller */}
             <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-surface/100 via-surface/80 to-transparent" />
          </div>

          {/* Content Area - Adjusted overlap for title */}
          <div className="px-6 pb-12 sm:px-12 -mt-20 relative z-10 space-y-12">
            {/* 1. Title (Perfectly overlapping image bottom) */}
            <div className="space-y-4">
               {isGlobalEditMode ? (
                 <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={localTitle} 
                      onChange={e => setLocalTitle(e.target.value)} 
                      onBlur={handleTitleSync}
                      onKeyDown={e => e.key === 'Enter' && handleTitleSync()}
                      className="flex-1 bg-transparent border-b border-white/20 focus:border-accent outline-none text-white text-4xl sm:text-6xl font-black italic tracking-tighter pb-2" 
                      placeholder="作品名..." 
                    />
                    <button onClick={handleAutoFetch} disabled={isFetching} className="p-4 rounded-2xl bg-accent text-black hover:scale-105 transition-all shadow-xl shadow-accent/20">
                       {isFetching ? <Loader size={24} className="animate-spin" /> : <Sparkles size={24} />}
                    </button>
                 </div>
               ) : (
                 <h2 className="text-5xl sm:text-7xl font-black text-white leading-[1.05] tracking-tighter italic" style={{ color, textShadow: '0 15px 45px rgba(0,0,0,0.9)' }}>{title || 'Untitled'}</h2>
               )}
            </div>

            {/* 2. Meta Info (Pushed down for clarity) */}
            <div className="space-y-8 pt-4">
               {/* Rank & Genre Row */}
               <div className="flex flex-wrap items-center gap-4">
                  {rankingId && <div className="px-6 py-3 bg-accent text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-accent/30 italic flex items-center gap-3"><Crown size={18} />Rank {currentRank}</div>}
                  
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 flex items-center gap-0.5">
                     {isGlobalEditMode ? (
                        Object.entries(GENRE_MAP).map(([key, info]) => {
                           const Icon = info.icon;
                           const isSelectedGenre = genre === key;
                           return (
                             <button 
                               key={key} 
                               onClick={(e) => { e.stopPropagation(); handleUpdate({ genre: key }); }} 
                               className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${isSelectedGenre ? 'bg-accent/20 text-accent border border-accent/40 shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                             >
                                <Icon size={18} />
                                {isSelectedGenre && <span className="text-[11px] font-black uppercase tracking-[0.1em]">{info.label}</span>}
                             </button>
                           );
                        })
                     ) : (
                        <div className="flex items-center gap-3 px-6 py-2.5 text-accent">
                           <GenreIcon size={20} />
                           <span className="text-[11px] font-black uppercase tracking-[0.2em]">{genreInfo.label}</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Author & Date Row */}
               <div className="flex flex-wrap items-center gap-12 pl-2">
                  <div className="flex items-center gap-4">
                     <User size={22} className="text-accent" />
                     {isGlobalEditMode ? (
                        <input 
                          type="text" 
                          value={localAuthor} 
                          onChange={e => setLocalAuthor(e.target.value)} 
                          onBlur={handleAuthorSync}
                          onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-accent w-[200px]" 
                          placeholder="作者名" 
                        />
                     ) : (
                        <span className="text-slate-400 font-black uppercase tracking-[0.4em] text-[13px]">{author || 'UNKNOWN AUTHOR'}</span>
                     )}
                  </div>
                  <div className="flex items-center gap-4">
                     <Calendar size={22} className="text-emerald-500" />
                     {isGlobalEditMode ? (
                        <input type="date" value={createdAt ? createdAt.split('T')[0] : ''} onChange={e => handleUpdate({ createdAt: new Date(e.target.value).toISOString() })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-accent" />
                     ) : (
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">{createdAt ? new Date(createdAt).toLocaleDateString('ja-JP') : '---'}</span>
                     )}
                  </div>
               </div>
            </div>

            {/* 3. Metrics & Content (Bottom Section) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-8">
               {/* Left Specs */}
               <div className="lg:col-span-5 space-y-10">
                  <div className="bg-white/5 p-12 rounded-[56px] border border-white/5 space-y-10 shadow-2xl">
                     <div className="space-y-6">
                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3"><Star size={14} className="text-accent" /> SCORE RATING</p>
                        <div className="flex justify-center py-2">
                           <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                        </div>
                     </div>
                     
                     <div className="h-px bg-white/5 w-1/3 mx-auto" />

                     <div className="space-y-6">
                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3"><Eye size={14} className="text-blue-500" /> INTERACTION VIEWS</p>
                        {isGlobalEditMode ? (
                           <div className="flex items-center gap-8 justify-center">
                              <button onClick={() => handleUpdate({ views: Math.max(0, views - 1) })} className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 text-white text-2xl font-bold hover:bg-white/10 transition-all">-</button>
                              <span className="text-center font-mono font-black text-5xl tracking-tighter w-24">{views}</span>
                              <button onClick={() => handleUpdate({ views: views + 1 })} className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 text-white text-2xl font-bold hover:bg-white/10 transition-all">+</button>
                           </div>
                        ) : (
                           <p className="text-7xl font-black text-white font-mono tracking-tighter text-center">{views.toLocaleString()}</p>
                        )}
                     </div>
                  </div>

                  {isGlobalEditMode && (
                     <div className="bg-white/5 p-12 rounded-[56px] border border-white/5 space-y-12 shadow-2xl">
                        <div className="space-y-6">
                           <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center gap-3"><Type size={16} /> TEXT STYLING</p>
                           <div className="flex items-center gap-8">
                              <input type="range" min="14" max="80" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="flex-1 h-2 bg-slate-800 accent-accent rounded-full appearance-none cursor-pointer" />
                              <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-14 h-14 rounded-2xl bg-transparent border-none cursor-pointer shadow-2xl hover:scale-110 transition-transform" />
                           </div>
                        </div>
                        <button onClick={() => handleUpdate({ isBold: !isBold })} className={`w-full py-7 rounded-[32px] border font-black text-[12px] tracking-[0.4em] transition-all ${isBold ? 'bg-accent text-black border-accent shadow-2xl shadow-accent/30' : 'bg-white/5 text-slate-600 border-white/10'}`}>
                           BOLD FONT: {isBold ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                     </div>
                  )}

                  {!isSelected && !rankingId && !isGlobalEditMode && (
                    <div className="bg-accent/10 border border-accent/20 p-12 rounded-[64px] space-y-10 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
                       {!isAddingToRanking ? (
                         <button onClick={() => setIsAddingToRanking(true)} className="w-full py-8 rounded-[40px] bg-accent text-black font-black flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-accent/40 text-3xl tracking-tighter italic">
                            <ListPlus size={36} /> ADD TO RANKING
                         </button>
                       ) : (
                         <div className="space-y-6 animate-in slide-in-from-bottom-8">
                           <div className="grid grid-cols-1 gap-4">
                              <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-[28px] px-8 py-6 text-white font-bold outline-none focus:border-accent appearance-none text-xl shadow-inner">
                                 <option value="">追加先のランキングを選択...</option>
                                 {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                              </select>
                              <div className="relative">
                                 <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-[28px] px-8 py-6 text-white font-black outline-none focus:border-accent text-3xl shadow-inner" placeholder="Position" />
                                 <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-500 uppercase tracking-widest">Rank Pos</span>
                              </div>
                           </div>
                           <div className="flex gap-6 pt-4">
                              <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-6 text-slate-500 font-black uppercase text-sm tracking-[0.3em] hover:text-white transition-colors">Cancel</button>
                              <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-6 rounded-[32px] bg-accent text-black font-black flex items-center justify-center gap-4 disabled:opacity-30 tracking-tight text-2xl shadow-2xl">INSERT NOW <ArrowRight size={28} /></button>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
               </div>

               {/* Right Narrative Section */}
               <div className="lg:col-span-7 space-y-6 flex flex-col h-full">
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center gap-3 px-2"><AlignLeft size={16} /> NARRATIVE & THOUGHTS</p>
                  {isGlobalEditMode ? (
                     <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} className="flex-1 w-full bg-white/5 p-16 rounded-[64px] border border-white/5 text-slate-300 text-2xl min-h-[600px] resize-none focus:outline-none focus:border-accent transition-all italic leading-relaxed shadow-inner custom-scrollbar" placeholder="作品への熱い想いや記録を残しましょう..." />
                  ) : (
                     <div className="flex-1 bg-white/5 p-16 rounded-[64px] border border-white/5 text-slate-300 text-2xl leading-relaxed italic shadow-inner min-h-[500px] whitespace-pre-wrap custom-scrollbar">
                        {memo || <span className="opacity-10 text-7xl not-italic font-black">NO NARRATIVE RECORDED.</span>}
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
