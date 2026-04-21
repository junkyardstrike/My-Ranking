import { useState, useEffect } from 'react';
import { X, Calendar, User, Eye, Clock, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';

export default function RankingItemDetailModal({ item, isOpen, onClose }) {
  const isGlobalEditMode = useStore(state => state.isEditMode);
  const setEditMode = useStore(state => state.setEditMode);
  const rankings = useStore(state => state.rankings);
  const insertItemIntoRanking = useStore(state => state.insertItemIntoRanking);
  const updateRankingItem = useStore(state => state.updateRankingItem);

  const [isAddingToRanking, setIsAddingToRanking] = useState(false);
  const [selectedRankingId, setSelectedRankingId] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setIsAddingToRanking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId } = item;

  const handleAddToRanking = () => {
    if (!selectedRankingId) return;
    const confirmMsg = `${selectedRank}位に挿入します。既存の作品は押し出されますがよろしいですか？`;
    if (window.confirm(confirmMsg)) {
      insertItemIntoRanking(selectedRankingId, item, parseInt(selectedRank));
      setIsAddingToRanking(false);
      onClose();
    }
  };

  const handleLocalUpdate = (updates) => {
    if (rankingId) {
      updateRankingItem(rankingId, id, updates);
    } else {
      // For unranked items, we might need a separate action, 
      // but let's assume for now updates are handled via RankingItem parent if in a list.
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header with toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setEditMode(!isGlobalEditMode)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isGlobalEditMode ? 'text-accent' : 'text-slate-500'}`}>
                編集モード
              </span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 flex items-center ${isGlobalEditMode ? 'bg-accent/30 border border-accent/50' : 'bg-white/10 border border-white/10'}`}>
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isGlobalEditMode ? 'bg-accent translate-x-4' : 'bg-slate-600'}`} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image */}
            <div className="w-full md:w-1/2 flex-shrink-0">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner relative group">
                {imageBase64 ? (
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Edit3 className="w-12 h-12 opacity-20" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500/80 backdrop-blur-md rounded-full text-[10px] font-black text-white tracking-[0.2em] shadow-lg flex items-center gap-1.5 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3" /> 選出済み
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                {rankingId && currentRank && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/30 rounded-lg text-accent font-black font-mono text-sm">
                    <Crown className="w-4 h-4" /> RANK {currentRank}
                  </div>
                )}
                <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{title || 'Untitled'}</h2>
                {author && (
                  <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <User className="w-3.5 h-3.5 text-accent" /> {author}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1.5"><Star className="w-3 h-3" /> Score</p>
                  <ScoreRating rating={rating} readOnly />
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Views</p>
                  <p className="text-lg font-black text-white font-mono">{views.toLocaleString()}</p>
                </div>
              </div>

              {memo && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-1.5"><AlignLeft className="w-3 h-3" /> Memo</p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-2xl border border-white/5">{memo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add to Ranking UI */}
          {!isSelected && !rankingId && (
            <div className="border-t border-white/5 pt-8">
              {!isAddingToRanking ? (
                <button 
                  onClick={() => setIsAddingToRanking(true)}
                  className="w-full py-4 rounded-2xl bg-accent text-white font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-accent/20"
                >
                  <ListPlus className="w-5 h-5" /> ランキングに入れる
                </button>
              ) : (
                <div className="bg-white/5 p-6 rounded-3xl border border-accent/30 space-y-4 animate-in slide-in-from-bottom-4">
                  <p className="text-sm font-bold text-white text-center mb-2">追加先のランキングを選択</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select 
                      value={selectedRankingId}
                      onChange={(e) => setSelectedRankingId(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent outline-none appearance-none"
                    >
                      <option value="">ランキングを選択...</option>
                      {rankings.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1" max="100"
                        value={selectedRank}
                        onChange={(e) => setSelectedRank(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent outline-none"
                        placeholder="順位 (1-100)"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 tracking-tighter">RANK</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-colors">キャンセル</button>
                    <button 
                      onClick={handleAddToRanking}
                      disabled={!selectedRankingId}
                      className="flex-[2] py-3 rounded-xl bg-accent text-white font-black flex items-center justify-center gap-2 disabled:opacity-30"
                    >
                      決定して挿入 <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
