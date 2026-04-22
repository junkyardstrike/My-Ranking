import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, AlignLeft, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, MoreHorizontal, ChevronRight, ChevronDown, History, Plus, Minus, Star } from 'lucide-react';
import RankingItemDetailModal from './RankingItemDetailModal';
import ScoreRating from './ScoreRating';
import { fetchMetadata } from '../../services/metadataFetcher';

const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv },
  { id: 'manga', label: '漫画', icon: BookOpen },
  { id: 'movie', label: '映画', icon: Film },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard },
  { id: 'game', label: 'ゲーム', icon: Gamepad2 },
  { id: 'music', label: '音楽', icon: Music },
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

export default function RankingItem({ item: propItem, isEditMode, dragHandleProps, onUpdate, onMove, genre: propGenre, isCollapsed: propIsCollapsed = false, rankingId, isReorderMode = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [localIsCollapsed, setLocalIsCollapsed] = useState(propIsCollapsed);

  useEffect(() => {
    setLocalIsCollapsed(propIsCollapsed);
  }, [propIsCollapsed]);

  // Subscribe to live store updates for this specific item
  const liveItemFromStore = useStore(state => {
    const allRanked = (state.rankings || []).flatMap(r => r.items || []);
    const allUnranked = state.unrankedItems || [];
    return [...allRanked, ...allUnranked].find(i => i.id === propItem.id);
  });

  const liveItem = liveItemFromStore ? {
    ...liveItemFromStore,
    isSelected: propItem.isSelected || liveItemFromStore.isSelected,
    rankingId: propItem.rankingId || liveItemFromStore.rankingId,
    rankingTitle: propItem.rankingTitle || liveItemFromStore.rankingTitle
  } : propItem;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0, isSelected = false, genre: itemGenre, previousRanks = [] } = liveItem;
  
  // Safe genre fallback: ensure 'other' is mapped to 'music'
  const rawGenre = itemGenre || propItem.genre || propGenre || 'music';
  const effectiveGenre = rawGenre === 'other' ? 'music' : rawGenre;

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
    const isActuallyCollapsed = localIsCollapsed;
    const size = isActuallyCollapsed ? "w-8 h-8" : "w-10 h-10";
    let bgClass = "bg-black/40 text-slate-500 border-white/5";
    let icon = null;
    
    if (rank === 1) { 
      bgClass = "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 text-yellow-950 border-yellow-300/50 shadow-[0_0_15px_rgba(255,215,0,0.4)]"; 
      icon = !isActuallyCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 text-yellow-900/60" />; 
    }
    else if (rank === 2) { 
      bgClass = "bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-900 border-slate-200/50 shadow-lg"; 
      icon = !isActuallyCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 text-slate-700/60" />; 
    }
    else if (rank === 3) { 
      bgClass = "bg-gradient-to-br from-orange-200 via-orange-400 to-orange-600 text-orange-950 border-orange-300/50 shadow-md"; 
      icon = !isActuallyCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 text-orange-800/60" />; 
    }
    else if (rank === 4) { bgClass = "bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 text-white border-white/10 shadow-sm"; }
    
    if (!rank) {
      const GenreIcon = GENRES.find(g => g.id === effectiveGenre)?.icon || MoreHorizontal;
      return (
        <div className={`flex-shrink-0 flex items-center justify-center bg-white/5 text-accent rounded-lg border border-white/5 ${size}`}>
          <GenreIcon size={isActuallyCollapsed ? 12 : 16} />
        </div>
      );
    }

    return (
      <div className={`flex-shrink-0 flex flex-col items-center justify-center font-bold font-mono rounded-lg border backdrop-blur-md transition-all duration-300 ${size} ${bgClass}`}>
        {icon}
        <span className={`drop-shadow-sm leading-none ${isActuallyCollapsed ? 'text-xs' : 'text-sm'}`}>{rank}</span>
      </div>
    );
  };

  return (
    <>
      <div 
        className={`rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer relative group/card ${
          currentRank === 1 
            ? 'border-transparent bg-black/60 shadow-2xl' 
            : currentRank === 2
            ? 'bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20'
            : currentRank === 3
            ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
            : 'bg-black/20 backdrop-blur-md border-white/5 hover:bg-white/5'
        }`} 
        onClick={() => setIsModalOpen(true)}
      >
        {/* Gold glow effect for rank 1 - Premium Gold */}
        {currentRank === 1 && (
          <div className="absolute -inset-[1.5px] bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 rounded-2xl -z-10 animate-pulse blur-[8px] opacity-60" />
        )}
        
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
                {(rankingId || liveItem.rankingId) && (
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextRank = Math.max(1, currentRank - 1);
                        if (onMove) onMove(id, nextRank); 
                        else moveItemToRank(rankingId || liveItem.rankingId, id, nextRank);
                      }} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 active:scale-90 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-[13px] font-black text-white italic tabular-nums">{currentRank}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextRank = Math.min(100, currentRank + 1);
                        if (onMove) onMove(id, nextRank); 
                        else moveItemToRank(rankingId || liveItem.rankingId, id, nextRank);
                      }} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 active:scale-90 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
              {(dragHandleProps || isReorderMode) && (
                <div {...dragHandleProps} className="p-2.5 cursor-grab text-slate-500 hover:text-accent bg-white/5 rounded-xl border border-white/5 active:scale-95 transition-all">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
              <div className="space-y-3 text-center flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Star size={10} className="text-accent" /> SCORE</p>
                <div className="flex justify-center">
                   <ScoreRating rating={rating} onRatingChange={v => onUpdate(propItem.id, { rating: v })} />
                </div>
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
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
               </label>
            </div>
          </div>
        ) : (
          <div className={`flex flex-row items-stretch ${localIsCollapsed ? 'min-h-[44px]' : 'min-h-[84px]'}`}>
            <div className={`flex-1 flex flex-row min-w-0 gap-3 ${localIsCollapsed ? 'p-2 items-center' : 'p-3'}`}>
              <div className="flex-shrink-0">{renderRankBadge(currentRank)}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h3 className={`leading-tight truncate ${isBold ? 'font-black' : 'font-extrabold'} text-white italic`} style={{ color: currentRank <= 3 ? undefined : color, fontSize: localIsCollapsed ? '13px' : `${fontSize}px` }}>{title || 'Untitled'}</h3>
                  {localIsCollapsed && previousRanks.length > 0 && previousRanks[previousRanks.length - 1].rank !== currentRank && (
                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      <History size={8} className="text-slate-500" />
                      <div className="flex gap-0.5">
                        <span className="text-[7px] font-bold text-slate-400">{previousRanks[previousRanks.length - 1].rank}→</span>
                        <span className="text-[7px] font-black text-accent">{currentRank}</span>
                      </div>
                    </div>
                  )}
                </div>
                {!localIsCollapsed && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {isSelected && !rankingId && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/20 border border-accent/30 text-accent text-[8px] font-black uppercase tracking-widest italic leading-none">
                        <Crown size={8} /> 選出済み
                      </span>
                    )}
                    {author && <span className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider"><User className="w-2.5 h-2.5 text-accent" />{author}</span>}
                    {rating > 0 && (
                      <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                        <div className="scale-75 origin-left -ml-1">
                          <ScoreRating rating={rating} readOnly />
                        </div>
                      </div>
                    )}
                    {views > 0 && <span className="flex items-center gap-1 text-[9px] text-slate-500 font-mono"><Eye className="w-2.5 h-2.5 text-blue-500" />{views}</span>}
                    {formattedDate && <span className="flex items-center gap-1 text-[9px] text-slate-500"><Calendar className="w-2.5 h-2.5 text-emerald-500" />{formattedDate}</span>}
                    
                    {/* Rank history in expanded view */}
                    {previousRanks.length > 0 && previousRanks[previousRanks.length - 1].rank !== currentRank && (
                      <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-white/5 ml-auto">
                        <History size={10} className="text-slate-600" />
                        <div className="flex items-center gap-1">
                          <span key="prev" className="text-[9px] font-bold text-slate-500">{previousRanks[previousRanks.length - 1].rank} <span className="text-[8px] opacity-40">→</span></span>
                          <span className="text-[9px] font-black text-accent">{currentRank}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {!localIsCollapsed && imageBase64 && (
              <div className="flex-shrink-0 p-2 flex items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            
            <div className="flex items-center pr-1 gap-1">
              {(isReorderMode || dragHandleProps) && !isEditMode && (
                <div 
                  {...dragHandleProps} 
                  className="p-2 cursor-grab text-slate-700 hover:text-accent transition-colors active:scale-90"
                >
                  <GripVertical size={16} />
                </div>
              )}
              <div 
                className="p-2 text-slate-800 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalIsCollapsed(!localIsCollapsed);
                }}
              >
                {localIsCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
          </div>
        )}
      </div>
      <RankingItemDetailModal 
        item={liveItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUpdate={onUpdate}
        onMove={onMove}
        rankingId={rankingId || liveItem.rankingId}
      />
    </>
  );
}
