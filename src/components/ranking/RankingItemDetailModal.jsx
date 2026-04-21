import { useEffect } from 'react';
import { X, Calendar, User, Eye, Clock, Crown, AlignLeft, Edit3, Star } from 'lucide-react';
import ScoreRating from './ScoreRating';

export default function RankingItemDetailModal({ item, isOpen, onClose, onEdit }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const { currentRank, previousRanks, title, color, fontSize, imageBase64, memo, createdAt, author, views, rating } = item;
  
  const historyText = previousRanks && previousRanks.length > 0 
    ? [currentRank, ...previousRanks].slice(0, 5).map(r => `${r}位`).join(' ← ')
    : null;
    
  const dateObj = createdAt ? new Date(createdAt) : null;
  const formattedDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '未設定';

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="bg-surface/95 backdrop-blur-xl border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10 shadow-inner text-xl font-black text-white">
                {currentRank}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-wide" style={{ color: color || '#ffffff' }}>
                {title || '未設定'}
              </h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white bg-white/5 text-sm font-medium border border-white/10"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">編集</span>
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white bg-white/5 border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 p-4 sm:p-6 space-y-6 custom-scrollbar">
            
            {/* Image Section */}
            {imageBase64 && (
              <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black/40">
                <img src={imageBase64} alt={title} className="w-full h-auto max-h-[40vh] object-contain" />
              </div>
            )}

            {/* Meta Data Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">制作者 / 著者</p>
                  <p className="text-slate-200 font-semibold">{author || '不明'}</p>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">作成日 / 公開日</p>
                  <p className="text-slate-200 font-semibold">{formattedDate}</p>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">閲覧回数</p>
                  <p className="text-slate-200 font-semibold font-mono text-lg">{views || 0} <span className="text-sm font-normal">回</span></p>
                </div>
              </div>

              {historyText && (
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">過去の順位変遷</p>
                    <p className="text-slate-200 font-mono tracking-wider">{historyText}</p>
                  </div>
                </div>
              )}

              {rating > 0 && (
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl text-accent">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">評価</p>
                    <ScoreRating rating={rating} readOnly />
                  </div>
                </div>
              )}
            </div>

            {/* Memo Section */}
            {memo && (
              <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
                  <AlignLeft className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-slate-200 tracking-wide">詳細メモ</h3>
                </div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {memo}
                </p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  );
}
