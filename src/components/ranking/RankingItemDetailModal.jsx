import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Eye, Crown, AlignLeft, Edit3, Star, CheckCircle2, ListPlus, ArrowRight, Tv, BookOpen, Film, Clapperboard, Music, Gamepad2, Copy, History, MoreHorizontal, Type, Sparkles, Loader, Trash2, Plus, Minus, Clock } from 'lucide-react';
import ScoreRating from './ScoreRating';
import { useStore } from '../../store/useStore';
import { fetchMetadata } from '../../services/metadataFetcher';

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

  const itemFromStore = useStore(useCallback(state => {
    const allItems = [
      ...(state.rankings || []).flatMap(r => r.items || []),
      ...(state.unrankedItems || [])
    ];
    return allItems.find(i => i.id === propItem?.id);
  }, [propItem?.id]));

  const liveItem = itemFromStore || propItem;

  const [isAddingToRanking, setIsAddingToRanking] = useState(false);
  const [selectedRankingId, setSelectedRankingId] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const [localTitle, setLocalTitle] = useState(liveItem?.title || '');
  const [localAuthor, setLocalAuthor] = useState(liveItem?.author || '');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setLocalTitle(liveItem?.title || '');
      setLocalAuthor(liveItem?.author || '');
    } else {
      document.body.style.overflow = 'auto';
      setIsAddingToRanking(false);
    }
  }, [isOpen, liveItem?.id]);

  if (!isOpen || !liveItem) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre = 'music', isBold = false, color = '#ffffff', fontSize = 20, duration, episodes = 1, volumes = 1 } = liveItem;

  const baseDuration = (duration !== undefined && duration !== null && duration !== '' && Number(duration) > 0) ? Number(duration) : null;
  let unitDuration = baseDuration;
  if (unitDuration === null) {
    switch (genre) {
      case 'anime': unitDuration = 20; break;
      case 'drama': unitDuration = 40; break;
      case 'movie': unitDuration = 120; break;
      case 'music': unitDuration = 3; break;
      case 'manga': unitDuration = 30; break;
      default: unitDuration = 0; break;
    }
  }

  let totalDurationPerView = unitDuration;
  if (genre === 'manga') totalDurationPerView = unitDuration * (volumes || 1);
  else if (genre === 'anime' || genre === 'drama') totalDurationPerView = unitDuration * (episodes || 1);

  const totalLifetimeDuration = totalDurationPerView * views;

  const handleUpdate = (updates) => {
    if (onUpdate) {
      onUpdate(id, updates);
    } else {
      updateItemStore(id, updates);
    }
  };

  const handleTitleSync = () => {
    if (localTitle !== title) {
      handleUpdate({ title: localTitle });
    }
  };

  const handleAuthorSync = () => {
    if (localAuthor !== author) {
      handleUpdate({ author: localAuthor });
    }
  };

  const handleAddToRanking = () => {
    if (!selectedRankingId) return;
    if (window.confirm(`${selectedRank}位に挿入します。よろしいですか？`)) {
      insertItemIntoRanking(selectedRankingId, liveItem, parseInt(selectedRank));
      setIsAddingToRanking(false);
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
    if (!localTitle || !localTitle.trim() || isFetching) return;
    setIsFetching(true);
    try {
      const result = await fetchMetadata(localTitle.trim(), genre);
      if (result) {
        handleUpdate({ memo: result.memo, author: result.author || author });
        if (result.author) setLocalAuthor(result.author);
      }
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  const handleCopy = () => {
    const text = `${title}\n${author ? `by ${author}\n` : ''}\n${memo || ''}`;
    navigator.clipboard.writeText(text);
    alert('作品情報をコピーしました');
  };

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.music;
  const GenreIcon = genreInfo.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-surface/98 border-x border-white/10 sm:rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col h-full sm:h-auto sm:max-h-[94vh] animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/60 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
             <div onClick={() => setEditMode(!isGlobalEditMode)} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isGlobalEditMode ? 'text-accent' : 'text-slate-300'}`}>編集モード</span>
                <div className={`w-10 h-5 rounded-full p-1 flex items-center transition-all ${isGlobalEditMode ? 'bg-accent/30 border border-accent/50' : 'bg-white/10 border border-white/10'}`}>
                   <div className={`w-3 h-3 rounded-full transition-all ${isGlobalEditMode ? 'bg-accent translate-x-5' : 'bg-slate-600'}`} />
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative w-full aspect-video sm:aspect-[24/10] bg-black group z-0">
             {imageBase64 ? <img src={imageBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={60} className="opacity-10" /></div>}
             {isGlobalEditMode && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                   <label 
                     htmlFor={`modal-upload-${id}`}
                     className="bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
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
                      value={localTitle} 
                      onChange={e => setLocalTitle(e.target.value)} 
                      onBlur={handleTitleSync}
                      onKeyDown={e => e.key === 'Enter' && handleTitleSync()}
                      className="flex-1 bg-transparent border-b border-white/20 focus:border-accent outline-none text-white text-3xl sm:text-5xl font-black italic tracking-tighter pb-1" 
                      placeholder="作品名..." 
                    />
                    <button onClick={handleAutoFetch} disabled={isFetching} className="p-3 rounded-xl bg-accent text-black hover:scale-105 transition-all shadow-xl shadow-accent/20">
                       {isFetching ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                 </div>
               ) : (
                 <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter italic" style={{ color, textShadow: '0 10px 30px rgba(0,0,0,0.9)' }}>{title || 'Untitled'}</h2>
               )}
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    {(rankingId || propRankingId) ? (
                      <div className="flex items-center gap-2">
                        <div className="px-4 py-2 bg-accent text-black font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-accent/20 italic flex items-center gap-2">
                          <Crown size={14} /> Rank {currentRank}
                        </div>
                        {isGlobalEditMode && (
                          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 const nextRank = Math.max(1, currentRank - 1);
                                 if (onMove) onMove(id, nextRank);
                                 else moveItemToRank(rankingId || propRankingId, id, nextRank);
                               }}
                               className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                             >
                               <Minus size={14} />
                             </button>
                             <div className="w-10 text-center text-white font-black text-sm">{currentRank}</div>
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 const nextRank = Math.min(100, currentRank + 1);
                                 if (onMove) onMove(id, nextRank);
                                 else moveItemToRank(rankingId || propRankingId, id, nextRank);
                               }}
                               className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                             >
                               <Plus size={14} />
                             </button>
                             <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest px-2">順位 / POS</span>
                          </div>
                        )}
                      </div>
                    ) : isSelected && (
                      <div className="px-4 py-2 bg-accent/20 border border-accent/30 text-accent font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm italic flex items-center gap-2">
                        <Crown size={14} /> 選出済み
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1 flex items-center gap-0.5">
                     {isGlobalEditMode ? (
                        Object.entries(GENRE_MAP).map(([key, info]) => {
                           const Icon = info.icon;
                           const isSelectedGenre = genre === key;
                           return (
                             <button 
                               key={key} 
                               onClick={(e) => { e.stopPropagation(); handleUpdate({ genre: key }); }} 
                               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isSelectedGenre ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm' : 'text-slate-400 hover:text-slate-400'}`}
                             >
                                <Icon size={14} />
                                {isSelectedGenre && <span className="text-[9px] font-black uppercase tracking-widest">{info.label}</span>}
                             </button>
                           );
                        })
                     ) : (
                        <div className="flex items-center gap-2 px-4 py-1.5 text-accent">
                           <GenreIcon size={16} />
                           <span className="text-[9px] font-black uppercase tracking-widest">{genreInfo.label}</span>
                        </div>
                     )}
                  </div>
                </div>

               <div className="flex flex-wrap items-center gap-6 pl-1">
                  <div className="flex items-center gap-2">
                     <User size={16} className="text-accent/60" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest inline-block">作者 / AUTHOR:</span>
                     {isGlobalEditMode ? (
                        <input 
                          type="text" 
                          value={localAuthor} 
                          onChange={e => setLocalAuthor(e.target.value)} 
                          onBlur={handleAuthorSync}
                          onKeyDown={e => e.key === 'Enter' && handleAuthorSync()}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-accent w-[160px]" 
                          placeholder="作者名" 
                        />
                     ) : (
                        <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">{author || '未設定'}</span>
                     )}
                  </div>
                  <div className="flex items-center gap-2 border-l border-white/10 pl-4 sm:pl-6">
                     <Calendar size={16} className="text-emerald-500/60" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest inline-block">作成日 / DATE:</span>
                     {isGlobalEditMode ? (
                        <input type="date" value={createdAt ? createdAt.split('T')[0] : ''} onChange={e => handleUpdate({ createdAt: new Date(e.target.value).toISOString() })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white outline-none focus:border-accent" />
                     ) : (
                        <span className="text-slate-300 font-bold text-[10px] tracking-widest">{createdAt ? new Date(createdAt).toLocaleDateString('ja-JP') : '---'}</span>
                     )}
                  </div>
               </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
               <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white/5 p-4 sm:p-6 rounded-[32px] border border-white/5 grid grid-cols-2 md:grid-cols-3 gap-4 shadow-lg items-center">
                     <div className="space-y-3 text-center">
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Star size={10} className="text-accent" /> スコア / SCORE</p>
                       <div className="flex justify-center w-full">
                          <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                       </div>
                     </div>
                     
                     <div className="flex flex-col items-center border-l border-white/10 space-y-2">
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Eye size={10} className="text-blue-500" /> 閲覧回数 / VIEWS</p>
                       {isGlobalEditMode ? (
                          <div className="flex items-center gap-2 justify-center w-full">
                             <button onClick={() => handleUpdate({ views: Math.max(0, views - 1) })} className="w-7 h-7 bg-white/5 rounded-lg border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">-</button>
                             <span className="text-center font-mono font-black text-xl tracking-tighter w-8">{views}</span>
                             <button onClick={() => handleUpdate({ views: views + 1 })} className="w-7 h-7 bg-white/5 rounded-lg border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">+</button>
                          </div>
                       ) : (
                          <p className="text-2xl font-black text-white font-mono tracking-tighter text-center">{views.toLocaleString()}回</p>
                       )}
                     </div>

                     <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-white/10 space-y-1 col-span-2 md:col-span-1 pt-4 md:pt-0 bg-white/5 rounded-2xl py-2">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Clock size={10} className="text-purple-500" /> 累計所要時間 / TOTAL</p>
                        <p className="text-2xl font-black text-white font-mono tracking-tighter text-center">{(totalLifetimeDuration / 60).toFixed(1)}時間</p>
                        <p className="text-[8px] text-slate-500 font-bold text-center">
                          {(genre === 'manga' || genre === 'anime' || genre === 'drama') ? (
                            `${unitDuration}分 × ${genre === 'manga' ? (volumes || 1) + '巻' : (episodes || 1) + '話'} × ${views}回 = ${(totalLifetimeDuration / 60).toFixed(1)}時間`
                          ) : (
                            `${unitDuration}分 × ${views}回 = ${(totalLifetimeDuration / 60).toFixed(1)}時間`
                          )}
                        </p>
                     </div>
                  </div>

                  {isGlobalEditMode && (
                     <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 space-y-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> 所要時間・話数 / TIME & EPISODES</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">
                                {genre === 'movie' ? '所要時間 (分)' : '1話/1巻あたりの時間 (分)'}
                              </label>
                              <input 
                                type="number" 
                                min="0" 
                                value={baseDuration === null ? '' : baseDuration} 
                                onChange={e => handleUpdate({ duration: e.target.value === '' ? '' : parseInt(e.target.value) })} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-accent" 
                                placeholder={unitDuration.toString()} 
                              />
                           </div>
                           {(genre === 'anime' || genre === 'drama') && (
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">話数</label>
                                <input type="number" min="1" value={episodes === 0 ? '' : episodes} onChange={e => handleUpdate({ episodes: e.target.value === '' ? '' : parseInt(e.target.value) })} onBlur={e => { if (!e.target.value || isNaN(parseInt(e.target.value))) handleUpdate({ episodes: 1 }); }} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-accent" placeholder="1" />
                             </div>
                           )}
                           {genre === 'manga' && (
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">巻数</label>
                                <input type="number" min="1" value={volumes === 0 ? '' : volumes} onChange={e => handleUpdate({ volumes: e.target.value === '' ? '' : parseInt(e.target.value) })} onBlur={e => { if (!e.target.value || isNaN(parseInt(e.target.value))) handleUpdate({ volumes: 1 }); }} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-accent" placeholder="1" />
                             </div>
                           )}
                        </div>
                     </div>
                  )}

                  {isGlobalEditMode && (
                     <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between gap-4">
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><Type size={12} /> 書体スタイル / STYLE</p>
                           <div className="flex items-center gap-4 flex-1">
                              <span className="text-[10px] font-mono font-black text-accent w-6 text-center">{fontSize}</span>
                              <input type="range" min="14" max="80" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-slate-800 accent-accent rounded-full appearance-none cursor-pointer" />
                              <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer" />
                           </div>
                        </div>
                        <button onClick={() => handleUpdate({ isBold: !isBold })} className={`w-full py-3 rounded-xl border font-black text-[10px] tracking-widest transition-all ${isBold ? 'bg-accent text-black border-accent' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                           太字設定 / BOLD FONT: {isBold ? 'ON' : 'OFF'}
                        </button>
                     </div>
                  )}

                  {!isSelected && !(rankingId || propRankingId) && (
                    <div className="bg-accent/5 border border-accent/10 p-6 rounded-[32px] space-y-4 shadow-xl">
                       {!isAddingToRanking ? (
                         <button onClick={() => setIsAddingToRanking(true)} className="w-full py-4 rounded-[20px] bg-accent text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 text-xl tracking-tight italic">
                            <ListPlus size={24} /> ランキングに追加 / ADD TO RANKING
                         </button>
                       ) : (
                         <div className="space-y-4 animate-in slide-in-from-bottom-4">
                           <div className="grid grid-cols-1 gap-2">
                              <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-accent appearance-none text-sm">
                                 <option value="">ランキングを選択... / Select Ranking...</option>
                                 {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                              </select>
                              <div className="relative">
                                 <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-accent text-lg" placeholder="順位 / Pos" />
                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest">順位 / Rank</span>
                              </div>
                           </div>
                           <div className="flex gap-4 pt-2">
                              <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest">キャンセル / Cancel</button>
                              <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-3 rounded-xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-30 tracking-tight text-sm shadow-lg">追加する / INSERT NOW <ArrowRight size={18} /></button>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
               </div>

               <div className="lg:col-span-7 space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between px-1">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><AlignLeft size={12} /> メモ・あらすじ / NARRATIVE</p>
                      <button onClick={handleCopy} className="text-[9px] text-accent/60 hover:text-accent font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                         <Copy size={10} /> コピー / COPY TEXT
                      </button>
                   </div>
                  {isGlobalEditMode ? (
                     <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} className="flex-1 w-full bg-white/5 p-6 rounded-[32px] border border-white/5 text-slate-300 text-lg min-h-[200px] resize-none focus:outline-none focus:border-accent transition-all italic leading-relaxed shadow-inner custom-scrollbar" placeholder="..." />
                  ) : (
                     <div className="flex-1 bg-white/5 p-6 rounded-[32px] border border-white/5 text-slate-400 text-base leading-relaxed italic shadow-inner min-h-[150px] whitespace-pre-wrap custom-scrollbar">
                        {memo || <span className="opacity-10 text-3xl not-italic font-black">記述なし / NO NARRATIVE.</span>}
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
