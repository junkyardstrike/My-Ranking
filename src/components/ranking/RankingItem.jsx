import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, AlignLeft, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, MoreHorizontal, ChevronRight, ChevronDown, History, Plus, Minus, Star, Clock, CheckCircle2 } from 'lucide-react';
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

const GENRE_LABELS = {
  anime: 'アニメ', manga: '漫画', movie: '映画', drama: 'ドラマ', game: 'ゲーム', music: '音楽'
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

export default function RankingItem({ item: propItem, isEditMode, dragHandleProps, onUpdate, onMove, genre: propGenre, isCollapsed: propIsCollapsed = false, rankingId, isReorderMode = false, isSelectable = false, isSelectedForBulk = false, onToggleSelect = null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [localIsCollapsed, setLocalIsCollapsed] = useState(propIsCollapsed);
  const settings = useStore(state => state.settings) || {
    defaultDurations: { movie: 120, music: 3, anime: 20, drama: 40, manga: 30, game: 60 },
    useViewCount: true
  };

  useEffect(() => {
    setLocalIsCollapsed(propIsCollapsed);
  }, [propIsCollapsed]);

  // Subscribe to live store updates for this specific item
  const liveItemFromStore = useStore(state => {
    const allRanked = (state.rankings || []).flatMap(r => r.items || []);
    const allUnranked = state.unrankedItems || [];
    return [...allRanked, ...allUnranked].find(i => i.id === propItem.id);
  });

  const liveItem = {
    ...(liveItemFromStore || {}),
    ...propItem,
    // Explicitly preserve rankingId from props if store version doesn't have it
    rankingId: propItem.rankingId || rankingId || liveItemFromStore?.rankingId,
    // Ensure history is preserved from store
    previousRanks: (liveItemFromStore?.previousRanks || propItem.previousRanks || [])
  };

  const { id, currentRank, title, author, memo, createdAt, imageBase64, isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0, isSelected = false, genre: itemGenre, previousRanks = [], duration, episodes = 1, volumes = 1, rankingId: effectiveRankingId } = liveItem;
  
  // Safe genre fallback: ensure 'other' is mapped to 'music'
  const rawGenre = itemGenre || propItem.genre || propGenre || 'music';
  const effectiveGenre = rawGenre === 'other' ? 'music' : rawGenre;

  const baseDuration = (duration !== undefined && duration !== null && duration !== '' && Number(duration) > 0) ? Number(duration) : null;
  let unitDuration = baseDuration;
  if (unitDuration === null) {
    unitDuration = settings.defaultDurations[effectiveGenre] || settings.defaultDurations.movie || 60;
  }

  let totalDurationPerView = unitDuration;
  if (effectiveGenre === 'manga') totalDurationPerView = unitDuration * (volumes || 1);
  else if (effectiveGenre === 'anime' || effectiveGenre === 'drama') totalDurationPerView = unitDuration * (episodes || 1);

  const finalViewCount = settings.useViewCount ? (views || 1) : 1;
  const totalLifetimeDuration = totalDurationPerView * finalViewCount;

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
        const updates = { memo: result.memo, author: result.author || author };
        
        // Automatic extraction for volumes/episodes
        if (result.memo) {
          if (effectiveGenre === 'manga') {
            const volMatch = result.memo.match(/VOLUMES:\s*全?(\d+)巻/i) || result.memo.match(/全(\d+)巻/) || result.memo.match(/(\d+)巻/);
            if (volMatch && volMatch[1]) {
              updates.volumes = parseInt(volMatch[1]);
            }
          } else if (effectiveGenre === 'anime' || effectiveGenre === 'drama') {
            const epMatch = result.memo.match(/EPISODES:\s*(\d+)話/i) || result.memo.match(/全(\d+)話/) || result.memo.match(/(\d+)話/);
            if (epMatch && epMatch[1]) {
              updates.episodes = parseInt(epMatch[1]);
            }
          }
        }
        
        onUpdate(propItem.id, updates);
        if (result.author) setLocalAuthor(result.author);
        setFetchStatus('success');
      } else { setFetchStatus('error'); }
    } catch { setFetchStatus('error'); }
    finally { setIsFetching(false); setTimeout(() => setFetchStatus(null), 3000); }
  };

  const handleTitleSync = () => {
    if (localTitle !== title && localTitle.trim() !== '') {
      // Overlap Check: same genre, same name
      const allItems = useStore.getState().getAllItems();
      const duplicateItems = allItems.filter(item => 
        item.id !== id && 
        item.title?.toLowerCase().trim() === localTitle.toLowerCase().trim()
      );

      if (duplicateItems.length > 0) {
        const duplicateGenres = [...new Set(duplicateItems.map(item => GENRE_LABELS[item.genre] || item.genre))];
        const genreString = duplicateGenres.map(g => `「${g}」`).join('');
        
        if (!confirm(`【重複注意】\n「${localTitle}」は既に${genreString}ジャンルに登録されています。このまま登録しますか？`)) {
          setLocalTitle(title || '');
          return;
        }
      }

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
      bgClass = "bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#917405] text-[#423401] border-[#FFE55C] shadow-[0_0_20px_rgba(255,215,0,0.5)] ring-1 ring-yellow-300/30"; 
      icon = !isActuallyCollapsed && <Crown className="w-3.5 h-3.5 mx-auto mb-0.5 filter drop-shadow-sm" fill="currentColor" />; 
    }
    else if (rank === 2) { 
      bgClass = "bg-gradient-to-br from-[#E6E6E6] via-[#B3B3B3] to-[#7F7F7F] text-[#1A1A1A] border-[#F2F2F2] shadow-[0_0_15px_rgba(255,255,255,0.2)]"; 
      icon = !isActuallyCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 filter drop-shadow-sm opacity-80" />; 
    }
    else if (rank === 3) { 
      bgClass = "bg-gradient-to-br from-[#CD7F32] via-[#A0522D] to-[#5D2906] text-[#FFE4C4] border-[#E39E67] shadow-[0_0_12px_rgba(205,127,50,0.3)]"; 
      icon = !isActuallyCollapsed && <Crown className="w-3 h-3 mx-auto mb-0.5 filter drop-shadow-sm opacity-70" />; 
    }
    
    if (!rank || !effectiveRankingId) {
      return (
        <div className={`flex-shrink-0 flex flex-col items-center justify-center bg-black/40 text-slate-600 rounded-lg border border-white/5 shadow-inner transition-all hover:border-accent/30 group/unranked ${size}`}>
          <div className="relative">
             <Plus size={isActuallyCollapsed ? 10 : 12} className="group-hover/unranked:text-accent transition-colors" />
             <div className="absolute inset-0 blur-sm bg-accent/0 group-hover/unranked:bg-accent/20 transition-all rounded-full" />
          </div>
          {!isActuallyCollapsed && <span className="text-[6px] font-black uppercase tracking-tighter leading-none mt-0.5 opacity-40">Add</span>}
        </div>
      );
    }

    return (
      <div className={`flex-shrink-0 flex flex-col items-center justify-center font-black font-mono rounded-lg border backdrop-blur-md transition-all duration-500 hover:scale-105 ${size} ${bgClass}`}>
        {icon}
        <span className={`drop-shadow-sm leading-none ${isActuallyCollapsed ? 'text-[11px]' : 'text-sm'}`}>{rank}</span>
      </div>
    );
  };

  const handleMove = (newRank) => {
    if (onMove) {
      onMove(id, newRank);
      // Follow the item to its new position after a short delay for store/DOM update
      setTimeout(() => {
        const element = document.getElementById(`ranking-item-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Brief flash effect
          element.style.ringWidth = '4px';
          element.style.ringColor = '#D4AF37';
          element.classList.add('ring-4', 'ring-accent/50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-accent/50');
          }, 1000);
        }
      }, 100);
    } else {
      moveItemToRank(rankingId || liveItem.rankingId, id, newRank);
    }
  };

  return (
    <>
      <div 
        id={`ranking-item-${id}`}
        className={`rounded-[22px] overflow-hidden border transition-all duration-500 flex flex-col cursor-pointer relative group/card backdrop-blur-xl ${
          currentRank === 1 
            ? 'border-2 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.6),0_0_30px_rgba(255,215,0,0.3),inset_0_0_15px_rgba(255,215,0,0.3)] bg-gradient-to-br from-white/[0.08] to-white/[0.03] scale-[1.03]' 
            : currentRank === 2
            ? 'border-2 border-slate-200 shadow-[0_0_12px_rgba(255,255,255,0.4),0_0_25px_rgba(203,213,225,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] bg-gradient-to-br from-white/[0.08] to-white/[0.03] scale-[1.01]' 
            : currentRank === 3
            ? 'border-2 border-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.4),0_0_20px_rgba(234,88,12,0.2),inset_0_0_8px_rgba(234,88,12,0.1)] bg-gradient-to-br from-white/[0.08] to-white/[0.03] scale-[1.01]' 
            : 'border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:bg-white/[0.07] hover:border-white/20'
        }`} 
        onClick={() => {
          if (isReorderMode) return;
          setIsModalOpen(true);
        }}
      >
        {/* Gold glow effect removed to ensure true transparency */}
        {/* Absolute Volume/Episode Badge - Hidden in Edit Mode */}
        {(effectiveGenre === 'manga' || effectiveGenre === 'anime' || effectiveGenre === 'drama') && !isEditMode && (
          <div className="absolute right-2 top-1 z-20 pointer-events-none">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-accent border border-black/20 text-[0.85em] font-black tracking-[0.2em] text-black uppercase shadow-[0_6px_15px_rgba(0,0,0,0.5)]">
              {effectiveGenre === 'manga' ? `全${volumes || 1}巻` : `全${episodes || 1}話`}
            </span>
          </div>
        )}
        
        {isEditMode ? (
          <div className="flex flex-col p-4 gap-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderRankBadge(currentRank)}
                <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
                  {GENRES.map(g => (
                    <button 
                      key={g.id} 
                      onPointerDown={e => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { genre: g.id }); }} 
                      className={`p-2.5 rounded-lg transition-all active:scale-90 touch-manipulation ${effectiveGenre === g.id ? 'bg-accent/20 text-accent border border-accent/30 shadow-lg shadow-accent/10' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <g.icon size={16} />
                    </button>
                  ))}
                </div>
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
              <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 active:bg-white/5 transition-colors">
                <User className="w-3.5 h-3.5 text-accent" />
                <input 
                  type="text" 
                  value={localAuthor} 
                  onClick={e => e.stopPropagation()} 
                  onPointerDown={e => e.stopPropagation()}
                  onChange={e => setLocalAuthor(e.target.value)} 
                  onBlur={handleAuthorSync}
                  onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                  placeholder="作者名" 
                  className="bg-transparent border-none outline-none text-white text-[10px] font-bold w-full h-full" 
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

            {/* Rank Change Row - Between Meta and Metrics */}
            {(rankingId || liveItem.rankingId) && (
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic pr-2">順位変更 / RANK</span>
                  <div className="flex items-center gap-1 bg-accent/20 p-1 rounded-xl border border-accent/20">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextRank = Math.max(1, currentRank - 1);
                        handleMove(nextRank); 
                      }} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/20 text-accent hover:bg-accent/40 active:scale-75 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="w-12 h-8 flex items-center justify-center">
                      <input 
                        type="number"
                        min="1"
                        key={`expanded-${id}-${currentRank}`}
                        defaultValue={currentRank}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0 && val !== currentRank) {
                            handleMove(val);
                          }
                        }}
                        className="w-full h-full bg-accent text-black font-black text-center rounded-md text-sm outline-none focus:ring-2 focus:ring-white"
                      />
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextRank = Math.min(100, currentRank + 1);
                        handleMove(nextRank); 
                      }} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/20 text-accent hover:bg-accent/40 active:scale-75 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            {/* Time & Episodes Row */}
            <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
               <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center gap-2 active:bg-white/5 transition-colors active:scale-[0.98]">
                 <Clock className="w-3.5 h-3.5 text-purple-500" />
                 <input type="number" min="0" value={duration || ''} onPointerDown={e => e.stopPropagation()} onChange={e => onUpdate(propItem.id, { duration: e.target.value === '' ? 0 : (effectiveGenre === 'game' ? parseFloat(e.target.value) : parseInt(e.target.value)) })} className="bg-transparent border-none outline-none text-white text-[10px] font-bold w-full" placeholder="所要時間" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{effectiveGenre === 'game' ? '時間' : '分'}</span>
               </div>
               {(effectiveGenre === 'anime' || effectiveGenre === 'drama') && (
                 <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center gap-2 active:bg-white/5 transition-colors active:scale-[0.98]">
                   <Tv className="w-3.5 h-3.5 text-slate-500" />
                   <input type="number" min="0" value={episodes || ''} onPointerDown={e => e.stopPropagation()} onChange={e => onUpdate(propItem.id, { episodes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-white text-[10px] font-bold w-full" placeholder="話数" />
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">話</span>
                 </div>
               )}
               {effectiveGenre === 'manga' && (
                 <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center gap-2 active:bg-white/5 transition-colors active:scale-[0.98]">
                   <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                   <input type="number" min="0" value={volumes || ''} onPointerDown={e => e.stopPropagation()} onChange={e => onUpdate(propItem.id, { volumes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-white text-[10px] font-bold w-full" placeholder="巻数" />
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">巻</span>
                 </div>
               )}
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
          <div className={`flex flex-row items-stretch ${localIsCollapsed ? 'min-h-[44px]' : 'min-h-[72px]'}`}>
            <div className={`flex-1 flex flex-row min-w-0 gap-3 ${localIsCollapsed ? 'p-2 items-center' : 'p-2'}`}>
              {isSelectable && (
                <div 
                  className="flex items-center pr-1 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(id); }}
                >
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isSelectedForBulk ? 'bg-accent border-accent' : 'bg-white/5 border-white/20'}`}>
                    {isSelectedForBulk && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[60px] px-1 relative z-10">
                {renderRankBadge(currentRank)}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className={`leading-tight truncate ${isBold ? 'font-black' : 'font-extrabold'} text-white italic drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] pr-4`} style={{ color: currentRank <= 3 ? undefined : color, fontSize: localIsCollapsed ? '13px' : `${fontSize}px` }}>
                      {title || 'Untitled'}
                    </h3>

                    {/* NEW RANK EDITOR ROW - Always in Edit Mode */}
                    {isEditMode && effectiveRankingId && (
                      <div className="flex items-center gap-2 py-1" onClick={e => e.stopPropagation()}>
                        <div 
                          className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shadow-2xl relative z-50"
                          onPointerDown={e => e.stopPropagation()}
                        >
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const r = Number(item.currentRank || currentRank) || 0;
                              if (r > 1) handleMove(r - 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-accent/20 rounded-lg hover:bg-accent/40 active:scale-75 transition-all text-accent"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="relative w-14 h-8">
                            <input 
                              type="number"
                              min="1"
                              key={`${id}-${item.currentRank || currentRank}`}
                              defaultValue={item.currentRank || currentRank}
                              onBlur={(e) => {
                                const newRank = parseInt(e.target.value);
                                const r = Number(item.currentRank || currentRank);
                                if (newRank > 0 && newRank !== r) handleMove(newRank);
                              }}
                              className="w-full h-full bg-accent text-black font-black text-center rounded-md text-sm focus:ring-2 focus:ring-white outline-none"
                            />
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const r = Number(item.currentRank || currentRank) || 0;
                              handleMove(r + 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-accent/20 rounded-lg hover:bg-accent/40 active:scale-75 transition-all text-accent"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-50">Rank Change</span>
                      </div>
                    )}
                    {localIsCollapsed && previousRanks.length > 0 && previousRanks[previousRanks.length - 1].rank !== currentRank && (
                      <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                        <History size={8} className="text-slate-500" />
                        <span className="text-[7px] font-bold text-slate-400">{previousRanks[previousRanks.length - 1].rank}位→</span>
                        <span className="text-[7px] font-black text-accent">{currentRank}位</span>
                      </div>
                    )}
                  </div>
                  {!localIsCollapsed && (
                    <div className="flex flex-col gap-1.5 mt-0.5">
                      <div className="flex items-center gap-3 pr-4">
                        {author && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[150px] pr-2">
                            {author}
                          </span>
                        )}
                      </div>

                      <div className="scale-90 origin-left">
                        <ScoreRating rating={rating} readOnly />
                      </div>
                    </div>
                  )}
                </div>

                {!localIsCollapsed && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 whitespace-nowrap overflow-hidden mt-1 pr-1">
                    {/* Quick Counter for Views */}
                    <div className="flex items-center gap-1 bg-black/20 rounded-full border border-white/5 p-0.5 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate(id, { views: Math.max(0, (views || 0) - 1) }); }}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Minus size={8} />
                      </button>
                      <span className={`flex items-center gap-1 text-[8px] font-mono px-0.5 ${currentRank === 1 ? 'text-yellow-100' : 'text-slate-400'}`}>
                        <Eye className={`w-2 h-2 ${currentRank === 1 ? 'text-yellow-300' : 'text-blue-500'}`} />
                        {views}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate(id, { views: (views || 0) + 1 }); }}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 hover:text-emerald-400 transition-colors"
                      >
                        <Plus size={8} />
                      </button>
                    </div>

                    {totalLifetimeDuration > 0 && (
                      <span className={`flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${currentRank === 1 ? 'bg-black/40 text-yellow-100 border-yellow-300/30' : 'bg-black/20 text-slate-400 border-white/5'}`}>
                        <Clock className={`w-2 h-2 ${currentRank === 1 ? 'text-yellow-200' : 'text-purple-500'}`} />
                        {effectiveGenre === 'game' ? totalLifetimeDuration.toFixed(1) : (totalLifetimeDuration / 60).toFixed(1)}h
                      </span>
                    )}
                    {formattedDate && (
                      <span className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-full border shrink-0 ${currentRank === 1 ? 'bg-black/40 text-yellow-100 border-yellow-300/30' : 'bg-black/20 text-slate-400 border-white/5'}`}>
                        <Calendar className={`w-2 h-2 ${currentRank === 1 ? 'text-yellow-300' : 'text-emerald-500'}`} />
                        {formattedDate}
                      </span>
                    )}
                  </div>
                )}

                {!localIsCollapsed && previousRanks.length > 0 && (
                  <div className={`flex items-center gap-2 mt-2 pt-1 border-t ${currentRank === 1 ? 'border-yellow-300/20' : 'border-white/5'}`}>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${currentRank === 1 ? 'bg-black/60 border-yellow-300/30' : 'bg-black/20 border-white/5'}`}>
                      <History size={10} className={currentRank === 1 ? "text-yellow-400" : "text-slate-600"} />
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {previousRanks.slice(-2).map((hist, hIdx) => (
                          <span key={hIdx} className={`text-[8px] font-black italic whitespace-nowrap ${currentRank === 1 ? 'text-yellow-200/60' : 'text-slate-500'}`}>
                            {hist.rank}位 <span className="mx-0.5 opacity-20">→</span>
                          </span>
                        ))}
                        <span className={`text-[8px] font-black italic whitespace-nowrap ${currentRank === 1 ? 'text-yellow-300' : 'text-accent'}`}>現在</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!localIsCollapsed && imageBase64 && (
              <div className="flex-shrink-0 p-1.5 pl-0 flex items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            
            <div className="flex items-center pr-1 gap-1">
              {(isReorderMode || dragHandleProps) && !isEditMode && (
                <div 
                  {...dragHandleProps} 
                  className="p-2 cursor-grab text-slate-700 hover:text-accent transition-colors active:scale-90"
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical size={16} />
                </div>
              )}
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
