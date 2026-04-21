import { useState, useEffect } from 'react';
import { X, Calendar, User, Eye, Clock, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, MoreHorizontal, Type, Sparkles, Loader } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRE_MAP = {
  anime: { label: 'アニメ', icon: Tv, emoji: '📺' },
  manga: { label: '漫画', icon: BookOpen, emoji: '📖' },
  movie: { label: '映画', icon: Film, emoji: '🎬' },
  drama: { label: 'ドラマ', icon: Clapperboard, emoji: '🎭' },
  other: { label: 'その他', icon: MoreHorizontal, emoji: '✨' },
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
  const GenreIcon = genreInfo.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface/80 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div onClick={() => setEditMode(!isGlobalEditMode)} className="flex items-center gap-2 cursor-pointer group">
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isGlobalEditMode ? 'text-accent' : 'text-slate-500'}`}>編集モード</span>
              <div className={`w-9 h-5 rounded-full p-1 transition-all duration-300 flex items-center ${isGlobalEditMode ? 'bg-accent/30 border border-accent/50 shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'bg-white/10 border border-white/10'}`}>
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isGlobalEditMode ? 'bg-accent translate-x-4' : 'bg-slate-600'}`} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isGlobalEditMode ? (
            /* EDIT MODE LAYOUT (Matches RankingItem Editor) */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-5/12 space-y-4">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-black/40 relative group">
                    {imageBase64 ? <img src={imageBase64} alt={title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-800"><Film className="w-12 h-12 opacity-20" /></div>}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-white border border-white/20 uppercase tracking-widest">Change Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleUpdate({ imageBase64: reader.result });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(GENRE_MAP).map(([key, info]) => {
                      const Icon = info.icon;
                      const isSelectedGenre = genre === key;
                      return (
                        <button key={key} onClick={() => handleUpdate({ genre: key })} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isSelectedGenre ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{info.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="text" value={title || ''} onChange={e => handleUpdate({ title: e.target.value })} placeholder="Title" className={`w-full bg-transparent border-b border-white/10 focus:border-accent outline-none text-white text-2xl pb-1 ${isBold ? 'font-black' : 'font-bold'}`} style={{ color }} />
                    <button onClick={handleAutoFetch} disabled={isFetching} className="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 transition-all">
                      {isFetching ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleUpdate({ isBold: !isBold })} className={`p-2.5 rounded-xl border transition-all ${isBold ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-white/5 border-white/10 text-slate-500'}`}><Type className="w-4 h-4" /></button>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <User className="w-4 h-4 text-accent" />
                    <input type="text" value={author || ''} onChange={e => handleUpdate({ author: e.target.value })} placeholder="Author" className="flex-1 bg-transparent border-none outline-none text-white text-sm font-bold placeholder:text-slate-700" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                      <Star className="w-4 h-4 text-accent" />
                      <div className="flex-1 scale-90 -translate-x-2"><ScoreRating rating={rating} onRatingChange={v => handleUpdate({ rating: v })} /></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <input type="number" value={views} onChange={e => handleUpdate({ views: parseInt(e.target.value) || 0 })} className="bg-transparent border-none outline-none text-white text-sm font-mono w-full" />
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 font-black uppercase">Color</span>
                      <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 font-black uppercase">Size</span>
                      <input type="range" min="14" max="40" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-800 accent-accent" />
                    </div>
                  </div>

                  <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} placeholder="Write your thoughts..." className="w-full bg-white/5 p-4 rounded-2xl border border-white/5 text-slate-300 text-sm h-32 resize-none focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
            </div>
          ) : (
            /* READ MODE LAYOUT */
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-5/12 flex-shrink-0">
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl relative">
                    {imageBase64 ? <img src={imageBase64} alt={title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-900"><Film className="w-16 h-16 opacity-10" /></div>}
                    {isSelected && <div className="absolute top-4 left-4 px-4 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-full text-[10px] font-black text-white tracking-[0.2em] shadow-xl border border-emerald-400/30 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> SELECTED</div>}
                    <div className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-xl">{genreInfo.emoji}</div>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="space-y-3">
                    {rankingId && <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/30 rounded-xl text-accent font-black text-[11px] uppercase tracking-widest"><Crown className="w-3.5 h-3.5" /> Ranking #{currentRank}</div>}
                    <h2 className={`text-4xl font-black text-white leading-[1.1] tracking-tighter ${isBold ? 'font-black' : 'font-bold'}`} style={{ color }}>{title || 'Untitled'}</h2>
                    {author && <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]"><User className="w-4 h-4 text-accent" /> {author}</div>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5"><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">SCORE</p><ScoreRating rating={rating} readOnly /></div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5"><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">VIEWS</p><p className="text-xl font-black text-white font-mono">{views.toLocaleString()}</p></div>
                  </div>
                  {memo && <div className="space-y-2"><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">MEMO</p><div className="bg-white/5 p-5 rounded-3xl border border-white/5 text-slate-300 text-sm leading-relaxed italic">{memo}</div></div>}
                </div>
              </div>

              {!isSelected && !rankingId && (
                <div className="pt-8 border-t border-white/5">
                  {!isAddingToRanking ? (
                    <button onClick={() => setIsAddingToRanking(true)} className="w-full py-5 rounded-[24px] bg-accent text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-accent/20 text-lg tracking-tighter">
                      <ListPlus className="w-6 h-6" /> ランキングに入れる
                    </button>
                  ) : (
                    <div className="bg-white/5 p-6 rounded-[32px] border border-accent/30 space-y-4 animate-in slide-in-from-bottom-4">
                      <p className="text-sm font-black text-white text-center uppercase tracking-widest">Select Ranking & Position</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-accent appearance-none">
                          <option value="">ランキングを選択...</option>
                          {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                        <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-accent" placeholder="順位 (1-100)" />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-500 font-black hover:bg-white/5 transition-colors uppercase tracking-widest text-xs">Cancel</button>
                        <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-4 rounded-2xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-30">CONFIRM & INSERT <ArrowRight className="w-5 h-5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
