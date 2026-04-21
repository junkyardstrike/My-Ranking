import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, ChevronDown, Calendar, AlignLeft, Clock, Crown, User, Type, Eye, Loader, Sparkles, Star } from 'lucide-react';
import RankingItemDetailModal from './RankingItemDetailModal';
import ScoreRating from './ScoreRating';
import { fetchMetadata } from '../../services/metadataFetcher';

export default function RankingItem({ 
  item, 
  isEditMode, 
  viewMode, 
  dragHandleProps, 
  onUpdate,
  genre = 'other'
}) {
  const setEditMode = useStore(state => state.setEditMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);

  const { id, currentRank, title, author, memo, createdAt, imageBase64, previousRanks = [], isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0 } = item;

  // Local font size state for real-time preview
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  
  // Important: Sync local state when item.fontSize changes from outside (e.g. initial load)
  useEffect(() => { 
    setLocalFontSize(fontSize); 
  }, [fontSize]);

  const historyText = previousRanks && previousRanks.length > 0 ? [currentRank, ...previousRanks].slice(0, 3).map(r => `${r}位`).join('←') : null;
  const dateObj = createdAt ? new Date(createdAt) : null;
  const formattedDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString('ja-JP').split('/').slice(1).join('/') : '';

  const handleImageUpload = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { onUpdate(item.id, { imageBase64: reader.result }); };
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
    if (genre === 'other') { 
      alert("ランキング作成時にジャンル（アニメ・漫画など）を選択すると自動取得が利用できます。");
      setFetchStatus('error'); 
      setTimeout(() => setFetchStatus(null), 2000); 
      return; 
    }
    setIsFetching(true); setFetchStatus(null);
    try {
      const result = await fetchMetadata(title.trim(), genre);
      if (result) {
        const updates = { memo: result.memo };
        if (result.author && !author) updates.author = result.author;
        // Also auto-update image if available and not set
        if (result.imageUrl && !imageBase64) {
          // Note: converting URL to base64 would be better but here we just store the URL if possible or ignore
          // For simplicity we just update memo/author.
        }
        onUpdate(item.id, updates);
        setFetchStatus('success');
      } else { setFetchStatus('error'); }
    } catch { setFetchStatus('error'); }
    finally { setIsFetching(false); setTimeout(() => setFetchStatus(null), 3000); }
  };

  const hasContent = title || imageBase64 || memo || author;
  const isMemoLong = memo && memo.length > 40;

  if (!isEditMode && !hasContent) return null;

  const renderRankBadge = (rank) => {
    let bgClass = "bg-black/40 text-slate-500 border-white/5";
    let icon = null;
    if (rank === 1) { bgClass = "bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-600 text-yellow-950 border-yellow-300/50 shadow-[0_0_12px_rgba(253,224,71,0.4)]"; icon = <Crown className="w-3 h-3 mx-auto mb-0.5" />; }
    else if (rank === 2) { bgClass = "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 text-slate-950 border-slate-300/50 shadow-[0_0_8px_rgba(148,163,184,0.3)]"; icon = <Crown className="w-3 h-3 mx-auto mb-0.5" />; }
    else if (rank === 3) { bgClass = "bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 text-orange-950 border-orange-400/50 shadow-[0_0_8px_rgba(251,146,60,0.2)]"; icon = <Crown className="w-3 h-3 mx-auto mb-0.5 text-orange-900" />; }
    return (
      <div className={`flex-shrink-0 flex flex-col items-center justify-center font-bold font-mono rounded-lg border backdrop-blur-md transition-all duration-300 w-10 h-10 ${bgClass}`}>
        {icon}
        <span className="drop-shadow-sm leading-none text-sm">{rank}</span>
      </div>
    );
  };

  let cardBgClass = "bg-black/20 backdrop-blur-md border-white/5";
  if (currentRank === 1) cardBgClass = "bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]";

  return (
    <>
      <div
        className={`${cardBgClass} rounded-xl overflow-hidden border transition-all duration-300 hover:border-white/20 flex flex-col ${!isEditMode ? 'cursor-pointer hover:bg-white/5' : ''}`}
        onClick={() => !isEditMode && setIsModalOpen(true)}
      >
        {/* ===== EDIT MODE ===== */}
        {isEditMode ? (
          <div className="flex flex-col p-2.5 gap-2.5">

            {/* Top: rank badge + drag */}
            <div className="flex items-center gap-2">
              {renderRankBadge(currentRank)}
              <div className="flex-1" />
              {dragHandleProps && (
                <div {...dragHandleProps} className="p-1.5 cursor-grab active:cursor-grabbing text-slate-500 hover:text-accent transition-colors bg-white/5 rounded-lg hover:bg-white/10 touch-none" onClick={e => e.stopPropagation()}>
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Title row */}
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="text"
                value={title || ''}
                onChange={handleTitleChange}
                placeholder={`${currentRank}位のタイトル`}
                className={`flex-1 min-w-0 bg-transparent border-b border-white/10 focus:border-accent outline-none text-white transition-colors pb-0.5 placeholder:text-slate-700 ${isBold ? 'font-black' : 'font-bold'}`}
                style={{ color, fontSize: `${localFontSize}px` }}
              />
              {/* Sparkle button - ALWAYS VISIBLE in edit mode now */}
              <button
                onClick={(e) => { e.stopPropagation(); handleAutoFetch(); }}
                disabled={!title?.trim() || isFetching}
                title="作品情報を自動取得"
                className={`flex-shrink-0 p-1.5 rounded-lg border transition-all duration-300 ${
                  fetchStatus === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                  fetchStatus === 'error'   ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                  title?.trim()             ? 'bg-accent/20 border-accent/40 text-accent hover:bg-accent/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]' :
                                             'bg-black/20 border-white/5 text-slate-700 cursor-not-allowed'
                }`}
              >
                {isFetching ? <Loader className="w-3.5 h-3.5 animate-spin" />
                  : fetchStatus === 'success' ? <span className="text-[10px] font-bold px-0.5">OK</span>
                  : fetchStatus === 'error'   ? <span className="text-[10px] font-bold px-0.5">NG</span>
                  : <Sparkles className="w-3.5 h-3.5" />
                }
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate(item.id, { isBold: !isBold }); }}
                className={`flex-shrink-0 p-1.5 rounded-lg border transition-colors ${isBold ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-black/30 border-white/5 text-slate-600 hover:text-white'}`}
              >
                <Type className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font size + color */}
            <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Color</label>
              <input type="color" value={color || '#ffffff'} onChange={(e) => onUpdate(item.id, { color: e.target.value })} className="w-5 h-5 rounded cursor-pointer bg-transparent border-none flex-shrink-0" />
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Size</label>
              <input
                type="range" min="12" max="32"
                value={localFontSize}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setLocalFontSize(v);
                  onUpdate(item.id, { fontSize: v });
                }}
                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <span className="text-[10px] text-slate-400 font-mono w-4 text-right">{localFontSize}</span>
            </div>

            {/* Metadata: author / date / views */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg border border-white/5 flex-1 min-w-[120px]">
                <User className="w-3 h-3 text-accent flex-shrink-0" />
                <input type="text" value={author || ''} onChange={(e) => onUpdate(item.id, { author: e.target.value })} placeholder="Author" className="bg-transparent border-none outline-none text-white text-[11px] w-full placeholder:text-slate-700" />
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg border border-white/5 flex-1 min-w-[100px]">
                <Calendar className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <input type="date" value={createdAt ? createdAt.split('T')[0] : ''} onChange={(e) => onUpdate(item.id, { createdAt: new Date(e.target.value).toISOString() })} className="bg-transparent border-none outline-none text-white text-[11px] w-full" />
              </div>
              <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                <Eye className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate(item.id, { views: Math.max(0, (views || 0) - 1) }) }} className="w-4 h-4 flex items-center justify-center bg-black/40 rounded text-slate-400 text-[10px]">-</button>
                <span className="text-[10px] font-mono text-white w-4 text-center">{views || 0}</span>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate(item.id, { views: (views || 0) + 1 }) }} className="w-4 h-4 flex items-center justify-center bg-black/40 rounded text-slate-400 text-[10px]">+</button>
              </div>
            </div>

            {/* Score rating */}
            <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Rating</label>
              <ScoreRating rating={rating} onRatingChange={(v) => onUpdate(item.id, { rating: v })} />
            </div>

            {/* Memo */}
            <div className="flex items-start gap-1.5 bg-black/30 p-2 rounded-lg border border-white/5">
              <AlignLeft className="w-3 h-3 text-slate-600 mt-0.5 flex-shrink-0" />
              <textarea value={memo || ''} onChange={(e) => onUpdate(item.id, { memo: e.target.value })} placeholder="Memo..." className="w-full bg-transparent border-none outline-none text-slate-300 resize-none min-h-[50px] placeholder:text-slate-700 text-[11px] leading-snug" />
            </div>

            {/* Image — bottom */}
            <div className="relative w-full rounded-lg overflow-hidden border border-white/5 bg-slate-900/50">
              {imageBase64
                ? <img src={imageBase64} alt={title} className="w-full max-h-32 object-cover" />
                : <div className="w-full h-12 flex items-center justify-center text-slate-800"><ImageIcon className="w-5 h-5" /></div>
              }
              <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-white font-bold px-2 py-1 bg-black/60 rounded-full border border-white/10">CHANGE IMAGE</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

          </div>
        ) : (

          /* ===== VIEW MODE ===== */
          <div className="flex flex-row items-stretch min-h-[80px]">

            {/* Left: badge + content */}
            <div className="flex-1 flex flex-row p-2.5 min-w-0 gap-2.5">
              {/* Rank badge */}
              <div className="flex-shrink-0 flex items-start pt-0.5">
                {renderRankBadge(currentRank)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <h3
                  className={`leading-tight tracking-tight ${isBold ? 'font-black' : 'font-extrabold'} ${
                    currentRank === 1 ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(253,224,71,0.4)]' :
                    currentRank === 2 ? 'text-slate-100' :
                    currentRank === 3 ? 'text-orange-400' : 'text-white'
                  }`}
                  style={{ color: currentRank <= 3 ? undefined : color, fontSize: `${fontSize}px` }}
                >
                  {title || 'Untitled'}
                </h3>

                {/* Meta chips — compact */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  {author && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <User className="w-2.5 h-2.5 text-accent" />{author}
                    </span>
                  )}
                  {rating > 0 && <ScoreRating rating={rating} readOnly />}
                  {views > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Eye className="w-2.5 h-2.5 text-blue-500" />{views}
                    </span>
                  )}
                  {formattedDate && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Calendar className="w-2.5 h-2.5 text-emerald-600" />{formattedDate}
                    </span>
                  )}
                  {previousRanks && previousRanks.length > 0 && (
                    <span className="text-[10px] text-orange-500/60 font-mono">📈{historyText}</span>
                  )}
                </div>

                {/* Memo snippet */}
                {memo && (
                  <div className="mt-1">
                    <p className={`text-[10px] text-slate-500 leading-tight whitespace-pre-wrap ${!isExpanded && isMemoLong ? 'line-clamp-1' : ''}`}>{memo}</p>
                    {isMemoLong && (
                      <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-[9px] font-bold text-accent/60 hover:text-accent transition-colors">
                        {isExpanded ? 'CLOSE ▲' : 'MORE ▼'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: small square thumbnail */}
            {imageBase64 && (
              <div className="flex-shrink-0 p-1.5 flex items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-white/5 shadow-inner bg-black/40">
                  <img src={imageBase64} alt={title} className="w-full h-full object-cover opacity-90" />
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <RankingItemDetailModal
        item={item}
        isOpen={isModalOpen}
        onClose={(e) => { if (e) e.stopPropagation(); setIsModalOpen(false); }}
        onEdit={(e) => { if (e) e.stopPropagation(); setIsModalOpen(false); setEditMode(true); }}
      />
    </>
  );
}
