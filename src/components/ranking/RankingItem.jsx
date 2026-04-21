import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, AlignLeft, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, Film, Clapperboard, MoreHorizontal } from 'lucide-react';
import RankingItemDetailModal from './RankingItemDetailModal';
import ScoreRating from './ScoreRating';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRE_EMOJI = {
  anime: '📺',
  manga: '📖',
  movie: '🎬',
  drama: '🎭',
  other: '✨'
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

export default function RankingItem({ item, isEditMode, dragHandleProps, onUpdate, genre: propGenre, isCollapsed = false }) {
  const setEditMode = useStore(state => state.setEditMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);

  const { id, currentRank, title, author, memo, createdAt, imageBase64, isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0, isSelected = false, genre: itemGenre } = item;
  
  // Priority: item.genre > propGenre > other
  const effectiveGenre = itemGenre || propGenre || 'other';

  const [localFontSize, setLocalFontSize] = useState(fontSize);
  useEffect(() => { setLocalFontSize(fontSize); }, [fontSize]);

  const dateObj = createdAt ? new Date(createdAt) : null;
  const formattedDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString('ja-JP').split('/').slice(1).join('/') : '';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => { 
        const compressed = await compressImage(reader.result);
        onUpdate(item.id, { imageBase64: compressed }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const updates = { title: newTitle };
    if (!createdAt && newTitle.trim() !== '') updates.createdAt = new Date().toISOString();
    onUpdate(item.id, updates);
    setFetchStatus(null);
  };

  const handleAutoFetch = async () => {
    if (!title || !title.trim() || isFetching) return;
    setIsFetching(true); setFetchStatus(null);
    try {
      const result = await fetchMetadata(title.trim(), effectiveGenre);
      if (result) {
        onUpdate(item.id, { memo: result.memo, author: result.author || author });
        setFetchStatus('success');
      } else { setFetchStatus('error'); }
    } catch { setFetchStatus('error'); }
    finally { setIsFetching(false); setTimeout(() => setFetchStatus(null), 3000); }
  };

  if (!isEditMode && !(title || imageBase64 || memo || author)) return null;

  const renderRankBadge = (rank) => {
    if (!rank && !isSelected) return (
      <div className={`flex-shrink-0 flex items-center justify-center bg-white/5 text-slate-700 rounded-lg border border-white/5 ${isCollapsed ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'} font-black`}>
        {GENRE_EMOJI[effectiveGenre]}
      </div>
    );
    const size = isCollapsed ? "w-8 h-8" : "w-10 h-10";
    let bgClass = "bg-black/40 text-slate-500 border-white/5";
    let icon = null;
    if (rank === 1) { bgClass = "bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-600 text-yellow-950 border-yellow-300/50"; icon = !isCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5" />; }
    else if (rank === 2) { bgClass = "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 text-slate-950 border-slate-300/50"; icon = !isCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5" />; }
    else if (rank === 3) { bgClass = "bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 text-orange-950 border-orange-400/50"; icon = !isCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 text-orange-900" />; }
    return (
      <div className={`flex-shrink-0 flex flex-col items-center justify-center font-bold font-mono rounded-lg border backdrop-blur-md transition-all duration-300 ${size} ${bgClass}`}>
        {icon}
        <span className={`drop-shadow-sm leading-none ${isCollapsed ? 'text-xs' : 'text-sm'}`}>{rank || GENRE_EMOJI[effectiveGenre]}</span>
      </div>
    );
  };

  return (
    <>
      <div className={`rounded-xl overflow-hidden border transition-all duration-300 flex flex-col ${!isEditMode ? 'cursor-pointer hover:bg-white/5' : ''} ${currentRank === 1 ? 'bg-yellow-500/10 border-yellow-500/20 shadow-xl' : 'bg-black/20 backdrop-blur-md border-white/5'}`} onClick={() => !isEditMode && setIsModalOpen(true)}>
        {isEditMode ? (
          <div className="flex flex-col p-3 gap-3">
            <div className="flex items-center gap-2">
              {renderRankBadge(currentRank)}
              <div className="flex-1" />
              {dragHandleProps && (
                <div {...dragHandleProps} className="p-2 cursor-grab text-slate-500 hover:text-accent bg-white/5 rounded-lg touch-none" onClick={e => e.stopPropagation()}>
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={title || ''} onChange={handleTitleChange} placeholder="Title" className={`flex-1 bg-transparent border-b border-white/10 focus:border-accent outline-none text-white pb-1 ${isBold ? 'font-black' : 'font-bold'}`} style={{ color, fontSize: `${localFontSize}px` }} />
              <button onClick={(e) => { e.stopPropagation(); handleAutoFetch(); }} disabled={!title?.trim() || isFetching} className={`p-2 rounded-xl border transition-all ${fetchStatus === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : fetchStatus === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-accent/20 border-accent/40 text-accent'}`}>
                {isFetching ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 flex-1 min-w-[140px]">
                <User className="w-3.5 h-3.5 text-accent" />
                <input type="text" value={author || ''} onChange={e => onUpdate(item.id, { author: e.target.value })} placeholder="Author" className="bg-transparent border-none outline-none text-white text-xs w-full" />
              </div>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                <ScoreRating rating={rating} onRatingChange={v => onUpdate(item.id, { rating: v })} />
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex flex-row items-stretch ${isCollapsed ? 'min-h-[48px]' : 'min-h-[84px]'}`}>
            <div className={`flex-1 flex flex-row min-w-0 gap-3 ${isCollapsed ? 'p-2 items-center' : 'p-3'}`}>
              <div className="flex-shrink-0">{renderRankBadge(currentRank)}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className={`leading-tight truncate ${isBold ? 'font-black' : 'font-extrabold'} text-white`} style={{ color: currentRank <= 3 ? undefined : color, fontSize: isCollapsed ? '13px' : `${fontSize}px` }}>{title || 'Untitled'}</h3>
                {author && <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{author}</p>}
                {!isCollapsed && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {rating > 0 && <ScoreRating rating={rating} readOnly />}
                    {views > 0 && <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono"><Eye className="w-3 h-3 text-blue-500" />{views}</span>}
                    {isSelected && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest border border-emerald-500/30 uppercase">SELECTED</span>}
                  </div>
                )}
              </div>
            </div>
            {!isCollapsed && imageBase64 && (
              <div className="flex-shrink-0 p-2 flex items-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shadow-inner bg-black">
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <RankingItemDetailModal item={item} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
