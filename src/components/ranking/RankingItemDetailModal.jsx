import { useState, useEffect } from 'react';
import { X, Calendar, User, Eye, Clock, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, MoreHorizontal } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';

const GENRE_MAP = {
  anime: { label: 'アニメ', emoji: '📺' },
  manga: { label: '漫画', emoji: '📖' },
  movie: { label: '映画', emoji: '🎬' },
  drama: { label: 'ドラマ', emoji: '🎭' },
  other: { label: 'その他', emoji: '✨' },
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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = 'auto'; setIsAddingToRanking(false); }
  }, [isOpen]);

  if (!isOpen) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre = 'other', isBold = false, color = '#ffffff' } = item;

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

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.other;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-surface/90 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header with Switch */}
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

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left: Image (Preferred layout) */}
            <div className="w-full md:w-5/12 flex-shrink-0">
              <div className="aspect-[3/4] rounded-[32px] overflow-hidden border border-white/10 bg-black/60 shadow-2xl relative group">
                {imageBase64 ? (
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-900">
                    <Edit3 className="w-16 h-16 opacity-10" />
                  </div>
                )}
                
                {/* Image Edit Overlay */}
                {isGlobalEditMode && (
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                    <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-black text-white border border-white/20 uppercase tracking-[0.2em] shadow-xl">Change Image</div>
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

                {isSelected && !isGlobalEditMode && (
                  <div className="absolute top-5 left-5 px-4 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-full text-[10px] font-black text-white tracking-[0.2em] shadow-xl border border-emerald-400/30 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 選出済み
                  </div>
                )}
                <div className="absolute top-5 right-5 w-10 h-10 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 text-xl shadow-xl">{genreInfo.emoji}</div>
              </div>
            </div>

            {/* Right: Info (Preferred layout) */}
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                {rankingId && <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/30 rounded-xl text-accent font-black text-[11px] uppercase tracking-[0.3em]"><Crown className="w-3.5 h-3.5" /> Rank {currentRank}</div>}
                
                {isGlobalEditMode ? (
                  <input 
                    type="text" 
                    value={title || ''} 
                    onChange={e => handleUpdate({ title: e.target.value })} 
                    className="w-full bg-transparent border-b border-white/10 focus:border-accent outline-none text-white text-4xl font-black italic tracking-tighter pb-1"
                    placeholder="Enter title..."
                  />
                ) : (
                  <h2 className={`text-5xl font-black text-white leading-[1] tracking-tighter italic ${isBold ? 'font-black' : ''}`} style={{ color }}>{title || 'Untitled'}</h2>
                )}

                {isGlobalEditMode ? (
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <User className="w-4 h-4 text-accent" />
                    <input type="text" value={author || ''} onChange={e => handleUpdate({ author: e.target.value })} placeholder="Author..." className="flex-1 bg-transparent border-none outline-none text-white text-sm font-bold placeholder:text-slate-700" />
                  </div>
                ) : (
                  author && <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]"><User className="w-4 h-4 text-accent" /> {author}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-[32px] border border-white/5 shadow-inner">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Star className="w-3 h-3" /> SCORE</p>
                  <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                </div>
                <div className="bg-white/5 p-5 rounded-[32px] border border-white/5 shadow-inner">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Eye className="w-3 h-3 text-blue-500" /> VIEWS</p>
                  {isGlobalEditMode ? (
                    <input type="number" value={views} onChange={e => handleUpdate({ views: parseInt(e.target.value) || 0 })} className="bg-transparent border-none outline-none text-white text-2xl font-black font-mono w-full" />
                  ) : (
                    <p className="text-2xl font-black text-white font-mono">{views.toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-2 flex items-center gap-2"><AlignLeft className="w-3 h-3" /> MEMO</p>
                {isGlobalEditMode ? (
                  <textarea 
                    value={memo || ''} 
                    onChange={e => handleUpdate({ memo: e.target.value })} 
                    className="w-full bg-white/5 p-6 rounded-[32px] border border-white/5 text-slate-300 text-sm h-40 resize-none focus:outline-none focus:border-accent transition-all italic leading-relaxed"
                    placeholder="Write your thoughts here..."
                  />
                ) : (
                  <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 text-slate-300 text-sm leading-relaxed italic shadow-inner">
                    {memo || <span className="opacity-20">No memo recorded.</span>}
                  </div>
                )}
              </div>

              {/* Extra Edit Controls */}
              {isGlobalEditMode && (
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                      <span className="text-[10px] text-slate-600 font-black uppercase">Color</span>
                      <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                   </div>
                   <button onClick={() => handleUpdate({ isBold: !isBold })} className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${isBold ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                      <span className="text-[10px] font-black uppercase">Bold Text</span>
                   </button>
                </div>
              )}

              {/* Add to Ranking Button (Always visible on Records/Unselected items) */}
              {!isSelected && !rankingId && !isGlobalEditMode && (
                <div className="pt-6 border-t border-white/5">
                  {!isAddingToRanking ? (
                    <button onClick={() => setIsAddingToRanking(true)} className="w-full py-5 rounded-[28px] bg-accent text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-accent/30 text-xl tracking-tighter uppercase">
                      <ListPlus className="w-6 h-6" strokeWidth={3} /> ランキングに入れる
                    </button>
                  ) : (
                    <div className="bg-white/5 p-6 rounded-[40px] border border-accent/30 space-y-4 animate-in slide-in-from-bottom-4 shadow-2xl">
                      <p className="text-xs font-black text-white text-center uppercase tracking-[0.2em] mb-2 opacity-60 italic">Confirm Selection</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-accent appearance-none text-sm">
                          <option value="">追加先を選択...</option>
                          {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                        <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-accent text-center" placeholder="順位" />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-500 font-black hover:bg-white/10 transition-colors uppercase tracking-widest text-[9px]">Cancel</button>
                        <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-4 rounded-2xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-30 tracking-tight">CONFIRM INSERT <ArrowRight className="w-5 h-5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
