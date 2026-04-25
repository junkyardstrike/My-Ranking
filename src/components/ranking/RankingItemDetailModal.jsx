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
  const settings = useStore(state => state.settings) || {
    defaultDurations: { movie: 120, music: 3, anime: 20, drama: 40, manga: 30, game: 60 },
    useViewCount: true
  };

  const itemFromStore = useStore(useCallback(state => {
    const allItems = [
      ...(state.rankings || []).flatMap(r => r.items || []),
      ...(state.unrankedItems || [])
    ];
    return allItems.find(i => i.id === propItem?.id);
  }, [propItem?.id]));

  const liveItem = itemFromStore || propItem;

  const [draftItem, setDraftItem] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingToRanking, setIsAddingToRanking] = useState(false);
  const [selectedRankingId, setSelectedRankingId] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen && liveItem) {
      setDraftItem({ ...liveItem });
      setHasChanges(false);
    }
  }, [isOpen, liveItem?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setIsAddingToRanking(false);
    }
  }, [isOpen, liveItem?.id]);

  if (!isOpen || !draftItem) return null;

  const { id, currentRank, title, author, memo, createdAt, imageBase64, views = 0, rating = 0, isSelected = false, rankingId, genre = 'music', isBold = false, color = '#ffffff', fontSize = 20, duration, episodes = 1, volumes = 1 } = draftItem;

  const baseDuration = (duration !== undefined && duration !== null && duration !== '' && Number(duration) > 0) ? Number(duration) : null;
  let unitDuration = baseDuration;
  if (unitDuration === null) {
    unitDuration = settings.defaultDurations[genre] || settings.defaultDurations.movie || 60;
  }

  let totalDurationPerView = unitDuration;
  if (genre === 'manga') totalDurationPerView = unitDuration * (volumes || 1);
  else if (genre === 'anime' || genre === 'drama') totalDurationPerView = unitDuration * (episodes || 1);

  const finalViewCount = settings.useViewCount ? (views || 1) : 1;
  const totalLifetimeDuration = totalDurationPerView * finalViewCount;

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
    onClose();
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
    setEditMode(false);
    onClose();
  };

  const genreInfo = GENRE_MAP[genre] || GENRE_MAP.music;
  const GenreIcon = genreInfo.icon;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={handleClose} />
      
      <div className="relative w-full max-w-5xl bg-[#0c0a10]/95 border-x border-white/10 sm:rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col h-full sm:h-auto sm:max-h-[94vh] animate-in zoom-in-95 duration-300">
        <div className="absolute inset-0 z-[-1] opacity-30" style={{ 
          backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(124,58,237,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.2) 0%, transparent 50%)'
        }} />
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/60 backdrop-blur-md z-[100]">
          <div className="flex items-center gap-4">
             <div onClick={() => setEditMode(!isGlobalEditMode)} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isGlobalEditMode ? 'text-accent' : 'text-white'}`}>編集モード</span>
                <div className={`w-10 h-5 rounded-full p-1 flex items-center transition-all ${isGlobalEditMode ? 'bg-accent/30 border border-accent/50' : 'bg-white/10 border border-white/10'}`}>
                   <div className={`w-3 h-3 rounded-full transition-all ${isGlobalEditMode ? 'bg-accent translate-x-5' : 'bg-slate-600'}`} />
               </div>
            </div>
            {hasChanges && (
              <button 
                onPointerDown={(e) => { e.stopPropagation(); handleSave(); }}
                className="flex items-center gap-2 bg-accent text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(234,179,8,0.4)] active:bg-yellow-400 active:scale-95 transition-all animate-in zoom-in-95 touch-none"
              >
                <CheckCircle2 size={14} /> 変更を保存
              </button>
            )}
          </div>
          <button onClick={handleClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all shadow-xl active:scale-90">
            <X size={24} />
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
                      value={title || ''} 
                      onChange={e => handleUpdate({ title: e.target.value })} 
                      className="flex-1 bg-transparent border-b border-white/20 focus:border-accent outline-none text-white text-3xl sm:text-5xl font-black italic tracking-tighter pb-1" 
                      placeholder="作品名..." 
                    />
                    <button onClick={handleAutoFetch} disabled={isFetching} className="p-3 rounded-xl bg-accent text-black hover:scale-105 transition-all shadow-xl shadow-accent/20">
                       {isFetching ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                 </div>
               ) : (
                 <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter italic flex items-center flex-wrap gap-y-4 pr-6" style={{ color, textShadow: '0 10px 30px rgba(0,0,0,0.9)' }}>
                   {title || 'Untitled'}
                 </h2>
               )}
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {(rankingId || propRankingId) ? (
                      <div className="px-5 py-2.5 bg-accent text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(234,179,8,0.3)] italic flex items-center gap-2 border border-white/20">
                        <Crown size={16} /> Rank {currentRank}
                      </div>
                    ) : isSelected && (
                      <div className="px-5 py-2.5 bg-accent/20 border border-accent/30 text-accent font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-sm italic flex items-center gap-2">
                        <Crown size={16} /> 選出済み
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl">
                         {isGlobalEditMode ? (
                            Object.entries(GENRE_MAP).map(([key, info]) => {
                               const Icon = info.icon;
                               const isSelectedGenre = genre === key;
                               return (
                                 <button 
                                   key={key} 
                                   onClick={(e) => { e.stopPropagation(); handleUpdate({ genre: key }); }} 
                                   className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isSelectedGenre ? 'bg-accent/20 text-accent border border-accent/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
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
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-2xl">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                             {genre === 'manga' ? 'VOLS' : 'EPS'}
                           </span>
                           <span className="text-sm font-black text-white font-mono italic tracking-tighter">
                             {genre === 'manga' ? `全${volumes || 1}巻` : `全${episodes || 1}話`}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pl-1 pt-6 border-t border-white/5 mt-2">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-lg shadow-accent/5">
                         <User size={24} className="text-accent" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">作者 / AUTHOR</span>
                         {isGlobalEditMode ? (
                            <input 
                              type="text" 
                              value={author || ''} 
                              onChange={e => handleUpdate({ author: e.target.value })} 
                              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-black text-white outline-none focus:border-accent w-full sm:w-[240px]" 
                              placeholder="作者名" 
                            />
                         ) : (
                            <span className="text-xl font-black text-white tracking-wider leading-none">
                              {author || '---'}
                            </span>
                         )}
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                         <Calendar size={24} className="text-emerald-400" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">作成日 / DATE</span>
                         {isGlobalEditMode ? (
                            <input type="date" value={createdAt ? createdAt.split('T')[0] : ''} onChange={e => handleUpdate({ createdAt: new Date(e.target.value).toISOString() })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:border-accent" />
                         ) : (
                            <span className="text-xl font-black text-white tracking-widest leading-none">
                              {createdAt ? new Date(createdAt).toLocaleDateString('ja-JP') : '---'}
                            </span>
                         )}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                   <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white/5 p-6 rounded-[40px] border border-white/5 grid grid-cols-1 gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
                         
                         <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-3">
                               <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Star size={12} className="text-accent" /> スコア / SCORE</p>
                               <div className="flex justify-start w-full scale-125 origin-left">
                                  <ScoreRating rating={rating} onRatingChange={isGlobalEditMode ? (v => handleUpdate({ rating: v })) : undefined} readOnly={!isGlobalEditMode} />
                               </div>
                            </div>
                            
                            <div className="flex flex-col items-center space-y-2">
                               <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Eye size={12} className="text-blue-500" /> 閲覧回数 / VIEWS</p>
                               {isGlobalEditMode ? (
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => handleUpdate({ views: Math.max(0, views - 1) })} className="w-8 h-8 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all font-bold">-</button>
                                     <span className="font-mono font-black text-2xl tracking-tighter w-10 text-center">{views}</span>
                                     <button onClick={() => handleUpdate({ views: views + 1 })} className="w-8 h-8 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all font-bold">+</button>
                                  </div>
                               ) : (
                                  <p className="text-3xl font-black text-white font-mono tracking-tighter text-center">{views.toLocaleString()}回</p>
                               )}
                            </div>
                         </div>

                         <div className="relative z-10 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={12} className="text-purple-500" /> 累計所要時間 / TOTAL TIME</p>
                            <div className="flex items-baseline gap-2">
                               <p className="text-5xl font-black text-white font-mono tracking-tighter">
                                 {genre === 'game' ? totalLifetimeDuration.toFixed(1) : (totalLifetimeDuration / 60).toFixed(1)}
                               </p>
                               <p className="text-sm font-black text-slate-500 uppercase tracking-widest">時間 / HOURS</p>
                            </div>
                            <div className="w-full bg-black/40 px-4 py-3 rounded-2xl border border-white/5 flex items-center justify-center gap-3 shadow-inner">
                               <span className="text-[11px] sm:text-[13px] font-black text-accent tracking-widest uppercase italic">
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
                         <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
                            <p className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> 詳細設定 / DETAILS</p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {genre === 'game' ? '所要時間 (時間)' : '時間 (分)'}
                                  </label>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step={genre === 'game' ? '0.1' : '1'}
                                    value={baseDuration === null ? '' : baseDuration} 
                                    onChange={e => handleUpdate({ duration: e.target.value === '' ? '' : (genre === 'game' ? parseFloat(e.target.value) : parseInt(e.target.value)) })} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none focus:border-accent" 
                                    placeholder={unitDuration.toString()} 
                                  />
                               </div>
                               {(genre === 'anime' || genre === 'drama' || genre === 'manga') && (
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{genre === 'manga' ? '巻数' : '話数'}</label>
                                    <input 
                                      type="number" 
                                      min="1" 
                                      value={genre === 'manga' ? (volumes === 0 ? '' : volumes) : (episodes === 0 ? '' : episodes)} 
                                      onChange={e => handleUpdate({ [genre === 'manga' ? 'volumes' : 'episodes']: e.target.value === '' ? '' : parseInt(e.target.value) })} 
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none focus:border-accent" 
                                      placeholder="1" 
                                    />
                                 </div>
                               )}
                            </div>
                         </div>
                      )}

                      {isGlobalEditMode && (
                         <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl">
                            <p className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2"><Type size={14} /> スタイルカスタマイズ / STYLE</p>
                            <div className="flex items-center gap-6">
                               <div className="flex-1 space-y-2">
                                  <div className="flex justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">サイズ</label>
                                    <span className="text-[10px] font-mono font-black text-accent">{fontSize}px</span>
                                  </div>
                                  <input type="range" min="14" max="100" value={fontSize} onChange={e => handleUpdate({ fontSize: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-800 accent-accent rounded-full appearance-none cursor-pointer" />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center">カラー</label>
                                  <input type="color" value={color} onChange={e => handleUpdate({ color: e.target.value })} className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer p-0" />
                               </div>
                            </div>
                            <button onClick={() => handleUpdate({ isBold: !isBold })} className={`w-full py-4 rounded-2xl border font-black text-[11px] tracking-[0.3em] transition-all uppercase ${isBold ? 'bg-accent text-black border-accent' : 'bg-white/5 text-white border-white/10'}`}>
                               太字設定: {isBold ? 'ON' : 'OFF'}
                            </button>
                         </div>
                      )}

                      {!isSelected && !(rankingId || propRankingId) && (
                        <div className="bg-accent/5 border border-accent/20 p-6 rounded-[40px] space-y-4 shadow-2xl backdrop-blur-md">
                           {!isAddingToRanking ? (
                             <button onClick={() => setIsAddingToRanking(true)} className="w-full py-5 rounded-[24px] bg-accent text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-accent/30 text-xl tracking-tight italic uppercase">
                                <ListPlus size={24} /> Add to Ranking
                             </button>
                           ) : (
                             <div className="space-y-4 animate-in slide-in-from-bottom-4">
                               <div className="grid grid-cols-1 gap-3">
                                  <select value={selectedRankingId} onChange={e => setSelectedRankingId(e.target.value)} className="bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-accent appearance-none text-sm shadow-inner">
                                     <option value="">ランキングを選択... / Select...</option>
                                     {rankings.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                  </select>
                                  <div className="relative">
                                     <input type="number" min="1" max="100" value={selectedRank} onChange={e => setSelectedRank(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-accent text-xl shadow-inner" placeholder="順位 / Pos" />
                                     <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 uppercase tracking-widest pointer-events-none">順位 / Rank</span>
                                  </div>
                               </div>
                               <div className="flex gap-4 pt-4">
                                  <button onClick={() => setIsAddingToRanking(false)} className="flex-1 py-3 text-white/40 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors">キャンセル</button>
                                  <button onClick={handleAddToRanking} disabled={!selectedRankingId} className="flex-[2] py-4 rounded-2xl bg-accent text-black font-black flex items-center justify-center gap-2 disabled:opacity-20 tracking-widest uppercase text-xs shadow-xl transition-all">追加する <ArrowRight size={18} /></button>
                               </div>
                             </div>
                           )}
                        </div>
                      )}
                   </div>

                   <div className="lg:col-span-7 space-y-4 flex flex-col h-full">
                      <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] flex items-center gap-2"><AlignLeft size={14} /> メモ・あらすじ / NARRATIVE</p>
                          <button onClick={handleCopy} className="text-[10px] text-accent/40 hover:text-accent font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-colors">
                             <Copy size={12} /> コピー
                          </button>
                       </div>
                      {isGlobalEditMode ? (
                         <textarea value={memo || ''} onChange={e => handleUpdate({ memo: e.target.value })} className="flex-1 w-full bg-white/5 p-8 rounded-[48px] border border-white/5 text-white text-xl min-h-[300px] resize-none focus:outline-none focus:border-accent transition-all italic leading-relaxed shadow-inner custom-scrollbar" placeholder="..." />
                      ) : (
                         <div className="flex-1 bg-white/5 p-8 rounded-[48px] border border-white/5 text-white text-lg leading-relaxed italic shadow-inner min-h-[250px] whitespace-pre-wrap custom-scrollbar">
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
