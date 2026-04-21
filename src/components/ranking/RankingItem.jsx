import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, AlignLeft, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, Film, Clapperboard, MoreHorizontal, ChevronRight } from 'lucide-react';
import RankingItemDetailModal from './RankingItemDetailModal';
import ScoreRating from './ScoreRating';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv },
  { id: 'manga', label: '漫画', icon: BookOpen },
  { id: 'movie', label: '映画', icon: Film },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard },
  { id: 'other', label: '他', icon: MoreHorizontal },
];

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

export default function RankingItem({ item: propItem, isEditMode, dragHandleProps, onUpdate, genre: propGenre, isCollapsed = false, rankingId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);

  // Subscribe to live store updates for this specific item
  const liveItem = useStore(state => {
    const allRanked = (state.rankings || []).flatMap(r => r.items || []);
    const allUnranked = state.unrankedItems || [];
    return [...allRanked, ...allUnranked].find(i => i.id === propItem.id);
  }) || propItem;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0, isSelected = false, genre: itemGenre } = liveItem;
  const effectiveGenre = itemGenre || propGenre || 'other';

  // Local states to fix IME bug for lists
  const [localTitle, setLocalTitle] = useState(title || '');
  const [localAuthor, setLocalAuthor] = useState(author || '');
  const [localFontSize, setLocalFontSize] = useState(fontSize);

  useEffect(() => { setLocalTitle(title || ''); }, [title]);
  useEffect(() => { setLocalAuthor(author || ''); }, [author]);
  useEffect(() => { setLocalFontSize(fontSize); }, [fontSize]);

  const dateObj = createdAt ? new Date(createdAt) : null;
  const formattedDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString('ja-JP').split('/').slice(1).join('/') : '';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => { 
        const compressed = await compressImage(reader.result);
        onUpdate(propItem.id, { imageBase64: compressed }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoFetch = async () => {
    if (!localTitle || !localTitle.trim() || isFetching) return;
    setIsFetching(true); setFetchStatus(null);
    try {
      const result = await fetchMetadata(localTitle.trim(), effectiveGenre);
      if (result) {
        onUpdate(propItem.id, { memo: result.memo, author: result.author || author });
        if (result.author) setLocalAuthor(result.author);
        setFetchStatus('success');
      } else { setFetchStatus('error'); }
    } catch { setFetchStatus('error'); }
    finally { setIsFetching(false); setTimeout(() => setFetchStatus(null), 3000); }
  };

  const handleTitleSync = () => {
    if (localTitle !== title) {
      const updates = { title: localTitle };
      if (!createdAt && localTitle.trim() !== '') updates.createdAt = new Date().toISOString();
      onUpdate(propItem.id, updates);
    }
  };

  const handleAuthorSync = () => {
    if (localAuthor !== author) {
      onUpdate(propItem.id, { author: localAuthor });
    }
  };

  const renderRankBadge = (rank) => {
    const size = isCollapsed ? "w-8 h-8" : "w-10 h-10";
    let bgClass = "bg-black/40 text-slate-500 border-white/5";
    let icon = null;
    
    if (rank === 1) { bgClass = "bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-600 text-yellow-950 border-yellow-300/50 shadow-lg"; icon = !isCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5" />; }
    else if (rank === 2) { bgClass = "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 text-slate-950 border-slate-300/50 shadow-md"; icon = !isCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5" />; }
    else if (rank === 3) { bgClass = "bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 text-orange-950 border-orange-400/50 shadow-md"; icon = !isCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 text-orange-900" />; }
    
    if (!rank) {
      const GenreIcon = GENRES.find(g => g.id === effectiveGenre)?.icon || MoreHorizontal;
      return (
        <div className={`flex-shrink-0 flex items-center justify-center bg-white/5 text-accent rounded-lg border border-white/5 ${size}`}>
          <GenreIcon size={isCollapsed ? 12 : 16} />
        </div>
      );
    }

    return (
      <div className={`flex-shrink-0 flex flex-col items-center justify-center font-bold font-mono rounded-lg border backdrop-blur-md transition-all duration-300 ${size} ${bgClass}`}>
        {icon}
        <span className={`drop-shadow-sm leading-none ${isCollapsed ? 'text-xs' : 'text-sm'}`}>{rank}</span>
      </div>
    );
  };

  return (
    <>
      <div 
        className={`rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer hover:bg-white/5 active:scale-[0.98] ${currentRank === 1 ? 'bg-yellow-500/10 border-yellow-500/20 shadow-xl' : 'bg-black/20 backdrop-blur-md border-white/5'}`} 
        onClick={() => setIsModalOpen(true)}
      >
        {isEditMode ? (
          <div className="flex flex-col p-4 gap-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderRankBadge(currentRank)}
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
                  {GENRES.map(g => (
                    <button key={g.id} onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { genre: g.id }); }} className={`p-1.5 rounded-lg transition-all ${effectiveGenre === g.id ? 'bg-accent/20 text-accent border border-accent/30 shadow-lg shadow-accent/10' : 'text-slate-600 hover:text-slate-400'}`}>
                      <g.icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
              {dragHandleProps && (
                <div {...dragHandleProps} className="p-2.5 cursor-grab text-slate-600 hover:text-accent bg-white/5 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
                  <GripVertical className="w-5 h-5" />
                </div>
              )}
            </div>
            
            {/* Title Row */}
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <input 
                type="text" 
                value={localTitle} 
                onClick={e => e.stopPropagation()} 
                onChange={e => setLocalTitle(e.target.value)} 
                onBlur={handleTitleSync}
                onKeyDown={e => e.key === 'Enter' && handleTitleSync()}
                placeholder="作品名を入力..." 
                className={`flex-1 bg-transparent border-b border-white/10 focus:border-accent outline-none text-white pb-1 italic tracking-tight ${isBold ? 'font-black' : 'font-bold'}`} 
                style={{ color, fontSize: `${localFontSize}px` }} 
              />
              <button onClick={(e) => { e.stopPropagation(); handleAutoFetch(); }} disabled={!localTitle?.trim() || isFetching} className={`p-2.5 rounded-xl border transition-all shadow-lg ${fetchStatus === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : fetchStatus === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-accent/20 border-accent/40 text-accent'}`}>
                {isFetching ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>

            {/* Meta Row */}
            <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <User className="w-3.5 h-3.5 text-accent" />
                <input 
                  type="text" 
                  value={localAuthor} 
                  onClick={e => e.stopPropagation()} 
                  onChange={e => setLocalAuthor(e.target.value)} 
                  onBlur={handleAuthorSync}
                  onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                  placeholder="作者名" 
                  className="bg-transparent border-none outline-none text-white text-[10px] font-bold w-full" 
                />
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <input 
                  type="date" 
                  value={createdAt ? createdAt.split('T')[0] : ''} 
                  onClick={e => e.stopPropagation()} 
                  onChange={e => onUpdate(propItem.id, { createdAt: new Date(e.target.value).toISOString() })} 
                  className="bg-transparent border-none outline-none text-white text-[10px] font-bold w-full" 
                />
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rating</span>
                <div className="flex-1 flex justify-center"><ScoreRating rating={rating} onRatingChange={v => onUpdate(propItem.id, { rating: v })} /></div>
              </div>
              <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5">
                 <Eye className="w-3.5 h-3.5 text-blue-500" />
                 <div className="flex items-center gap-2 flex-1">
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { views: Math.max(0, views - 1) }) }} className="w-5 h-5 bg-white/5 rounded text-xs text-slate-400">-</button>
                    <span className="text-[11px] font-mono font-bold text-white flex-1 text-center">{views}</span>
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { views: views + 1 }) }} className="w-5 h-5 bg-white/5 rounded text-xs text-slate-400">+</button>
                 </div>
              </div>
            </div>

            {/* Styling Row */}
            <div className="flex items-center gap-4 bg-black/40 p-2.5 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
              <div className="flex-1 flex items-center gap-3">
                <Type className="w-4 h-4 text-slate-500" />
                <input 
                  type="range" 
                  min="12" 
                  max="32" 
                  value={localFontSize} 
                  onClick={e => e.stopPropagation()}
                  onChange={(e) => { const v = parseInt(e.target.value); setLocalFontSize(v); onUpdate(propItem.id, { fontSize: v }); }} 
                  className="flex-1 h-1 bg-slate-800 rounded-full accent-accent appearance-none" 
                />
              </div>
              <button onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { isBold: !isBold }); }} className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-widest ${isBold ? 'bg-accent text-black border-accent' : 'bg-white/5 text-slate-500 border-white/10'}`}>BOLD</button>
              <input type="color" value={color} onClick={e => e.stopPropagation()} onChange={e => onUpdate(propItem.id, { color: e.target.value })} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
            </div>

            {/* Image Row */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 group" onClick={e => e.stopPropagation()}>
               {imageBase64 ? <img src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 gap-2"><ImageIcon className="w-8 h-8 opacity-20" /><span className="text-[9px] font-black tracking-widest opacity-20">NO IMAGE</span></div>}
               <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <div className="bg-accent text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Update Image</div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
               </label>
            </div>
          </div>
        ) : (
          <div className={`flex flex-row items-stretch ${isCollapsed ? 'min-h-[52px]' : 'min-h-[104px]'}`}>
            <div className={`flex-1 flex flex-row min-w-0 gap-4 ${isCollapsed ? 'p-3 items-center' : 'p-4'}`}>
              <div className="flex-shrink-0">{renderRankBadge(currentRank)}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className={`leading-tight truncate ${isBold ? 'font-black' : 'font-extrabold'} text-white italic`} style={{ color: currentRank <= 3 ? undefined : color, fontSize: isCollapsed ? '14px' : `${fontSize}px` }}>{title || 'Untitled'}</h3>
                {!isCollapsed && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                    {author && <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider"><User className="w-3 h-3 text-accent" />{author}</span>}
                    {rating > 0 && <ScoreRating rating={rating} readOnly />}
                    {views > 0 && <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono"><Eye className="w-3 h-3 text-blue-500" />{views}</span>}
                    {formattedDate && <span className="flex items-center gap-1 text-[10px] text-slate-500"><Calendar className="w-3 h-3 text-emerald-500" />{formattedDate}</span>}
                    {isSelected && <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[8px] font-black tracking-[0.2em] border border-emerald-500/25 uppercase">Selected</span>}
                  </div>
                )}
                {isCollapsed && author && <p className="text-[10px] text-slate-600 font-bold truncate mt-1">{author}</p>}
              </div>
            </div>
            {!isCollapsed && imageBase64 && (
              <div className="flex-shrink-0 p-3 flex items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="flex items-center pr-3 text-slate-800"><ChevronRight size={16} /></div>
          </div>
        )}
      </div>
      <RankingItemDetailModal 
        item={liveItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
