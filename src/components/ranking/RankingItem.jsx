import { useState, useEffect, useRef, memo } from 'react';
import { useStore, getItemIndex } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, AlignLeft, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, MoreHorizontal, ChevronRight, ChevronDown, History, Plus, Minus, Star, Clock, CheckCircle2 } from 'lucide-react';
import RankingItemDetailModal from './RankingItemDetailModal';
import AddToRankingDialog from './AddToRankingDialog';
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

function RankingItem({ item: propItem, isEditMode, dragHandleProps, onUpdate, onMove, genre: propGenre, isCollapsed: propIsCollapsed = false, rankingId, isReorderMode = false, isSelectable = false, isSelectedForBulk = false, onToggleSelect = null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  // 順位変更後に移動先へスクロールするためのカード要素（タブの画面を保持しているので ID 検索だと非表示側を掴むことがある）
  const cardRef = useRef(null);
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
      // ランキング外の作品：押すとランキングと順位を選んで追加できる
      return (
        <button
          type="button"
          aria-label={`「${title || '作品'}」をランキングに追加`}
          onClick={(e) => { e.stopPropagation(); setIsAddOpen(true); }}
          className={`flex-shrink-0 self-start flex flex-col items-center justify-center border-2 border-dashed border-ink text-ink bg-white active:bg-ink active:text-white ${isActuallyCollapsed ? 'w-11' : w} ${isActuallyCollapsed ? 'min-h-[44px]' : 'min-h-[52px] py-1.5'}`}
        >
          {!isActuallyCollapsed && <span className="text-[8px] font-black tracking-[0.1em] leading-none">ADD</span>}
          <Plus size={isActuallyCollapsed ? 16 : 18} strokeWidth={3} />
        </button>
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
        const element = cardRef.current;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 移動先を一瞬強調する
          element.classList.add('ring-4', 'ring-coral');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-coral');
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
        ref={cardRef}
        data-item-id={id}
        className={`cv-card relative flex flex-col cursor-pointer transition-colors duration-150 ${isEditMode ? 'border-2 border-ink bg-white' : 'select-none border-t-[3px] border-ink bg-white pt-2.5 pb-1 active:bg-mist'}`}
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
            <div className="flex items-start justify-between gap-2">
              {renderRankBadge(currentRank)}
              {dragHandleProps && (
                <div {...dragHandleProps} aria-label="ドラッグして並び替え" className="flex-shrink-0 h-11 w-11 flex items-center justify-center cursor-grab text-ink border-2 border-ink active:bg-ink active:text-white" style={{ touchAction: 'none' }}>
                  <GripVertical className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Genre Row（横幅いっぱいに並べて1つあたりのタップ範囲を広く取る） */}
            <div className="grid grid-cols-6 gap-1" role="group" aria-label="ジャンル" onClick={e => e.stopPropagation()}>
              {GENRES.map(g => (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={effectiveGenre === g.id}
                  onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { genre: g.id }); }}
                  className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 border-[1.5px] ${effectiveGenre === g.id ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-line active:bg-mist'}`}
                >
                  <g.icon size={16} />
                  <span className="text-[9px] font-black leading-none">{g.label}</span>
                </button>
              ))}
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
                aria-label="作品名"
                className={`flex-1 min-w-0 w-0 min-h-[44px] bg-transparent border-b-2 border-ink focus:border-teal outline-none text-ink ${isBold ? 'font-black' : 'font-bold'}`} 
                style={{ color: readableTitleColor(color), fontSize: `${localFontSize}px` }} 
              />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAutoFetch(); }} 
                disabled={!localTitle?.trim() || isFetching} 
                aria-label="作品情報を自動取得"
                className={`flex-shrink-0 w-11 h-11 flex items-center justify-center border-2 ${fetchStatus === 'success' ? 'bg-teal border-teal text-white' : fetchStatus === 'error' ? 'bg-coral border-coral text-white' : 'bg-white border-ink text-ink active:bg-ink active:text-white'}`}
              >
                {isFetching ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>

            {/* Meta Row（枠全体が入力欄のタップ範囲になるよう label で包む） */}
            <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
              <label className="flex items-center gap-2 bg-mist px-2.5 min-h-[44px] border border-line cursor-text">
                <User className="w-4 h-4 text-muted flex-shrink-0" />
                <input 
                  type="text" 
                  value={localAuthor} 
                  onClick={e => e.stopPropagation()} 
                  onChange={e => setLocalAuthor(e.target.value)} 
                  onBlur={handleAuthorSync}
                  onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                  placeholder="作者名" 
                  aria-label="作者名"
                  className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" 
                />
              </label>
              <label className="flex items-center gap-2 bg-mist px-2.5 min-h-[44px] border border-line cursor-text">
                <Calendar className="w-4 h-4 text-muted flex-shrink-0" />
                <input 
                  type="date" 
                  value={toDateInputValue(createdAt)} 
                  onClick={e => e.stopPropagation()} 
                  onChange={e => onUpdate(propItem.id, { createdAt: fromDateInputValue(e.target.value) })} 
                  aria-label="日付"
                  className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" 
                />
              </label>
            </div>

            {/* Rank Change Row */}
            {(rankingId || liveItem.rankingId) && (
              <div className="flex items-center justify-between gap-2 bg-mist px-2.5 py-1.5 border border-line" onClick={e => e.stopPropagation()}>
                <span className="text-[11px] font-black text-muted">順位変更</span>
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    aria-label="順位を上げる"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const nextRank = Math.max(1, currentRank - 1);
                      handleMove(nextRank); 
                    }} 
                    className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white text-ink active:bg-ink active:text-white"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <input 
                    type="number"
                    inputMode="numeric"
                    min="1"
                    aria-label="順位"
                    key={`expanded-${id}-${currentRank}`}
                    defaultValue={currentRank}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0 && val !== currentRank) {
                        handleMove(val);
                      }
                    }}
                    className="w-14 h-11 bg-ink text-white font-fes text-center outline-none focus:ring-2 focus:ring-coral"
                  />
                  <button 
                    type="button"
                    aria-label="順位を下げる"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const nextRank = Math.min(100, currentRank + 1);
                      handleMove(nextRank); 
                    }} 
                    className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white text-ink active:bg-ink active:text-white"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2 bg-mist px-2.5 py-1.5 border border-line">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-muted"><Star size={13} />スコア</span>
                <ScoreRating rating={rating} onRatingChange={v => onUpdate(propItem.id, { rating: v })} />
              </div>
              <div className="flex items-center justify-between gap-2 bg-mist px-2.5 py-1.5 border border-line">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-muted"><Eye size={13} />閲覧回数</span>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="閲覧回数を減らす" onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { views: Math.max(0, views - 1) }) }} className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white active:bg-ink active:text-white"><Minus size={16} strokeWidth={3} /></button>
                  <span className="font-fes text-[15px] min-w-[28px] text-center">{views}</span>
                  <button type="button" aria-label="閲覧回数を増やす" onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { views: views + 1 }) }} className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white active:bg-ink active:text-white"><Plus size={16} strokeWidth={3} /></button>
                </div>
              </div>
            </div>

            {/* Time & Episodes Row */}
            <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
               <label className="bg-mist px-2.5 min-h-[44px] border border-line flex items-center gap-2 cursor-text">
                 <Clock className="w-4 h-4 text-muted flex-shrink-0" />
                 <input type="number" inputMode="decimal" min="0" aria-label="所要時間" value={duration || ''} onChange={e => onUpdate(propItem.id, { duration: e.target.value === '' ? 0 : (effectiveGenre === 'game' ? parseFloat(e.target.value) : parseInt(e.target.value)) })} className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" placeholder="所要時間" />
                 <span className="text-[11px] font-black text-muted flex-shrink-0">{effectiveGenre === 'game' ? '時間' : '分'}</span>
               </label>
               {(effectiveGenre === 'anime' || effectiveGenre === 'drama') && (
                 <label className="bg-mist px-2.5 min-h-[44px] border border-line flex items-center gap-2 cursor-text">
                   <Tv className="w-4 h-4 text-muted flex-shrink-0" />
                   <input type="number" inputMode="numeric" min="0" aria-label="話数" value={episodes || ''} onChange={e => onUpdate(propItem.id, { episodes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" placeholder="話数" />
                   <span className="text-[11px] font-black text-muted flex-shrink-0">話</span>
                 </label>
               )}
               {effectiveGenre === 'manga' && (
                 <label className="bg-mist px-2.5 min-h-[44px] border border-line flex items-center gap-2 cursor-text">
                   <BookOpen className="w-4 h-4 text-muted flex-shrink-0" />
                   <input type="number" inputMode="numeric" min="0" aria-label="巻数" value={volumes || ''} onChange={e => onUpdate(propItem.id, { volumes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" placeholder="巻数" />
                   <span className="text-[11px] font-black text-muted flex-shrink-0">巻</span>
                 </label>
               )}
            </div>

            {/* Styling Row */}
            <div className="flex items-center gap-2 bg-mist px-2.5 py-1.5 border border-line" onClick={e => e.stopPropagation()}>
              <Type className="w-4 h-4 text-muted flex-shrink-0" />
              <input 
                type="range" 
                min="12" 
                max="32" 
                aria-label="文字サイズ"
                value={localFontSize} 
                onClick={e => e.stopPropagation()}
                onChange={(e) => { const v = parseInt(e.target.value); setLocalFontSize(v); onUpdate(propItem.id, { fontSize: v }); }} 
                className="flex-1 min-w-0 h-11 accent-teal" 
              />
              <button type="button" aria-pressed={isBold} onClick={(e) => { e.stopPropagation(); onUpdate(propItem.id, { isBold: !isBold }); }} className={`flex-shrink-0 min-h-[44px] px-3 border-2 text-[11px] font-black ${isBold ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink'}`}>BOLD</button>
              <label className="flex-shrink-0 w-11 h-11 flex items-center justify-center border-2 border-ink bg-white cursor-pointer" title="文字色">
                <input type="color" aria-label="文字色" value={color} onClick={e => e.stopPropagation()} onChange={e => onUpdate(propItem.id, { color: e.target.value })} className="w-7 h-7 bg-transparent border-none cursor-pointer p-0" />
              </label>
            </div>

            {/* Image Row */}
            <div className="relative w-full aspect-video overflow-hidden border border-line bg-mist" onClick={e => e.stopPropagation()}>
               {imageBase64 ? <img loading="lazy" decoding="async" src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2"><ImageIcon className="w-8 h-8 opacity-40" /><span className="text-[10px] font-black">NO IMAGE</span></div>}
               <label className="absolute right-2 bottom-2 min-h-[44px] px-4 flex items-center gap-1.5 bg-ink text-white text-[12px] font-black cursor-pointer active:bg-teal">
                  <ImageIcon className="w-4 h-4" />画像を変更
                  <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
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
                className="flex-shrink-0 self-center p-2.5 -m-2.5"
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
                  <img loading="lazy" decoding="async" src={imageBase64} alt="" className="flex-shrink-0 w-[72px] h-[48px] object-cover" />
                )}
                {dragHandleProps && !isEditMode && (
                  <div
                    {...dragHandleProps}
                    className="flex-shrink-0 w-11 h-11 -my-1 flex items-center justify-center cursor-grab text-ink border-2 border-ink active:bg-ink active:text-white"
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
                        className="relative w-7 h-7 flex items-center justify-center border-[1.5px] border-ink active:bg-ink active:text-white after:content-[''] after:absolute after:-inset-2.5"
                      >
                        <Minus size={11} strokeWidth={3} />
                      </button>
                      <span className="font-fes text-[13px] min-w-[18px] text-center">{views}</span>
                      <button
                        type="button"
                        aria-label="閲覧回数を増やす"
                        onClick={(e) => { e.stopPropagation(); onUpdate(id, { views: (views || 0) + 1 }); }}
                        className="relative w-7 h-7 flex items-center justify-center border-[1.5px] border-ink active:bg-ink active:text-white after:content-[''] after:absolute after:-inset-2.5"
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
      {isAddOpen && <AddToRankingDialog item={liveItem} onClose={() => setIsAddOpen(false)} />}
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

// 並び替えのドラッグ中は一覧全体が毎フレーム再描画されるため、内容が変わらない作品カードは描画を省く
export default memo(RankingItem);
