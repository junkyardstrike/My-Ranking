import { useState, useEffect, useRef } from 'react';
import { useStore, getItemIndex } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, AlignLeft, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, MoreHorizontal, ChevronRight, ChevronDown, History, Plus, Minus, Star, Clock, CheckCircle2 } from 'lucide-react';
import RankingItemDetailModal from './RankingItemDetailModal';
import ScoreRating from './ScoreRating';
import { fetchMetadata } from '../../services/metadataFetcher';
import { getItemMetrics, toDateInputValue, fromDateInputValue } from '../../utils/itemMetrics';
import { readableTitleColor } from '../../utils/colors';

const GENRES = [
  { id: 'anime', label: 'アニメ', icon: Tv },
  { id: 'manga', label: '漫画', icon: BookOpen },
  { id: 'movie', label: '映画', icon: Film },
  { id: 'drama', label: 'ドラマ', icon: Clapperboard },
  { id: 'game', label: 'ゲーム', icon: Gamepad2 },
  { id: 'music', label: '音楽', icon: Music },
];

const GENRE_COLORS = {
  anime: '#0a7a6f', manga: '#c13b7a', movie: '#ff5a3c', drama: '#e2a400', game: '#3c5bd6', music: '#7a8a89'
};

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
  const settings = useStore(state => state.settings);

  useEffect(() => {
    setLocalIsCollapsed(propIsCollapsed);
  }, [propIsCollapsed]);

  // Subscribe to live store updates for this specific item
  const liveItemFromStore = useStore(state => getItemIndex(state).get(propItem.id));

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

  const { totalHours: lifetimeHours } = getItemMetrics({ ...liveItem, genre: effectiveGenre }, settings);

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
        const duplicateDetails = duplicateItems.map(item => {
          const gLabel = GENRE_LABELS[item.genre] || item.genre;
          const rTitle = item.rankingTitle || 'レコード一覧';
          return `・「${gLabel}」の「${rTitle}」`;
        });
        
        const detailString = duplicateDetails.join('\n');
        
        if (!confirm(`【重複注意】\n「${localTitle}」は既に以下の場所に登録されています：\n\n${detailString}\n\nこのまま登録しますか？`)) {
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

  // 順位の表示（映画祭の上映枠「SLOT」）。1〜3位はコーラル、ランキング外は点線の「追加」
  const renderRankBadge = (rank) => {
    const isActuallyCollapsed = localIsCollapsed;
    const w = isActuallyCollapsed ? 'w-10' : 'w-[54px]';
    if (!rank || !effectiveRankingId) {
      return (
        <div className={`flex-shrink-0 self-start flex flex-col items-center justify-center border-2 border-dashed border-ink text-ink ${w} ${isActuallyCollapsed ? 'py-1' : 'py-1.5'}`}>
          {!isActuallyCollapsed && <span className="text-[8px] font-black tracking-[0.1em] leading-none">ADD</span>}
          <Plus size={isActuallyCollapsed ? 14 : 18} strokeWidth={3} />
        </div>
      );
    }
    const isTop = rank <= 3;
    return (
      <div className={`flex-shrink-0 self-start flex flex-col items-center justify-center text-white ${isTop ? 'bg-coral' : 'bg-ink'} ${w} ${isActuallyCollapsed ? 'py-1' : 'py-1.5'}`}>
        {!isActuallyCollapsed && (
          <span className="flex items-center gap-0.5 text-[8px] font-black tracking-[0.1em] leading-none mb-0.5">
            {isTop && <Crown size={9} fill="currentColor" />}SLOT
          </span>
        )}
        <span className={`font-fes leading-none ${isActuallyCollapsed ? 'text-[15px]' : rank >= 100 ? 'text-[17px]' : 'text-[22px]'}`}>{String(rank).padStart(2, '0')}</span>
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
      useStore.getState().moveItemToRank(rankingId || liveItem.rankingId, id, newRank);
    }
  };

  return (
    <>
      <div 
        id={`ranking-item-${id}`}
        className={`relative flex flex-col cursor-pointer transition-colors duration-150 ${isEditMode ? 'border-2 border-ink bg-white' : 'select-none border-t-[3px] border-ink bg-white pt-2.5 pb-1 active:bg-mist'}`}
        onClick={(e) => {
          if (isReorderMode && dragHandleProps) return;
          // ポータル内(詳細モーダル)からバブリングしてきたクリックは無視
          if (!e.currentTarget.contains(e.target)) return;
          // カード内のボタンや入力欄などの操作ではモーダルを開かない
          if (e.target.closest('button, input, textarea, select, label, a, [role="button"]')) return;
          setIsModalOpen(true);
        }}
      >
        {isEditMode ? (
          <div className="flex flex-col p-3 gap-3 min-w-0">
            {/* Header Row */}
            <div className="flex items-start gap-2">
              {renderRankBadge(currentRank)}
              <div className="flex-1 min-w-0 grid grid-cols-6 gap-1" role="group" aria-label="ジャンル">
                {GENRES.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    title={g.label}
                    aria-pressed={effectiveGenre === g.id}
                    onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { genre: g.id }); }}
                    className={`h-9 flex items-center justify-center border-[1.5px] ${effectiveGenre === g.id ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-line active:bg-mist'}`}
                  >
                    <g.icon size={16} />
                  </button>
                ))}
              </div>
              {dragHandleProps && (
                <div {...dragHandleProps} className="flex-shrink-0 h-9 w-9 flex items-center justify-center cursor-grab text-ink border-2 border-ink active:bg-ink active:text-white" style={{ touchAction: 'none' }}>
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
                className={`flex-1 bg-transparent border-b border-line focus:border-accent outline-none text-ink pb-1  tracking-tight ${isBold ? 'font-black' : 'font-bold'}`} 
                style={{ color: readableTitleColor(color), fontSize: `${localFontSize}px` }} 
              />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAutoFetch(); }} 
                disabled={!localTitle?.trim() || isFetching} 
                className={`p-2.5 rounded border transition-all  active:scale-90 ${fetchStatus === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : fetchStatus === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-mist border-accent text-accent'}`}
              >
                {isFetching ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>

            {/* Meta Row */}
            <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 bg-mist p-2.5 rounded border border-line active:bg-mist transition-colors">
                <User className="w-3.5 h-3.5 text-accent" />
                <input 
                  type="text" 
                  value={localAuthor} 
                  onClick={e => e.stopPropagation()} 
                  onChange={e => setLocalAuthor(e.target.value)} 
                  onBlur={handleAuthorSync}
                  onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                  placeholder="作者名" 
                  className="bg-transparent border-none outline-none text-ink text-[10px] font-bold w-full h-full" 
                />
              </div>
              <div className="flex items-center gap-2 bg-mist p-2.5 rounded border border-line">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <input 
                  type="date" 
                  value={toDateInputValue(createdAt)} 
                  onClick={e => e.stopPropagation()} 
                  onChange={e => onUpdate(propItem.id, { createdAt: fromDateInputValue(e.target.value) })} 
                  className="bg-transparent border-none outline-none text-ink text-[10px] font-bold w-full" 
                />
              </div>
            </div>

            {/* Rank Change Row - Between Meta and Metrics */}
            {(rankingId || liveItem.rankingId) && (
              <div className="flex items-center gap-4 bg-mist p-3 rounded-sm border border-line" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] pr-2">順位変更 / RANK</span>
                  <div className="flex items-center gap-1 bg-mist p-1 rounded border border-accent">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextRank = Math.max(1, currentRank - 1);
                        handleMove(nextRank); 
                      }} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-mist text-accent hover:bg-mist active:scale-75 transition-all"
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
                        className="w-full h-full bg-accent text-white font-black text-center rounded-md text-sm outline-none focus:ring-2 focus:ring-white"
                      />
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextRank = Math.min(100, currentRank + 1);
                        handleMove(nextRank); 
                      }} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-mist text-accent hover:bg-mist active:scale-75 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
              <div className="space-y-3 text-center flex-1 bg-mist p-2.5 rounded border border-line">
                <p className="text-[9px] text-muted font-black uppercase tracking-widest flex items-center justify-center gap-2"><Star size={10} className="text-accent" /> SCORE</p>
                <div className="flex justify-center">
                   <ScoreRating rating={rating} onRatingChange={v => onUpdate(propItem.id, { rating: v })} />
                </div>
              </div>
              <div className="flex items-center gap-3 bg-mist p-2.5 rounded border border-line">
                 <Eye className="w-3.5 h-3.5 text-blue-500" />
                 <div className="flex items-center gap-2 flex-1">
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { views: Math.max(0, views - 1) }) }} className="w-8 h-8 bg-mist active:bg-mist rounded-lg text-sm text-muted">-</button>
                    <span className="text-[11px] font-mono font-bold text-ink flex-1 text-center">{views}</span>
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { views: views + 1 }) }} className="w-8 h-8 bg-mist active:bg-mist rounded-lg text-sm text-muted">+</button>
                 </div>
              </div>
            </div>

            {/* Time & Episodes Row */}
            <div className="grid grid-cols-2 gap-3" onClick={e => e.stopPropagation()}>
               <div className="bg-mist p-2.5 rounded border border-line flex items-center gap-2 active:bg-mist transition-colors active:scale-[0.98]">
                 <Clock className="w-3.5 h-3.5 text-purple-500" />
                 <input type="number" min="0" value={duration || ''} onChange={e => onUpdate(propItem.id, { duration: e.target.value === '' ? 0 : (effectiveGenre === 'game' ? parseFloat(e.target.value) : parseInt(e.target.value)) })} className="bg-transparent border-none outline-none text-ink text-[10px] font-bold w-full" placeholder="所要時間" />
                 <span className="text-[8px] font-black text-muted uppercase tracking-widest">{effectiveGenre === 'game' ? '時間' : '分'}</span>
               </div>
               {(effectiveGenre === 'anime' || effectiveGenre === 'drama') && (
                 <div className="bg-mist p-2.5 rounded border border-line flex items-center gap-2 active:bg-mist transition-colors active:scale-[0.98]">
                   <Tv className="w-3.5 h-3.5 text-muted" />
                   <input type="number" min="0" value={episodes || ''} onChange={e => onUpdate(propItem.id, { episodes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-ink text-[10px] font-bold w-full" placeholder="話数" />
                   <span className="text-[8px] font-black text-muted uppercase tracking-widest">話</span>
                 </div>
               )}
               {effectiveGenre === 'manga' && (
                 <div className="bg-mist p-2.5 rounded border border-line flex items-center gap-2 active:bg-mist transition-colors active:scale-[0.98]">
                   <BookOpen className="w-3.5 h-3.5 text-muted" />
                   <input type="number" min="0" value={volumes || ''} onChange={e => onUpdate(propItem.id, { volumes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-ink text-[10px] font-bold w-full" placeholder="巻数" />
                   <span className="text-[8px] font-black text-muted uppercase tracking-widest">巻</span>
                 </div>
               )}
            </div>

            {/* Styling Row */}
            <div className="flex items-center gap-4 bg-mist p-2.5 rounded border border-line" onClick={e => e.stopPropagation()}>
              <div className="flex-1 flex items-center gap-3">
                <Type className="w-4 h-4 text-muted" />
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
              <button onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { isBold: !isBold }); }} className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-widest ${isBold ? 'bg-accent text-white border-accent' : 'bg-mist text-muted border-line'}`}>BOLD</button>
              <input type="color" value={color} onClick={e => e.stopPropagation()} onChange={e => onUpdate(propItem.id, { color: e.target.value })} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
            </div>

            {/* Image Row */}
            <div className="relative w-full aspect-video rounded-sm overflow-hidden border border-line bg-mist group" onClick={e => e.stopPropagation()}>
               {imageBase64 ? <img src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-ink/40 gap-2"><ImageIcon className="w-8 h-8 opacity-20" /><span className="text-[9px] font-black tracking-widest opacity-20">NO IMAGE</span></div>}
               <label className="absolute inset-0 bg-mist opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <div className="bg-accent text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Update Image</div>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
               </label>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            {isSelectable && (
              <button
                type="button"
                aria-pressed={isSelectedForBulk}
                aria-label={isSelectedForBulk ? '選択を外す' : '選択する'}
                className="flex-shrink-0 self-center p-1 -m-1"
                onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(id); }}
              >
                <span className={`w-6 h-6 border-2 border-ink flex items-center justify-center ${isSelectedForBulk ? 'bg-ink' : 'bg-white'}`}>
                  {isSelectedForBulk && <CheckCircle2 className="w-4 h-4 text-white" />}
                </span>
              </button>
            )}
            {renderRankBadge(currentRank)}

            <div className="flex-1 min-w-0 grid gap-1.5">
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <h3
                    className={`leading-tight break-words ${localIsCollapsed ? 'truncate' : ''} ${isBold ? 'font-black' : 'font-bold'}`}
                    style={{ color: readableTitleColor(color), fontSize: localIsCollapsed ? '14px' : `${fontSize}px` }}
                  >
                    {title || 'Untitled'}
                  </h3>
                  {!localIsCollapsed && author && (
                    <p className="text-[11px] text-muted font-bold truncate mt-0.5">{author}</p>
                  )}
                  {localIsCollapsed && previousRanks.length > 0 && previousRanks[previousRanks.length - 1].rank !== currentRank && (
                    <p className="text-[10px] text-muted font-bold mt-0.5">
                      <History size={9} className="inline -mt-0.5 mr-0.5" />{previousRanks[previousRanks.length - 1].rank}位 → <span className="text-coral">{currentRank}位</span>
                    </p>
                  )}
                </div>
                {!localIsCollapsed && imageBase64 && (
                  <img src={imageBase64} alt="" className="flex-shrink-0 w-[72px] h-[48px] object-cover" />
                )}
                {dragHandleProps && !isEditMode && (
                  <div
                    {...dragHandleProps}
                    className="flex-shrink-0 p-2 -my-1 -mr-1 cursor-grab text-ink border-2 border-ink active:bg-ink active:text-white"
                    style={{ touchAction: 'none' }}
                  >
                    <GripVertical size={16} />
                  </div>
                )}
              </div>

              {!localIsCollapsed && (
                <>
                  <div className="flex flex-wrap gap-1">
                    <span className="fes-tag text-white" style={{ backgroundColor: GENRE_COLORS[effectiveGenre], borderColor: GENRE_COLORS[effectiveGenre] }}>
                      {GENRE_LABELS[effectiveGenre] || effectiveGenre}
                    </span>
                    {(effectiveGenre === 'manga' || effectiveGenre === 'anime' || effectiveGenre === 'drama') && (
                      <span className="fes-tag">{effectiveGenre === 'manga' ? `全${volumes || 1}巻` : `全${episodes || 1}話`}</span>
                    )}
                    <span className="fes-tag font-fes">{rating}pt</span>
                    {lifetimeHours > 0 && (
                      <span className="fes-tag"><Clock className="w-2.5 h-2.5 mr-0.5" />{lifetimeHours.toFixed(1)}h</span>
                    )}
                    {formattedDate && (
                      <span className="fes-tag"><Calendar className="w-2.5 h-2.5 mr-0.5" />{formattedDate}</span>
                    )}
                  </div>

                  <div className="h-1 bg-mist" aria-label={`スコア ${rating}点`}>
                    <div className="h-full bg-teal" style={{ width: `${Math.max(0, Math.min(100, rating))}%` }} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted" />
                      <span className="text-muted">閲覧</span>
                      <button
                        type="button"
                        aria-label="閲覧回数を減らす"
                        onClick={(e) => { e.stopPropagation(); onUpdate(id, { views: Math.max(0, (views || 0) - 1) }); }}
                        className="relative w-6 h-6 flex items-center justify-center border-[1.5px] border-ink active:bg-ink active:text-white after:content-[''] after:absolute after:-inset-1.5"
                      >
                        <Minus size={11} strokeWidth={3} />
                      </button>
                      <span className="font-fes text-[13px] min-w-[18px] text-center">{views}</span>
                      <button
                        type="button"
                        aria-label="閲覧回数を増やす"
                        onClick={(e) => { e.stopPropagation(); onUpdate(id, { views: (views || 0) + 1 }); }}
                        className="relative w-6 h-6 flex items-center justify-center border-[1.5px] border-ink active:bg-ink active:text-white after:content-[''] after:absolute after:-inset-1.5"
                      >
                        <Plus size={11} strokeWidth={3} />
                      </button>
                    </span>
                    {previousRanks.length > 0 && (
                      <span className="flex items-center gap-1 text-muted min-w-0">
                        <History size={11} className="flex-shrink-0" />
                        {previousRanks.slice(-2).map((hist, hIdx) => (
                          <span key={hIdx} className="whitespace-nowrap">{hist.rank}位 →</span>
                        ))}
                        <span className="text-coral whitespace-nowrap">現在</span>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {/* 開いている時だけマウントする（一覧の全カードがモーダル分の処理を抱えないように） */}
      {isModalOpen && <RankingItemDetailModal 
        item={liveItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUpdate={onUpdate}
        onMove={onMove}
        rankingId={rankingId || liveItem.rankingId}
      />}
    </>
  );
}
