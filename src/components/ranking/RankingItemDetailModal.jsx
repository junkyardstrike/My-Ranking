import { useState, useEffect } from 'react';
import { X, Calendar, User, Eye, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, MoreHorizontal, Type, Sparkles, Loader, Trash2 } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRE_MAP = {
  anime: { label: 'アニメ', icon: Tv, emoji: '📺' },
  manga: { label: '漫画', icon: BookOpen, emoji: '📖' },
  movie: { label: '映画', icon: Film, emoji: '🎬' },
  drama: { label: 'ドラマ', icon: Clapperboard, emoji: '🎭' },
  other: { label: '他', icon: MoreHorizontal, emoji: '✨' },
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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = 'auto'; setIsAddingToRanking(false); }
  }, [isOpen]);

  if (!isOpen) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre = 'other', isBold = false, color = '#ffffff', fontSize = 20 } = item;

  const handleUpdate = (updates) => {
    updateItem(id, updates);
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
    if (!title || !title.trim() || isFetching) return;
    setIsFetching(true);
    try {
      const result = await fetchMetadata(title.trim(), genre);
      if (result) {
        handleUpdate({ memo: result.memo, author: result.author || author });
      }
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.other;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-surface/90 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
        
        {/* Top Floating Controls */}
        <div className="absolute top-6 right-8 z-10 flex items-center gap-4">
          <div onClick={() => setEditMode(!isGlobalEditMode)} className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 cursor-pointer shadow-xl group">
             <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isGlobalEditMode ? 'text-accent' : 'text-slate-500'}`}>編集モード</span>
             <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex items-center ${isGlobalEditMode ? 'bg-accent/40 border border-accent/50' : 'bg-white/10 border border-white/10'}`}>
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isGlobalEditMode ? 'bg-accent translate-x-5' : 'bg-slate-600'}`} />
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="flex flex-col gap-10">
            {/* Header Area */}
            <div className="space-y-4 max-w-3xl">
               <div className="flex flex-wrap items-center gap-3">
                  {rankingId && <div className="px-4 py-1.5 bg-accent text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 italic"><Crown size={14} className="inline mr-2" />Rank {currentRank}</div>}
                  <div className="px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                     {Object.entries(GENRE_MAP).map(([key, info]) => {
                        const Icon = info.icon;
                        const isSelectedGenre = genre === key;
                        return (
                          <button key={key} onClick={() => isGlobalEditMode && handleUpdate({ genre: key })} className={`p-1 rounded-lg transition-all ${isSelectedGenre ? 'text-accent scale-110' : isGlobalEditMode ? 'text-slate-600 hover:text-slate-400' : 'hidden'}`}>
                             {isSelectedGenre ? <span>{info.emoji}</span> : <Icon size={16} />}
                          </button>
                        );
                     })}
                     {!isGlobalEditMode && <span className="text-sm">{genreInfo.emoji} <span className="text-[10px] font-black uppercase text-slate-500 ml-1">{genreInfo.label}</span></span>}
                  </div>
               </div>

               {isGlobalEditMode ? (
                 <div className="flex items-center gap-3">
                    <input type="text" value={title || ''} onChange={e => handleUpdate({ title: e.target.value })} className="flex-1 bg-transparent border-b border-white/10 focus:border-accent outline-none text-white text-5xl font-black italic tracking-tighter pb-1" placeholder="Title..." />
                    <button onClick={handleAutoFetch} disabled={isFetching} className="p-3.5 rounded-2xl bg-accent text-black hover:scale-105 transition-all shadow-xl shadow-accent/20">
                       {isFetching ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                 </div>
               ) : (
                 <h2 className="text-6xl font-black text-white leading-tight tracking-tighter italic" style={{ color, textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>{title || 'Untitled'}</h2>
               )}

               <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                     <User size={16} className="text-accent" />
                     {isGlobalEditMode ? (
                        <input type="text" value={author || ''} onChange={e => handleUpdate({ author: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm font-bold text-white outline-none" placeholder="Author" />
                     ) : (
                        <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">{author || 'UNKNOWN AUTHOR'}</span>
                     )}
                  </div>
                  <div className="flex items-center gap-2">
                     <Calendar size={16} className="text-emerald-500" />
                     {isGlobalEditMode ? (
                        <input type="date" value={createdAt ? createdAt.split('T')[0] : ''} onChange={e => handleUpdate({ createdAt: new Date(e.target.value).toISOString() })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold text-white outline-none" />
                     ) : (
                        <span className="text-slate-500 font-bold text-xs">{createdAt ? new Date(createdAt).toLocaleDateString('ja-JP') : '---'}</span>
                     )}
                  </div>
               </div>
            </div>

            {/* Visual Media Section (Landscape) */}
            <div className="relative w-full aspect-video rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl group">
               {imageBase64 ? <img src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={60} className="opacity-10" /></div>}
               {isGlobalEditMode && (
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 backdrop-blur-sm">
                     <div className="bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">Update Poster</div>
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
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Left Col: Specs */}
               <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2"><Star size={12} className="text-accent" /> Scoring</p>
                        <div className="flex justify-center scale-110 origin-center">
                           <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                        </div>
                     </div>
                     <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-2">
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2"><Eye size={12} className="text-blue-500" /> Interaction</p>
                        {isGlobalEditMode ? (
                           <div className="flex items-center gap-3 pt-2">
                              <button onClick={() => handleUpdate({ views: Math.max(0, views - 1) })} className="w-8 h-8 bg-white/5 rounded-xl border border-white/10 text-white">-</button>
                              <span className="flex-1 text-center font-mono font-black text-2xl">{views}</span>
                              <button onClick={() => handleUpdate({ views: views + 1 })} className="w-8 h-8 bg-white/5 rounded-xl border border-white/10 text-white">+</button>
                           </div>
                        ) : (
                           <p className="text-3xl font-black text-white font-mono pt-1">{views.toLocaleString()}</p>
                        )}
                     </div>
                  </div>

                  {isGlobalEditMode && (
                     <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6">
                        <div className="space-y-3">
                           <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Typography & Color</p>
                           <div className="flex items-center gap-6">
                              <div className="flex-1 flex items-center gap-4">
                                 <Type size={16} className="text-slate-500" />
                                 <input type="range" min="14" max="80" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-800 accent-accent" />
                              </div>
                              <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer" />
                           </div>
                        </div>
                        <button onClick={() => handleUpdate({ isBold: !isBold })} className={`w-full py-4 rounded-2xl border font-black text-xs tracking-[0.3em] transition-all ${isBold ? 'bg-accent text-black border-accent shadow-lg' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                           BOLD FONT: {isBold ? 'ON' : 'OFF'}
                        </button>
                     </div>
                  )}

                  {!isSelected && !rankingId && !isGlobalEditMode && (
                    <div className="bg-accent/10 border border-accent/20 p-8 rounded-[40px] space-y-6 shadow-2xl">
                       {!isAddingToRanking ? (
                         <button onClick={() => setIsAddingToRanking(true)} className="w-full py-5 rounded-[24px] bg-accent text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/30 text-xl tracking-tighter">
                            <ListPlus size={24} /> ADD TO RANKING
                         </button>
                       ) : (
                         <div className="space-y-4 animate-in slide-in-from-bottom-4">
                           <p className="text-xs font-black text-accent text-center uppercase tracking-[0.2em] italic">Insert into collection</p>
                           <div className="grid grid-cols-1 gap-3">
                              <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-accent appearance-none text-sm">
                                 <option value="">追加先を選択...</option>
                                 {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                              </select>
                              <div className="relative">
                                 <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-accent" placeholder="Position" />
                                 <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase">Rank</span>
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                              <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-4 rounded-2xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-30">INSERT NOW <ArrowRight size={18} /></button>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
               </div>

               {/* Right Col: Memo */}
               <div className="space-y-3">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2 px-2"><AlignLeft size={12} /> Narrative & Notes</p>
                  {isGlobalEditMode ? (
                     <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} className="w-full bg-white/5 p-8 rounded-[40px] border border-white/5 text-slate-300 text-lg h-full min-h-[300px] resize-none focus:outline-none focus:border-accent transition-all italic leading-relaxed shadow-inner" placeholder="Enter memo here..." />
                  ) : (
                     <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 text-slate-300 text-lg leading-relaxed italic shadow-inner min-h-[200px] whitespace-pre-wrap">
                        {memo || <span className="opacity-10 text-4xl not-italic">NO DATA RECORDED.</span>}
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
