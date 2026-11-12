import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Eye, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, Copy, History, MoreHorizontal, Type, Sparkles, Loader, Trash2, Plus, Minus, Clock } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore, getItemIndex } from '../../store/useStore';
import { fetchMetadata } from '../../services/metadataFetcher';
import { readableTitleColor } from '../../utils/colors';
import { getItemMetrics, normalizeGenre, toDateInputValue, fromDateInputValue } from '../../utils/itemMetrics';

const GENRE_MAP = {
  anime: { label: 'アニメ', icon: Tv },
  manga: { label: '漫画', icon: BookOpen },
  movie: { label: '映画', icon: Film },
  drama: { label: 'ドラマ', icon: Clapperboard },
  game: { label: 'ゲーム', icon: Gamepad2 },
  music: { label: '音楽', icon: Music },
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

export default function RankingItemDetailModal({ item: propItem, isOpen, onClose, onUpdate, onMove, rankingId: propRankingId }) {
  const isGlobalEditMode = useStore(state => state.isEditMode);
  const setEditMode = useStore(state => state.setEditMode);
  const rankings = useStore(state => state.rankings);
  const insertItemIntoRanking = useStore(state => state.insertItemIntoRanking);
  const updateItemStore = useStore(state => state.updateItem);
  const moveItemToRank = useStore(state => state.moveItemToRank);
  const settings = useStore(state => state.settings);

  const itemFromStore = useStore(useCallback(state => getItemIndex(state).get(propItem?.id), [propItem?.id]));

  const liveItem = itemFromStore || propItem;

  const [draftItem, setDraftItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingToRanking, setIsAddingToRanking] = useState(false);
  const [selectedRankingId, setSelectedRankingId] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  // モーダルを開いた時点の編集モード。閉じたらこの状態に戻す（一覧側の編集モードを勝手にOFFにしない）
  const editModeOnOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && liveItem) {
      setDraftItem({ ...liveItem });
      setHasChanges(false);
      editModeOnOpenRef.current = useStore.getState().isEditMode;
    }
  }, [isOpen, liveItem?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setIsAddingToRanking(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, liveItem?.id]);

  if (!isOpen || !draftItem) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre: rawGenre, isBold = false, color = '#ffffff', fontSize = 20, duration, episodes = 1, volumes = 1 } = draftItem;

  const genre = normalizeGenre(rawGenre);
  const { unitDuration, hasOwnDuration, viewCount: finalViewCount, totalHours: totalLifetimeHours } = getItemMetrics({ ...draftItem, genre }, settings);
  const baseDuration = hasOwnDuration ? Number(duration) : null;

  const handleUpdate = (updates) => {
    setDraftItem(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!draftItem) return;
    if (onUpdate) {
      onUpdate(id, draftItem);
    } else {
      updateItemStore(id, draftItem);
    }
    setHasChanges(false);
    setEditMode(editModeOnOpenRef.current);
    onClose();
  };

  const handleAddToRanking = () => {
    if (!selectedRankingId) return;
    if (window.confirm(`${Math.max(1, Math.min(100, parseInt(selectedRank) || 1))}位に挿入します。よろしいですか？`)) {
      const rank = Math.max(1, Math.min(100, parseInt(selectedRank) || 1));
      insertItemIntoRanking(selectedRankingId, liveItem, rank);
      setIsAddingToRanking(false);
      setEditMode(editModeOnOpenRef.current);
      onClose();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        handleUpdate({ imageBase64: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoFetch = async () => {
    if (!draftItem.title || !draftItem.title.trim() || isFetching) return;
    setIsFetching(true);
    try {
      const result = await fetchMetadata(draftItem.title.trim(), genre);
      if (result) {
        const updates = { memo: result.memo, author: result.author || author };
        
        if (result.memo) {
          const currentGenre = genre || 'music';
          if (currentGenre === 'manga') {
            const volMatch = result.memo.match(/VOLUMES:\s*全?(\d+)巻/i) || result.memo.match(/全(\d+)巻/) || result.memo.match(/(\d+)巻/);
            if (volMatch && volMatch[1]) updates.volumes = parseInt(volMatch[1]);
          } else if (currentGenre === 'anime' || currentGenre === 'drama') {
            const epMatch = result.memo.match(/EPISODES:\s*(\d+)話/i) || result.memo.match(/全(\d+)話/) || result.memo.match(/(\d+)話/);
            if (epMatch && epMatch[1]) updates.episodes = parseInt(epMatch[1]);
          }
        }
        
        handleUpdate(updates);
      }
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  const handleTitleSync = () => {
    const newTitle = draftItem.title;
    if (newTitle !== title && newTitle.trim() !== '') {
      const allItems = useStore.getState().getAllItems();
      const duplicateItems = allItems.filter(item => 
        item.id !== id && 
        item.title?.toLowerCase().trim() === newTitle.toLowerCase().trim()
      );

      if (duplicateItems.length > 0) {
        const GENRE_LABELS = {
          anime: 'アニメ', manga: '漫画', movie: '映画', drama: 'ドラマ', game: 'ゲーム', music: '音楽'
        };
        
        const duplicateDetails = duplicateItems.map(item => {
          const gLabel = GENRE_LABELS[item.genre] || item.genre;
          const rTitle = item.rankingTitle || 'レコード一覧';
          return `・「${gLabel}」の「${rTitle}」`;
        });
        
        const detailString = duplicateDetails.join('\n');
        
        if (!confirm(`【重複注意】\n「${newTitle}」は既に以下の場所に登録されています：\n\n${detailString}\n\nこのまま登録しますか？`)) {
          handleUpdate({ title: title || '' });
          return;
        }
      }
    }
  };

  const handleCopy = () => {
    const text = `${title}\n${author ? `by ${author}\n` : ''}\n${memo || ''}`;
    navigator.clipboard.writeText(text);
    alert('作品情報をコピーしました');
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!window.confirm('変更が保存されていません。破棄して閉じますか？')) {
        return;
      }
    }
    setEditMode(editModeOnOpenRef.current);
    onClose();
  };

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.music;
  const GenreIcon = genreInfo.icon;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-0 sm:p-6 duration-300">
      <div className="absolute inset-0 bg-ink/60 cursor-pointer" onClick={handleClose} aria-hidden="true" />
      
      <div className="relative w-full max-w-5xl bg-white border-x border-line sm:rounded-sm overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[94vh] duration-300">
        
        
        {/* 全画面表示のため、上端は iPhone のステータスバー分を空ける（ボタンが重なって押せなくなるのを防ぐ） */}
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-[max(8px,env(safe-area-inset-top))] sm:pt-2 border-b-[3px] border-ink bg-white z-[100]">
          <div className="flex items-center gap-2 min-w-0">
             <button 
               type="button"
               aria-pressed={isGlobalEditMode}
               onClick={() => setEditMode(!useStore.getState().isEditMode)} 
               className="flex items-center gap-2 h-11 px-2 active:bg-mist"
             >
                <span className={`text-[12px] font-black ${isGlobalEditMode ? 'text-ink' : 'text-muted'}`}>編集モード</span>
                <span className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${isGlobalEditMode ? 'bg-teal' : 'bg-line'}`}>
                   <span className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 ${isGlobalEditMode ? 'translate-x-4' : ''}`} />
                </span>
            </button>
            {hasChanges && (
              <button 
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 h-11 px-3 bg-coral text-white font-black text-[12px] border-2 border-ink active:bg-ink whitespace-nowrap"
              >
                <CheckCircle2 size={15} /> 変更を保存
              </button>
            )}
          </div>
          <button 
            type="button"
            aria-label="閉じる"
            onClick={handleClose} 
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-white border-2 border-ink text-ink active:bg-ink active:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-[env(safe-area-inset-bottom)]">
          <div className="relative w-full aspect-video sm:aspect-[24/10] bg-black group z-0">
             {imageBase64 ? <img loading="lazy" decoding="async" src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={60} className="opacity-10" /></div>}
             {isGlobalEditMode && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                   <label 
                     htmlFor={`modal-upload-${id}`}
                     className="flex items-center gap-1.5 min-h-[44px] px-5 bg-ink text-white text-[13px] font-black border-2 border-white cursor-pointer pointer-events-auto active:bg-teal"
                   >
                     画像を更新
                   </label>
                   <input 
                     id={`modal-upload-${id}`}
                     type="file" 
                     accept="image/*" 
                     className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto" 
                     onChange={handleImageUpload} 
                   />
                </div>
             )}
             <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface/100 via-surface/40 to-transparent" />
          </div>

          <div className="px-6 pb-12 sm:px-12 -mt-16 relative z-10 space-y-4">
            <div className="mb-2">
               {isGlobalEditMode ? (
                 <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={title || ''} 
                      onChange={e => handleUpdate({ title: e.target.value })} 
                      onBlur={handleTitleSync}
                      className="flex-1 bg-transparent border-b border-line focus:border-accent outline-none text-ink text-3xl sm:text-5xl font-black pb-1" 
                      placeholder="作品名..." 
                    />
                    <button 
                      type="button"
                      onClick={handleAutoFetch} 
                      disabled={isFetching} 
                      className="p-3 rounded bg-accent text-white hover:scale-105 transition-all active:scale-90"
                    >
                       {isFetching ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                 </div>
               ) : (
                 <h2 className="text-4xl sm:text-6xl font-black text-ink leading-none flex items-center flex-wrap gap-y-4 pr-6" style={{ color: readableTitleColor(color) }}>
                   {title || 'Untitled'}
                 </h2>
               )}
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {(rankingId || propRankingId) ? (
                      <div className="px-5 py-2.5 bg-accent text-white font-black text-xs uppercase tracking-[0.2em] rounded flex items-center gap-2 border border-line">
                        <Crown size={16} /> Rank {currentRank}
                      </div>
                    ) : isSelected && (
                      <div className="px-5 py-2.5 bg-mist border border-accent text-accent font-black text-xs uppercase tracking-[0.2em] rounded shadow-sm flex items-center gap-2">
                        <Crown size={16} /> 選出済み
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-mist border border-line rounded-sm p-1.5 flex items-center gap-1">
                         {isGlobalEditMode ? (
                            Object.entries(GENRE_MAP).map(([key, info]) => {
                               const Icon = info.icon;
                               const isSelectedGenre = genre === key;
                               return (
                                 <button 
                                   key={key} 
                                   type="button"
                                   onClick={() => handleUpdate({ genre: key })}
                                   aria-pressed={isSelectedGenre}
                                   title={info.label}
                                   className={`flex items-center justify-center gap-1.5 min-w-[44px] h-11 px-2.5 border-[1.5px] ${isSelectedGenre ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-line active:bg-mist'}`}
                                 >
                                    <Icon size={16} />
                                    {isSelectedGenre && <span className="text-[10px] font-black uppercase tracking-widest">{info.label}</span>}
                                 </button>
                               );
                            })
                         ) : (
                            <div className="flex items-center gap-3 px-5 py-1.5 text-accent">
                               <GenreIcon size={20} />
                               <span className="text-xs font-black uppercase tracking-[0.2em]">{genreInfo.label}</span>
                            </div>
                         )}
                      </div>

                      {!isGlobalEditMode && (genre === 'manga' || genre === 'anime' || genre === 'drama') && (
                        <div className="bg-mist border border-line rounded-sm px-5 py-2.5 flex items-center gap-3">
                           <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                             {genre === 'manga' ? 'VOLS' : 'EPS'}
                           </span>
                           <span className="text-sm font-black text-ink font-mono">
                             {genre === 'manga' ? `全${volumes || 1}巻` : `全${episodes || 1}話`}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pl-1 pt-6 border-t border-line mt-2">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-sm bg-mist flex items-center justify-center border border-accent">
                         <User size={24} className="text-accent" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-1">作者 / AUTHOR</span>
                         {isGlobalEditMode ? (
                            <input 
                              type="text" 
                              value={author || ''} 
                              onChange={e => handleUpdate({ author: e.target.value })} 
                              className="bg-mist border border-line rounded px-4 py-2 text-sm font-black text-ink outline-none focus:border-accent w-full sm:w-[240px]" 
                              placeholder="作者名" 
                            />
                         ) : (
                            <span className="text-xl font-black text-ink tracking-wider leading-none">
                              {author || '---'}
                            </span>
                         )}
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-sm bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                         <Calendar size={24} className="text-emerald-400" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-1">作成日 / DATE</span>
                         {isGlobalEditMode ? (
                            <input type="date" value={toDateInputValue(createdAt)} onChange={e => handleUpdate({ createdAt: fromDateInputValue(e.target.value) })} className="bg-mist border border-line rounded px-4 py-2 text-xs font-black text-ink outline-none focus:border-accent" />
                         ) : (
                            <span className="text-xl font-black text-ink tracking-widest leading-none">
                              {createdAt ? new Date(createdAt).toLocaleDateString('ja-JP') : '---'}
                            </span>
                         )}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                   <div className="lg:col-span-5 space-y-6">
                      <div className="bg-mist p-6 rounded-sm border border-line grid grid-cols-1 gap-6 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
                         
                         <div className="flex flex-col sm:flex-row items-center justify-between relative z-10 gap-6 sm:gap-4">
                            <div className="space-y-3">
                               <p className="text-[10px] text-ink font-black uppercase tracking-[0.2em] flex items-center justify-center sm:justify-start gap-2"><Star size={12} className="text-accent" /> スコア / SCORE</p>
                               <div className="flex justify-center sm:justify-start w-full scale-110 sm:scale-125 origin-center sm:origin-left">
                                  <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                               </div>
                            </div>
                            
                            <div className="flex flex-col items-center space-y-2 flex-1 w-full sm:w-auto">
                               <p className="text-[10px] text-ink font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Eye size={12} className="text-blue-500" /> 
                                 {genre === 'game' ? 'プレイ回数 / PLAYS' : '閲覧回数 / VIEWS'}
                               </p>
                               {isGlobalEditMode ? (
                                  <div className="flex items-center gap-2">
                                     <button 
                                       type="button"
                                       aria-label="閲覧回数を減らす"
                                       onClick={() => handleUpdate({ views: Math.max(0, views - 1) })}
                                       className="w-11 h-11 flex items-center justify-center bg-white border-2 border-ink text-ink active:bg-ink active:text-white"
                                     ><Minus size={16} strokeWidth={3} /></button>
                                     <span className="font-mono font-black text-2xl w-12 text-center">{views}</span>
                                     <button 
                                       type="button"
                                       aria-label="閲覧回数を増やす"
                                       onClick={() => handleUpdate({ views: views + 1 })}
                                       className="w-11 h-11 flex items-center justify-center bg-white border-2 border-ink text-ink active:bg-ink active:text-white"
                                     ><Plus size={16} strokeWidth={3} /></button>
                                  </div>
                               ) : (
                                  <p className="text-3xl font-black text-ink font-mono text-center">{views.toLocaleString()}回</p>
                               )}
                            </div>
                         </div>

                         <div className="relative z-10 pt-6 border-t border-line flex flex-col items-center gap-3">
                            <p className="text-[10px] text-ink font-black uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={12} className="text-purple-500" /> 累計所要時間 / TOTAL TIME</p>
                            <div className="flex items-baseline gap-2">
                               <p className="text-5xl font-black text-ink font-mono">
                                 {totalLifetimeHours.toFixed(1)}
                               </p>
                               <p className="text-sm font-black text-muted uppercase tracking-widest">時間 / HOURS</p>
                            </div>
                            <div className="w-full bg-mist px-4 py-3 rounded-sm border border-line flex items-center justify-center gap-3">
                               <span className="text-[11px] sm:text-[13px] font-black text-accent tracking-widest uppercase">
                                  {genre === 'game' ? (
                                    `${unitDuration}時間 × ${finalViewCount}回`
                                  ) : (genre === 'manga' || genre === 'anime' || genre === 'drama') ? (
                                    `${unitDuration}分 × ${genre === 'manga' ? (volumes || 1) + '巻' : (episodes || 1) + '話'} × ${finalViewCount}回`
                                  ) : (
                                    `${unitDuration}分 × ${finalViewCount}回`
                                  )}
                               </span>
                            </div>
                         </div>
                      </div>

                      {isGlobalEditMode && (
                         <div className="bg-mist p-6 rounded-sm border border-line space-y-6">
                            <p className="text-[10px] text-ink font-black uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> 詳細設定 / DETAILS</p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">
                                    {genre === 'game' ? '所要時間 (時間)' : '時間 (分)'}
                                  </label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step={genre === 'game' ? '0.1' : '1'}
                                    value={baseDuration === null ? '' : baseDuration} 
                                    onChange={e => handleUpdate({ duration: e.target.value === '' ? '' : (genre === 'game' ? parseFloat(e.target.value) : parseInt(e.target.value)) })} 
                                    className="w-full bg-mist border border-line rounded px-4 py-2.5 text-ink font-mono text-sm outline-none focus:border-accent touch-manipulation" 
                                    placeholder={unitDuration.toString()} 
                                  />
                               </div>
                               {(genre === 'anime' || genre === 'drama' || genre === 'manga') && (
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">{genre === 'manga' ? '巻数' : '話数'}</label>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={genre === 'manga' ? (volumes === 0 || volumes === undefined ? '' : volumes) : (episodes === 0 || episodes === undefined ? '' : episodes)} 
                                      onChange={e => handleUpdate({ [genre === 'manga' ? 'volumes' : 'episodes']: e.target.value === '' ? '' : parseInt(e.target.value) })} 
                                      className="w-full bg-mist border border-line rounded px-4 py-2.5 text-ink font-mono text-sm outline-none focus:border-accent touch-manipulation" 
                                      placeholder="1" 
                                    />
                                 </div>
                               )}
                            </div>
                         </div>
                      )}

                      {isGlobalEditMode && (
                         <div className="bg-mist p-6 rounded-sm border border-line space-y-6">
                            <p className="text-[10px] text-ink font-black uppercase tracking-widest flex items-center gap-2"><Type size={14} /> スタイルカスタマイズ / STYLE</p>
                            <div className="flex items-center gap-6">
                               <div className="flex-1 space-y-2">
                                  <div className="flex justify-between">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">サイズ</label>
                                    <span className="text-[10px] font-mono font-black text-accent">{fontSize}px</span>
                                  </div>
                                  <input type="range" min="14" max="100" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-800 accent-accent rounded-full appearance-none cursor-pointer" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block text-center">カラー</label>
                                  <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-12 h-12 rounded bg-transparent border-none cursor-pointer p-0" />
                               </div>
                            </div>
                            <button type="button" onClick={() => handleUpdate({ isBold: !isBold })} className={`w-full py-4 rounded-sm border font-black text-[11px] tracking-[0.3em] transition-all uppercase ${isBold ? 'bg-accent text-white border-accent' : 'bg-mist text-ink border-line'}`}>
                               太字設定: {isBold ? 'ON' : 'OFF'}
                            </button>
                         </div>
                      )}

                      {!isSelected && !(rankingId || propRankingId) && (
                        <div className="bg-mist border border-accent p-6 rounded-sm space-y-4">
                           {!isAddingToRanking ? (
                             <button 
                               type="button"
                               onClick={() => setIsAddingToRanking(true)}
                               className="w-full py-5 rounded-sm bg-accent text-white font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-xl tracking-tight uppercase"
                             >
                                <ListPlus size={24} /> Add to Ranking
                             </button>
                           ) : (
                             <div className="space-y-4">
                               <div className="grid grid-cols-1 gap-3">
                                  <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-mist border border-line rounded-sm px-5 py-4 text-ink font-black outline-none focus:border-accent appearance-none text-sm">
                                     <option value="">ランキングを選択... / Select...</option>
                                     {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                  </select>
                                  <div className="relative">
                                     <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="w-full bg-mist border border-line rounded-sm px-5 py-4 text-ink font-black outline-none focus:border-accent text-xl" placeholder="順位 / Pos" />
                                     <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-ink uppercase tracking-widest pointer-events-none">順位 / Rank</span>
                                  </div>
                               </div>
                               <div className="flex gap-4 pt-4">
                                  <button 
                                    type="button"
                                    onClick={() => setIsAddingToRanking(false)} 
                                    className="flex-1 py-3 text-ink hover:text-ink font-black uppercase text-[10px] tracking-widest transition-colors"
                                  >キャンセル</button>
                                  <button 
                                    type="button"
                                    onClick={handleAddToRanking}
                                    disabled={!selectedRankingId} 
                                    className="flex-[2] py-4 rounded-sm bg-accent text-white font-black flex items-center justify-center gap-2 disabled:opacity-20 tracking-widest uppercase text-xs transition-all active:scale-95"
                                  >追加する <ArrowRight size={18} /></button>
                               </div>
                             </div>
                           )}
                        </div>
                      )}
                   </div>

                   <div className="lg:col-span-7 space-y-4 flex flex-col h-full">
                      <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] text-ink font-black uppercase tracking-[0.3em] flex items-center gap-2"><AlignLeft size={14} /> メモ・あらすじ / NARRATIVE</p>
                          <button 
                            type="button"
                            onClick={handleCopy}
                            className="text-[12px] text-ink font-black flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink active:bg-ink active:text-white"
                          >
                             <Copy size={14} /> コピー
                          </button>
                       </div>
                      {isGlobalEditMode ? (
                         <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} className="flex-1 w-full bg-mist p-8 rounded-sm border border-line text-ink text-xl min-h-[300px] resize-none focus:outline-none focus:border-accent transition-all leading-relaxed custom-scrollbar" placeholder="..." />
                      ) : (
                         <div className="flex-1 bg-mist p-8 rounded-sm border border-line text-ink text-lg leading-relaxed min-h-[250px] whitespace-pre-wrap custom-scrollbar">
                            {memo || <span className="opacity-10 text-4xl not-italic font-black flex items-center justify-center h-full">記述なし</span>}
                         </div>
                      )}
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
