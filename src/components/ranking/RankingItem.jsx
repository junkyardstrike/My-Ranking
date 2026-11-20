import { useState, useRef, memo } from 'react';
import { useStore, getPlacement, getAllItems } from '../../store/useStore';
import { GripVertical, Image as ImageIcon, Calendar, Crown, User, Type, Eye, Loader, Sparkles, Tv, BookOpen, History, Plus, Minus, Star, Clock, CheckCircle2 } from 'lucide-react';
import { openDetail, openAdd } from './dialogs';
import ScoreRating from './ScoreRating';
import Img from '../common/Img';
import { fetchMetadata } from '../../services/metadataFetcher';
import { getItemMetrics, normalizeGenre, toDateInputValue, fromDateInputValue } from '../../utils/itemMetrics';
import { readableTitleColor } from '../../utils/colors';
import { GENRES, GENRE_COLORS, GENRE_LABELS, confirmDuplicate, extractCounts } from '../../utils/genres';
import { compressImageFile } from '../../utils/imageFile';
import { saveImage } from '../../lib/images';

const update = (id, updates) => useStore.getState().updateItem(id, updates);

// 外から値が変わったら入力中の値も合わせる（日本語入力中に上書きしないよう、確定までは手元の値を使う）
function useLocalValue(value) {
  const [local, setLocal] = useState(value);
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setLocal(value); }
  return [local, setLocal];
}

// 順位の表示（映画祭の上映枠「SLOT」）。1〜3位はコーラル、ランキング外は点線の「追加」
function RankBadge({ rank, inRanking, collapsed, title, onAdd }) {
  const w = collapsed ? 'w-10' : 'w-[54px]';
  if (!rank || !inRanking) {
    return (
      <button
        type="button"
        aria-label={`「${title || '作品'}」をランキングに追加`}
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={`flex-shrink-0 self-start flex flex-col items-center justify-center border-2 border-dashed border-ink text-ink bg-white active:bg-ink active:text-white ${collapsed ? 'w-11' : w} ${collapsed ? 'min-h-[44px]' : 'min-h-[52px] py-1.5'}`}
      >
        {!collapsed && <span className="text-[8px] font-black tracking-[0.1em] leading-none">ADD</span>}
        <Plus size={collapsed ? 16 : 18} strokeWidth={3} />
      </button>
    );
  }
  const isTop = rank <= 3;
  return (
    <div className={`flex-shrink-0 self-start flex flex-col items-center justify-center text-white ${isTop ? 'bg-coral' : 'bg-ink'} ${w} ${collapsed ? 'py-1' : 'py-1.5'}`}>
      {!collapsed && (
        <span className="flex items-center gap-0.5 text-[8px] font-black tracking-[0.1em] leading-none mb-0.5">
          {isTop && <Crown size={9} fill="currentColor" />}SLOT
        </span>
      )}
      <span className={`font-fes leading-none ${collapsed ? 'text-[15px]' : rank >= 100 ? 'text-[17px]' : 'text-[22px]'}`}>{String(rank).padStart(2, '0')}</span>
    </div>
  );
}

