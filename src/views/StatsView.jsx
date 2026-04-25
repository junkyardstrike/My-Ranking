import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import PixelWalker from '../components/common/PixelWalker';
import PixelItem from '../components/common/PixelItem';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  Trophy, 
  Crown, 
  Star, 
  TrendingUp, 
  Hash,
  Eye,
  Target,
  LayoutGrid,
  Clock,
  Sparkles,
  Award,
  Info,
  History,
  ChevronDown,
  X,
  PlusSquare
} from 'lucide-react';
import Counter from '../components/common/Counter';

const GENRE_LABELS = {
  anime: 'アニメ',
  manga: '漫画',
  movie: '映画',
  drama: 'ドラマ',
  game: 'ゲーム',
  music: '音楽',
  other: 'その他'
};

const GENRE_UNITS = {
  manga: '冊',
  anime: '作品',
  movie: '作品',
  drama: '作品',
  game: '作品',
  music: '曲',
  other: '作品'
};

const GENRE_COLORS = {
  anime: '#7c3aed', 
  manga: '#ec4899', 
  movie: '#ef4444', 
  drama: '#f59e0b', 
  game: '#0ea5e9',  
  music: '#10b981', 
  other: '#64748b'  
};

export default function StatsView() {
  const getAllItems = useStore(state => state.getAllItems);
  const rankings = useStore(state => state.rankings);
  const unrankedItems = useStore(state => state.unrankedItems);
  const settings = useStore(state => state.settings) || {
    defaultDurations: { movie: 120, music: 3, anime: 20, drama: 40, manga: 30, game: 60 },
    useViewCount: true
  };
  
  const location = useLocation();
  const [isHallOfFameExpanded, setIsHallOfFameExpanded] = useState(false);
  const [selectedHallItem, setSelectedHallItem] = useState(null);

  // Reset expanded state on tab mount
  useEffect(() => {
    setIsHallOfFameExpanded(false);
  }, [location.pathname]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (selectedHallItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedHallItem]);

  const stats = useMemo(() => {
    const allItems = getAllItems();
    
    // 1. Genre Distribution
    const genreCounts = {};
    const genreImages = {};

    allItems.forEach(item => {
      const g = item.genre || 'other';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
      
      if (item.imageBase64) {
        if (!genreImages[g]) genreImages[g] = [];
        genreImages[g].push(item.imageBase64);
      }
    });
    
    const genreData = Object.entries(genreCounts).map(([genre, count]) => ({
      id: genre,
      name: GENRE_LABELS[genre] || genre,
      value: count,
      color: GENRE_COLORS[genre] || GENRE_COLORS.other,
      unit: GENRE_UNITS[genre] || '作品'
    })).sort((a, b) => b.value - a.value);

    // 2. Score Distribution
    const scoreBins = [
      { range: '100点', min: 100, max: 100, count: 0 },
      { range: '90点台', min: 90, max: 99, count: 0 },
      { range: '80点台', min: 80, max: 89, count: 0 },
      { range: '70点台', min: 70, max: 79, count: 0 },
      { range: '60点台', min: 60, max: 69, count: 0 },
      { range: '60点以下', min: 0, max: 59, count: 0 },
    ];
    
    allItems.forEach(item => {
      const r = Number(item.rating || 0);
      if (r > 0) {
        const bin = scoreBins.find(b => r >= b.min && r <= b.max);
        if (bin) bin.count++;
      }
    });

    // 3. Hall of Fame
    const hallOfFame = allItems
      .filter(item => {
        const r = Number(item.rating || 0);
        const v = Number(item.views || 0);
        return r >= 95 && v >= 5;
      })
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

    // 4. Lifetime Stats
    let totalMinutes = 0;
    const genreLifetime = {};

    allItems.forEach(item => {
      const g = item.genre || 'other';
      const duration = Number(item.duration) || settings.defaultDurations[g] || 20;
      const episodes = Number(item.episodes || item.volumes || 1);
      const views = settings.useViewCount ? Number(item.views || 1) : 1;
      const mins = duration * episodes * views;
      
      totalMinutes += mins;
      genreLifetime[g] = (genreLifetime[g] || 0) + mins;
    });

    const lifetimeStats = {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      days: Math.floor(totalMinutes / (60 * 24)),
      remainingHours: Math.floor((totalMinutes % (60 * 24)) / 60),
      genreLifetime: Object.entries(genreLifetime).map(([id, mins]) => ({
        id,
        name: GENRE_LABELS[id],
        hours: Math.floor(mins / 60),
        color: GENRE_COLORS[id],
        bgImage: genreImages[id] ? genreImages[id][Math.floor(Math.random() * genreImages[id].length)] : null
      })).sort((a, b) => b.hours - a.hours)
    };

    // 5. Genre Averages
    const genreAverages = Object.entries(GENRE_LABELS).map(([id, name]) => {
      const items = allItems.filter(i => i.genre === id);
      const count = items.length;
      const avg = count > 0 ? items.reduce((sum, i) => sum + Number(i.rating || 0), 0) / count : 0;
      return {
        id,
        name,
        avg: parseFloat(avg.toFixed(1)),
        count,
        color: GENRE_COLORS[id],
        bgImage: genreImages[id] ? genreImages[id][Math.floor(Math.random() * genreImages[id].length)] : null
      };
    }).filter(g => g.count > 0).sort((a, b) => b.avg - a.avg);

    return {
      totalCount: allItems.length,
      genreData,
      scoreBins,
      hallOfFame,
      lifetimeStats,
      genreAverages
    };
  }, [rankings, unrankedItems, getAllItems, settings]);

  if (!stats) return null;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 pt-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center px-4 mb-10 relative">
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 tracking-tighter uppercase italic leading-none drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)] px-8">
          RANKING STATS
        </h1>
        <div className="flex flex-col items-center gap-2 mt-4">
          <p className="text-[11px] text-cyan-400 font-black uppercase tracking-[0.1em] italic leading-none">Analytics / 統計データ</p>
          <div className="h-1 w-20 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 sm:px-4">
        {/* Lifetime Stats */}
        <section className="md:col-span-2 relative py-4 premium-section-animate" style={{ animationDelay: '100ms' }}>
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex-shrink-0 ml-4">
                 <PixelWalker 
                    className="transform scale-[1.2] sm:scale-[1.3] origin-left translate-y-3" 
                    stats={{
                      totalCount: stats.totalCount,
                      hallOfFameCount: stats.hallOfFame.length,
                      totalHours: stats.lifetimeStats.totalHours
                    }}
                  />
              </div>

              <div className="flex flex-col items-end text-right min-w-0 flex-1 pr-6 sm:pr-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-widest mb-1 drop-shadow-md">累計視聴時間</h2>
                <div className="flex items-baseline gap-1 justify-end w-full min-w-0">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-black text-cyan-400 font-mono italic tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse pr-1">
                    <Counter value={stats.lifetimeStats.totalHours} />
                  </span>
                  <span className="text-lg sm:text-xl font-black text-accent italic tracking-tighter drop-shadow-md flex-shrink-0">時間</span>
                </div>
                
                <div className="flex flex-col items-end gap-1.5 mt-3 max-w-[220px] w-full">
                  <p className="text-[10px] text-slate-400 font-black leading-tight text-right whitespace-pre-line tracking-tighter">
                    ※(所要時間×話数/巻)×閲覧回数を<br />合算した概算値です。
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold leading-tight text-right opacity-80">
                    アニメ20分 / ドラマ40分 / 映画120分<br />
                    漫画30分 / 音楽3分
                  </p>
                </div>
                
                {stats.lifetimeStats.days > 0 && (
                  <div className="mt-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-2 border-cyan-400/40 px-4 py-2.5 rounded-xl inline-flex flex-col items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.2)] w-fit">
                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest leading-none">Conversion / 日付換算</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[8px] font-black text-cyan-500">約</span>
                      <span className="text-xl font-black text-accent font-mono italic leading-none">{stats.lifetimeStats.days}</span>
                      <span className="text-[8px] font-black text-cyan-500 uppercase">日</span>
                      <span className="text-xl font-black text-accent font-mono italic leading-none">{stats.lifetimeStats.remainingHours}</span>
                      <span className="text-[8px] font-black text-cyan-500 uppercase">時間</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full mt-2 px-2">
               <h3 className="text-sm font-black text-white tracking-widest mb-3 border-l-4 border-accent pl-2 leading-none uppercase italic">Genre Time Stats / ジャンル別視聴時間</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {stats.lifetimeStats.genreLifetime.map(g => (
                    <div 
                      key={g.id} 
                      className="relative h-28 rounded-xl overflow-hidden group shadow-lg border border-white/10 flex flex-col justify-between p-3.5 bg-black/40 text-left w-full"
                    >
                      {g.bgImage && (
                        <div className="absolute inset-0 z-0 opacity-30 transition-opacity duration-500">
                           <img src={g.bgImage} alt="" className="w-full h-full object-cover grayscale brightness-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </div>
                      )}
                      
                      <div className="absolute top-2.5 right-3 z-20 text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 drop-shadow-md">Count</p>
                        <p className="text-sm font-black text-white font-mono leading-none drop-shadow-md">
                          {stats.genreData.find(gd => gd.id === g.id)?.value || 0}
                          <span className="text-[9px] ml-0.5 text-slate-400 font-bold">{GENRE_UNITS[g.id] || '作品'}</span>
                        </p>
                      </div>

                      <div className="relative z-10 flex flex-col justify-start -mt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{ backgroundColor: g.color }} />
                          <span className="text-xl font-black text-white truncate drop-shadow-md tracking-wider">{g.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-5 leading-none">{g.id}</span>
                      </div>
                      <div className="relative z-10 text-right flex-shrink-0 flex items-baseline justify-end gap-1">
                        <span className="text-4xl font-black text-accent font-mono drop-shadow-md">{g.hours}</span>
                        <span className="text-sm font-black text-accent/80 drop-shadow-md">時間</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Hall of Fame - Cinematic Redesign */}
        <section className="md:col-span-2 relative py-12 px-2 overflow-hidden group premium-section-animate" style={{ animationDelay: '200ms' }}>
          {/* Section Header */}
          <div className="flex flex-col items-center mb-10 font-serif">
            <div className="flex flex-col items-center gap-1 mb-4">
              <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-[0.8em] leading-none mb-2">RATING STATS</p>
              <h2 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter leading-none drop-shadow-2xl pr-4">殿堂入り</h2>
            </div>
            <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
            </div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto">
            {/* Archived Count - Clean Typography */}
            <div className="flex items-center justify-center mb-6 animate-in slide-in-from-top duration-700 font-serif">
              <p className="text-xl sm:text-3xl font-black text-white italic tracking-tighter pr-4">
                選出数：<span className="text-3xl sm:text-5xl text-yellow-500 mx-1 drop-shadow-lg pr-2">{stats.hallOfFame.length}</span>作品
              </p>
            </div>

            {/* Selection Criteria - Yellow Framed Box */}
            <div className="mb-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 px-8 py-5 bg-black/60 border-2 border-yellow-500 backdrop-blur-2xl rounded-xl relative font-serif">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">MIN RATING</span>
                  <span className="text-xs font-black text-white/60 uppercase">最小評価点</span>
                </div>
                <span className="text-3xl font-black text-white italic pr-2">95<span className="text-[11px] ml-1 text-yellow-500/60 uppercase">pts</span></span>
              </div>
              
              <div className="w-px h-10 bg-yellow-500/20 hidden sm:block" />
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">REQ VIEWS</span>
                  <span className="text-xs font-black text-white/60 uppercase">最低視聴回数</span>
                </div>
                <span className="text-3xl font-black text-white italic pr-2">5<span className="text-[11px] ml-1 text-yellow-500/60 uppercase">views</span></span>
              </div>
            </div>

            {stats.hallOfFame.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[48px] bg-white/[0.02] font-serif">
                <Trophy className="w-16 h-16 text-slate-800 opacity-20 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-700 uppercase tracking-[0.5em] italic">No Legends Yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {stats.hallOfFame.slice(0, isHallOfFameExpanded ? undefined : 6).map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedHallItem(item)}
                    className="group/card relative aspect-square rounded-2xl sm:rounded-[40px] overflow-hidden shadow-2xl border border-white/5 transition-all duration-500 hover:scale-[1.02] active:scale-95 cursor-pointer bg-[#0c0a10] flex flex-col justify-between"
                    style={{ animationDelay: `${250 + (idx * 50)}ms` }}
                  >
                    {/* Background Image with Cinematic Overlay */}
                    <div className="absolute inset-0 z-0">
                      {item.imageBase64 ? (
                        <img src={item.imageBase64} alt="" className="w-full h-full object-cover opacity-40 transition-all duration-1000" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-black" />
                      )}
                      {/* Lighter Dark Overlay for Title Area */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                    </div>

                    {/* Top Row: Score Only (Plus Button Removed) */}
                    <div className="relative z-20 p-4 sm:p-8 flex items-start justify-between w-full">
                      <div className="flex flex-col pointer-events-none">
                        <span className="text-[8px] sm:text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">RATING</span>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                          <span className="text-4xl sm:text-8xl font-black text-yellow-500 italic leading-none tracking-tighter drop-shadow-[0_0_25px_rgba(234,179,8,0.8)] font-serif pr-4">
                            {item.rating}
                          </span>
                          <span className="text-sm sm:text-4xl font-black text-yellow-500 italic drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] pr-2">PT</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Analytics (Simplified) */}
                    <div className="relative z-20 px-4 sm:px-8 flex items-center gap-2 sm:gap-4 -mt-4 sm:-mt-8">
                       <Eye className="w-4 h-4 sm:w-8 h-8 text-accent drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]" />
                       <div className="flex flex-col">
                         <span className="text-[7px] sm:text-[10px] font-black text-white/80 uppercase tracking-widest leading-none mb-0.5 sm:mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Views</span>
                         <span className="text-xs sm:text-2xl font-black text-white leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] font-serif pr-2">{item.views}</span>
                       </div>
                    </div>

                    {/* Bottom Section: Title ONLY (Mega Size) */}
                    <div className="relative z-20 p-4 sm:p-8 w-full mt-auto">
                      <h3 className="font-black text-yellow-500 text-base sm:text-5xl leading-tight whitespace-nowrap truncate uppercase italic tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.8)] pr-6">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {stats.hallOfFame.length > 6 && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={() => setIsHallOfFameExpanded(!isHallOfFameExpanded)}
                  className="px-10 py-4 bg-white text-black rounded-full transition-all duration-300 text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-3 hover:scale-105 active:scale-95 shadow-xl"
                >
                  {isHallOfFameExpanded ? 'CLOSE ARCHIVE' : `VIEW FULL ARCHIVE (${stats.hallOfFame.length})`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isHallOfFameExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* DashBoard Header */}
        <div className="md:col-span-2 mt-4 mb-2 px-4">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic mb-1">Dashboard</p>
              <h2 className="text-xl font-black text-white/40 uppercase tracking-tighter italic">ダッシュボード</h2>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>

        {/* Genre Ratio Chart */}
        <section className="bg-black/40 border border-white/5 rounded-[32px] px-6 py-8 shadow-2xl relative overflow-hidden group premium-section-animate" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
              <PieIcon className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Genre Ratio</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ジャンル別比率</p>
            </div>
          </div>
          
          <div className="h-40 relative pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 leading-none">Total</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white italic font-mono leading-none">
                  <Counter value={stats.totalCount} />
                </span>
                <span className="text-[11px] font-black text-accent/80 italic">作品</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-6">
            {stats.genreData.map((genre) => (
              <div key={genre.name} className="flex items-center justify-between p-2 bg-white/10 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: genre.color }} />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider truncate">{genre.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                   <span className="text-xs font-black text-white font-mono">{genre.value}<span className="text-[10px] text-slate-500 ml-1">作品</span></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Score Distribution */}
        <section className="bg-white/5 rounded-[40px] p-6 border border-white/5 shadow-2xl premium-section-animate" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-3 mb-8">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Score Distribution</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">スコア分布</p>
            </div>
          </div>

          <div className="h-40 mb-4 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scoreBins}>
                <XAxis 
                  dataKey="range" 
                  stroke="#475569" 
                  fontSize={8} 
                  fontWeight="bold" 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis hide />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
             {stats.scoreBins.map(bin => (
               <div key={bin.range} className="flex items-center gap-2">
                  <span className="w-14 text-[10px] font-black text-slate-500 font-bold whitespace-nowrap">{bin.range}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-1000" 
                      style={{ width: `${(bin.count / Math.max(...stats.scoreBins.map(b => b.count), 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-white text-right font-mono">{bin.count}<span className="text-[9px] text-slate-600 ml-0.5">作品</span></span>
               </div>
             ))}
          </div>
        </section>

        {/* Genre Average Score - Restored Layout */}
        <section className="bg-black/40 border border-white/5 rounded-[32px] px-2 py-6 sm:p-6 shadow-2xl md:col-span-2 premium-section-animate" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Star className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Genre Performance</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ジャンル別平均スコア</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.genreAverages.map((genre) => (
              <div key={genre.id} className="relative bg-black/40 border border-white/10 p-4 pb-8 rounded-[24px] group h-28 flex flex-col justify-between shadow-lg overflow-hidden">
                {/* Random Genre Overlay Image */}
                {genre.bgImage && (
                  <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-40 transition-opacity duration-700">
                    <img src={genre.bgImage} alt="" className="w-full h-full object-cover grayscale brightness-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>
                )}
                
                <div className="relative z-10 -mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none drop-shadow-md">{genre.id.toUpperCase()}</span>
                    <div className="flex flex-col items-end">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 drop-shadow-md">Count</p>
                       <p className="text-xs font-black text-white font-mono leading-none drop-shadow-md">{genre.count}<span className="text-[9px] ml-0.5 text-slate-400">{GENRE_UNITS[genre.id] || '作品'}</span></p>
                    </div>
                  </div>
                  <h3 className="text-base font-black text-white uppercase italic tracking-tighter truncate drop-shadow-md">{genre.name}</h3>
                </div>

                <div className="relative z-10 flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 drop-shadow-md">平均点</p>
                    <p className="text-3xl font-black text-accent font-mono leading-none tracking-tighter drop-shadow-md">{genre.avg}<span className="text-xs ml-0.5 italic">点</span></p>
                  </div>
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{ backgroundColor: genre.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
            <Info className="w-3.5 h-3.5 text-accent opacity-60" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              ※平均スコアは小数点表示しています。
            </p>
          </div>
        </section>
      </div>

      {/* Hall of Fame Modal */}
      {selectedHallItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedHallItem(null)} />
          <div className="relative bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in zoom-in-95 duration-300">
            <div className="relative aspect-video w-full">
              {selectedHallItem.imageBase64 ? (
                <img src={selectedHallItem.imageBase64} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Trophy className="w-20 h-20 text-yellow-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button 
                onClick={() => setSelectedHallItem(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{GENRE_LABELS[selectedHallItem.genre]}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{selectedHallItem.views} VIEWS</span>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-6 leading-tight">{selectedHallItem.title}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rating</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-yellow-400 font-mono italic">{selectedHallItem.rating}</span>
                    <span className="text-xs font-black text-yellow-500/60">pts</span>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Episodes/Volumes</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono italic">{selectedHallItem.episodes || selectedHallItem.volumes || 1}</span>
                    <span className="text-xs font-black text-slate-500">{selectedHallItem.genre === 'manga' ? '巻' : '話'}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedHallItem(null)}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-sm uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_10px_20px_rgba(234,179,8,0.3)] active:scale-95"
              >
                CLOSE DETAIL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