// 編集モードのカード
function EditCard({ item, genre, rank, rankingId, dragHandleProps, onMove, badge }) {
  const { id, title, author, createdAt, img, isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0, duration, episodes = 1, volumes = 1 } = item;
  const [localTitle, setLocalTitle] = useLocalValue(title || '');
  const [localAuthor, setLocalAuthor] = useLocalValue(author || '');
  const [localFontSize, setLocalFontSize] = useLocalValue(fontSize);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);

  const handleTitleSync = () => {
    if (localTitle === title || localTitle.trim() === '') return;
    if (!confirmDuplicate(getAllItems(useStore.getState()), localTitle, id)) {
      setLocalTitle(title || '');
      return;
    }
    const updates = { title: localTitle };
    // ランキングの空き枠に作品名を入れた（＝作品を作った）時は、閲覧回数を 1 から始める
    if (!createdAt) {
      updates.createdAt = new Date().toISOString();
      if (!views) updates.views = 1;
    }
    update(id, updates);
  };
  const handleAuthorSync = () => { if (localAuthor !== author) update(id, { author: localAuthor }); };

  const handleAutoFetch = async () => {
    if (!localTitle?.trim() || isFetching) return;
    setIsFetching(true); setFetchStatus(null);
    try {
      const result = await fetchMetadata(localTitle.trim(), genre);
      if (result) {
        update(id, { memo: result.memo, author: result.author || author, ...extractCounts(result.memo, genre) });
        if (result.author) setLocalAuthor(result.author);
        setFetchStatus('success');
      } else setFetchStatus('error');
    } catch { setFetchStatus('error'); }
    finally { setIsFetching(false); setTimeout(() => setFetchStatus(null), 3000); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    update(id, { img: saveImage(await compressImageFile(file)) });
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div className="flex flex-col p-3 gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        {badge}
        {dragHandleProps && (
          <div {...dragHandleProps} aria-label="ドラッグして並び替え" className="flex-shrink-0 h-11 w-11 flex items-center justify-center cursor-grab text-ink border-2 border-ink active:bg-ink active:text-white" style={{ touchAction: 'none' }}>
            <GripVertical className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* ジャンル（横幅いっぱいに並べて1つあたりのタップ範囲を広く取る） */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1" role="group" aria-label="ジャンル" onClick={stop}>
        {GENRES.map(g => (
          <button
            key={g.id}
            type="button"
            aria-pressed={genre === g.id}
            onClick={(e) => { e.stopPropagation(); update(id, { genre: g.id }); }}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 border-[1.5px] ${genre === g.id ? 'bg-ink text-white border-ink' : 'bg-white text-muted border-line active:bg-mist'}`}
          >
            <g.icon size={16} />
            <span className="text-[9px] font-black leading-none">{g.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2" onClick={stop}>
        <input
          type="text"
          value={localTitle}
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

      {/* 枠全体が入力欄のタップ範囲になるよう label で包む */}
      <div className="grid grid-cols-2 gap-2" onClick={stop}>
        <label className="flex items-center gap-2 bg-mist px-2.5 min-h-[44px] border border-line cursor-text">
          <User className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            value={localAuthor}
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
            onChange={e => update(id, { createdAt: fromDateInputValue(e.target.value) })}
            aria-label="日付"
            className="bg-transparent border-none outline-none text-ink font-bold w-full py-2"
          />
        </label>
      </div>

      {rankingId && (
        <div className="flex items-center justify-between gap-2 bg-mist px-2.5 py-1.5 border border-line" onClick={stop}>
          <span className="text-[11px] font-black text-muted">順位変更</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="順位を上げる"
              onClick={(e) => { e.stopPropagation(); onMove(Math.max(1, rank - 1)); }}
              className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white text-ink active:bg-ink active:text-white"
            >
              <Minus size={16} strokeWidth={3} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              aria-label="順位"
              key={`expanded-${id}-${rank}`}
              defaultValue={rank}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0 && val !== rank) onMove(val);
              }}
              className="w-14 h-11 bg-ink text-white font-fes text-center outline-none focus:ring-2 focus:ring-coral"
            />
            <button
              type="button"
              aria-label="順位を下げる"
              onClick={(e) => { e.stopPropagation(); onMove(Math.min(100, rank + 1)); }}
              className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white text-ink active:bg-ink active:text-white"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" onClick={stop}>
        <div className="flex items-center justify-between gap-2 bg-mist px-2.5 py-1.5 border border-line">
          <span className="flex items-center gap-1.5 text-[11px] font-black text-muted"><Star size={13} />スコア</span>
          <ScoreRating rating={rating} onRatingChange={v => update(id, { rating: v })} />
        </div>
        <div className="flex items-center justify-between gap-2 bg-mist px-2.5 py-1.5 border border-line">
          <span className="flex items-center gap-1.5 text-[11px] font-black text-muted"><Eye size={13} />閲覧回数</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="閲覧回数を減らす" onClick={(e) => { e.stopPropagation(); update(id, { views: Math.max(0, views - 1) }); }} className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white active:bg-ink active:text-white"><Minus size={16} strokeWidth={3} /></button>
            <span className="font-fes text-[15px] min-w-[28px] text-center">{views}</span>
            <button type="button" aria-label="閲覧回数を増やす" onClick={(e) => { e.stopPropagation(); update(id, { views: views + 1 }); }} className="w-11 h-11 flex items-center justify-center border-2 border-ink bg-white active:bg-ink active:text-white"><Plus size={16} strokeWidth={3} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2" onClick={stop}>
        <label className="bg-mist px-2.5 min-h-[44px] border border-line flex items-center gap-2 cursor-text">
          <Clock className="w-4 h-4 text-muted flex-shrink-0" />
          <input type="number" inputMode="decimal" min="0" aria-label="所要時間" value={duration || ''} onChange={e => update(id, { duration: e.target.value === '' ? 0 : (genre === 'game' ? parseFloat(e.target.value) : parseInt(e.target.value)) })} className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" placeholder="所要時間" />
          <span className="text-[11px] font-black text-muted flex-shrink-0">{genre === 'game' ? '時間' : '分'}</span>
        </label>
        {(genre === 'anime' || genre === 'drama') && (
          <label className="bg-mist px-2.5 min-h-[44px] border border-line flex items-center gap-2 cursor-text">
            <Tv className="w-4 h-4 text-muted flex-shrink-0" />
            <input type="number" inputMode="numeric" min="0" aria-label="話数" value={episodes || ''} onChange={e => update(id, { episodes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" placeholder="話数" />
            <span className="text-[11px] font-black text-muted flex-shrink-0">話</span>
          </label>
        )}
        {genre === 'manga' && (
          <label className="bg-mist px-2.5 min-h-[44px] border border-line flex items-center gap-2 cursor-text">
            <BookOpen className="w-4 h-4 text-muted flex-shrink-0" />
            <input type="number" inputMode="numeric" min="0" aria-label="巻数" value={volumes || ''} onChange={e => update(id, { volumes: e.target.value === '' ? '' : parseInt(e.target.value) })} className="bg-transparent border-none outline-none text-ink font-bold w-full py-2" placeholder="巻数" />
            <span className="text-[11px] font-black text-muted flex-shrink-0">巻</span>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2 bg-mist px-2.5 py-1.5 border border-line" onClick={stop}>
        <Type className="w-4 h-4 text-muted flex-shrink-0" />
        <input
          type="range"
          min="12"
          max="32"
          aria-label="文字サイズ"
          value={localFontSize}
          onChange={(e) => { const v = parseInt(e.target.value); setLocalFontSize(v); update(id, { fontSize: v }); }}
          className="flex-1 min-w-0 h-11 accent-teal"
        />
        <button type="button" aria-pressed={isBold} onClick={(e) => { e.stopPropagation(); update(id, { isBold: !isBold }); }} className={`flex-shrink-0 min-h-[44px] px-3 border-2 text-[11px] font-black ${isBold ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink'}`}>BOLD</button>
        <label className="flex-shrink-0 w-11 h-11 flex items-center justify-center border-2 border-ink bg-white cursor-pointer" title="文字色">
          <input type="color" aria-label="文字色" value={color} onChange={e => update(id, { color: e.target.value })} className="w-7 h-7 bg-transparent border-none cursor-pointer p-0" />
        </label>
      </div>

      <div className="relative w-full aspect-video overflow-hidden border border-line bg-mist" onClick={stop}>
        {img ? <Img k={img} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2"><ImageIcon className="w-8 h-8 opacity-40" /><span className="text-[10px] font-black">NO IMAGE</span></div>}
        <label className="absolute right-2 bottom-2 min-h-[44px] px-4 flex items-center gap-1.5 bg-ink text-white text-[12px] font-black cursor-pointer active:bg-teal">
          <ImageIcon className="w-4 h-4" />画像を変更
          <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
        </label>
      </div>
    </div>
  );
}

// 通常表示のカード
function ViewCard({ item, genre, rank, collapsed, dragHandleProps, isSelectable, isSelectedForBulk, onToggleSelect, settings, badge }) {
  const { id, title, author, createdAt, img, isBold = false, color = '#ffffff', fontSize = 16, views = 0, rating = 0, previousRanks = [], episodes = 1, volumes = 1 } = item;
  const { totalHours } = getItemMetrics({ ...item, genre }, settings);
  const dateObj = createdAt ? new Date(createdAt) : null;
  const formattedDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString('ja-JP').split('/').slice(1).join('/') : '';
  const lastRank = previousRanks.length > 0 ? previousRanks[previousRanks.length - 1].rank : null;

  return (
    <div className="flex gap-3">
      {isSelectable && (
        <button
          type="button"
          aria-pressed={isSelectedForBulk}
          aria-label={isSelectedForBulk ? '選択を外す' : '選択する'}
          className="flex-shrink-0 self-center p-2.5 -m-2.5"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(id); }}
        >
          <span className={`w-6 h-6 border-2 border-ink flex items-center justify-center ${isSelectedForBulk ? 'bg-ink' : 'bg-white'}`}>
            {isSelectedForBulk && <CheckCircle2 className="w-4 h-4 text-white" />}
          </span>
        </button>
      )}
      {badge}

      <div className="flex-1 min-w-0 grid gap-1.5">
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">
            <h3
              className={`leading-tight break-words ${collapsed ? 'truncate' : ''} ${isBold ? 'font-black' : 'font-bold'}`}
              style={{ color: readableTitleColor(color), fontSize: collapsed ? '14px' : `${fontSize}px` }}
            >
              {title || 'Untitled'}
            </h3>
            {!collapsed && author && (
              <p className="text-[11px] text-muted font-bold truncate mt-0.5">{author}</p>
            )}
            {collapsed && lastRank !== null && lastRank !== rank && (
              <p className="text-[10px] text-muted font-bold mt-0.5">
                <History size={9} className="inline -mt-0.5 mr-0.5" />{lastRank}位 → <span className="text-coral">{rank}位</span>
              </p>
            )}
          </div>
          {!collapsed && img && <Img k={img} className="flex-shrink-0 w-[72px] h-[48px] object-cover" />}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 w-11 h-11 -my-1 flex items-center justify-center cursor-grab text-ink border-2 border-ink active:bg-ink active:text-white"
              style={{ touchAction: 'none' }}
            >
              <GripVertical size={16} />
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="flex flex-wrap gap-1">
              <span className="fes-tag text-white" style={{ backgroundColor: GENRE_COLORS[genre], borderColor: GENRE_COLORS[genre] }}>
                {GENRE_LABELS[genre] || genre}
              </span>
              {(genre === 'manga' || genre === 'anime' || genre === 'drama') && (
                <span className="fes-tag">{genre === 'manga' ? `全${volumes || 1}巻` : `全${episodes || 1}話`}</span>
              )}
              <span className="fes-tag font-fes">{rating}pt</span>
              {totalHours > 0 && (
                <span className="fes-tag"><Clock className="w-2.5 h-2.5 mr-0.5" />{totalHours.toFixed(1)}h</span>
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
                  onClick={(e) => { e.stopPropagation(); update(id, { views: Math.max(0, (views || 0) - 1) }); }}
                  className="relative w-7 h-7 flex items-center justify-center border-[1.5px] border-ink active:bg-ink active:text-white after:content-[''] after:absolute after:-inset-2.5"
                >
                  <Minus size={11} strokeWidth={3} />
                </button>
                <span className="font-fes text-[13px] min-w-[18px] text-center">{views}</span>
                <button
                  type="button"
                  aria-label="閲覧回数を増やす"
                  onClick={(e) => { e.stopPropagation(); update(id, { views: (views || 0) + 1 }); }}
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
  );
}

// 作品カード。id だけを受け取り、その作品のデータが変わった時だけ描き直す
function RankingItem({ id, isEditMode, isReorderMode = false, isCollapsed = false, dragHandleProps, historyOnMove = false, onMoved, isSelectable = false, isSelectedForBulk = false, onToggleSelect = null }) {
  const cardRef = useRef(null);

  const item = useStore(s => s.items[id]);
  const rankingId = useStore(s => getPlacement(s).get(id)?.rankingId ?? null);
  const rank = useStore(s => { const p = getPlacement(s).get(id); return p ? p.index + 1 : undefined; });
  const rankingGenre = useStore(s => (rankingId ? s.rankings.find(r => r.id === rankingId)?.genre : undefined));
  const settings = useStore(s => s.settings);
  if (!item) return null;
  const genre = normalizeGenre(item.genre || rankingGenre);

  const handleMove = (newRank) => {
    if (!rankingId) return;
    useStore.getState().moveItem(rankingId, id, newRank, { captureHistory: historyOnMove });
    onMoved?.(newRank);
    // 移動先へスクロールして一瞬強調する
    setTimeout(() => {
      const el = cardRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-coral');
      setTimeout(() => el.classList.remove('ring-4', 'ring-coral'), 1000);
    }, 100);
  };

  const collapsed = isCollapsed;
  const badge = <RankBadge rank={rank} inRanking={!!rankingId} collapsed={collapsed} title={item.title} onAdd={() => openAdd(id)} />;

  return (
    <>
      <div
        ref={cardRef}
        data-item-id={id}
        className={`cv-card relative flex flex-col cursor-pointer ${isEditMode ? 'border-2 border-ink bg-white' : 'select-none border-t-[3px] border-ink bg-white pt-2.5 pb-1 active:bg-mist'}`}
        onClick={(e) => {
          if (isReorderMode && dragHandleProps) return;
          // ポータル内（詳細モーダル）からバブリングしてきたクリックは無視
          if (!e.currentTarget.contains(e.target)) return;
          // カード内のボタンや入力欄などの操作ではモーダルを開かない
          if (e.target.closest('button, input, textarea, select, label, a, [role="button"]')) return;
          openDetail(id);
        }}
      >
        {isEditMode ? (
          <EditCard item={item} genre={genre} rank={rank} rankingId={rankingId} dragHandleProps={dragHandleProps} onMove={handleMove} badge={badge} />
        ) : (
          <ViewCard item={item} genre={genre} rank={rank} collapsed={collapsed} dragHandleProps={dragHandleProps} isSelectable={isSelectable} isSelectedForBulk={isSelectedForBulk} onToggleSelect={onToggleSelect} settings={settings} badge={badge} />
        )}
      </div>
    </>
  );
}

export default memo(RankingItem);
