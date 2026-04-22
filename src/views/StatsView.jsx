import { useMemo, useRef } from 'react';
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
  History
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const { key: locationKey } = location;
  const touchStartPos = useRef(null);

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

    // 3. Hall of Fame (>= 95 points & >= 5 views)
    const hallOfFame = allItems
      .filter(item => {
        const r = Number(item.rating || 0);
        const v = Number(item.views || 0);
        return r >= 95 && v >= 5;
      })
      .sort((a, b) => {
        const rA = Number(a.rating || 0);
        const rB = Number(b.rating || 0);
        if (rB !== rA) return rB - rA;
        const vA = Number(a.views || 0);
        const vB = Number(b.views || 0);
        return vB - vA;
      });

    // 4. Genre Average Scores
    const genreScores = {};
    allItems.forEach(item => {
      const r = Number(item.rating || 0);
      if (r > 0) {
        const g = item.genre || 'other';
        if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
        genreScores[g].total += r;
        genreScores[g].count += 1;
      }
    });

    const genreAverages = Object.entries(genreScores)
      .map(([genre, data]) => {
        const imgs = genreImages[genre] || [];
        const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
        
        return {
          id: genre,
          name: GENRE_LABELS[genre] || genre,
          avg: Math.ceil(data.total / data.count),
          count: data.count,
          color: GENRE_COLORS[genre] || GENRE_COLORS.other,
          bgImage: randomImg
        };
      })
      .sort((a, b) => b.avg - a.avg);

    // 5. Lifetime Counter
    const genreLifetime = {};
    let totalMinutes = 0;
    let hasHallOfFameItem = false;

    allItems.forEach(item => {
      const g = item.genre || 'other';
      const views = Number(item.views || 0);
      
      const baseDuration = (item.duration !== undefined && item.duration !== null && item.duration !== '' && Number(item.duration) > 0) ? Number(item.duration) : null;
      let unitDuration = baseDuration;
      if (unitDuration === null) {
        unitDuration = settings.defaultDurations[g] || settings.defaultDurations.movie || 60;
      }

      let totalDurationPerView = unitDuration;
      if (g === 'manga') {
        const volumes = (item.volumes !== undefined && item.volumes !== null && item.volumes !== '') ? Number(item.volumes) : 1;
        totalDurationPerView = unitDuration * volumes;
      } else if (g === 'anime' || g === 'drama') {
        const episodes = (item.episodes !== undefined && item.episodes !== null && item.episodes !== '') ? Number(item.episodes) : 1;
        totalDurationPerView = unitDuration * episodes;
      }

      const durationPerView = totalDurationPerView; 
      const finalViews = settings.useViewCount ? (views || 1) : 1;
      const itemTotalMinutes = durationPerView * finalViews;
      if (itemTotalMinutes > 0) {
        totalMinutes += itemTotalMinutes;
        genreLifetime[g] = (genreLifetime[g] || 0) + itemTotalMinutes;
        
        if (Number(item.rating || 0) >= 95 && views >= 5) {
          hasHallOfFameItem = true;
        }
      }
    });

    const lifetimeStats = {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      days: Math.floor(totalMinutes / (60 * 24)),
      remainingHours: Math.floor((totalMinutes % (60 * 24)) / 60),
      hasHallOfFameItem,
      genreLifetime: Object.entries(genreLifetime).map(([genre, mins]) => {
        const imgs = genreImages[genre] || [];
        const randomImg = imgs.length > 0 ? imgs[Math.floor(Math.random() * imgs.length)] : null;
        
        return {
          id: genre,
          name: GENRE_LABELS[genre] || genre,
          hours: Math.floor(mins / 60),
          color: GENRE_COLORS[genre] || GENRE_COLORS.other,
          bgImage: randomImg
        };
      }).sort((a, b) => b.hours - a.hours)
    };

    return {
      totalCount: allItems.length,
      genreData,
      scoreBins,
      hallOfFame,
      genreAverages,
      lifetimeStats
    };
  }, [rankings, unrankedItems, getAllItems]);

  return (
    <div className="animate-in fade-in duration-700 space-y-4 pb-32">
      <div className="flex items-start justify-between mb-10 premium-section-animate" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col gap-1">
          <div className="relative flex items-center gap-1 overflow-visible">
            <h1 
              className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-none text-transparent bg-clip-text animate-text-flash drop-shadow-[0_15px_30px_rgba(16,185,129,0.4)] pr-6"
              style={{ 
                backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%), linear-gradient(to bottom right, #d1fae5, #34d399, #047857)',
              }}
            >
              Stats
            </h1>
            <PixelItem type="potion" size={40} className="mb-1" />
            <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-500/50 to-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-line-run" />
          </div>
          <p className="text-[11px] text-slate-500 font-black tracking-[0.3em] mt-3 flex items-center gap-3">
            統計・分析ダッシュボード
            <span className="w-12 h-px bg-slate-800" />
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="inline-flex items-center gap-3 bg-emerald-500/10 px-5 py-2.5 rounded-2xl border border-emerald-500/20 shadow-lg backdrop-blur-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">総作品数</span>
            <span className="text-3xl font-black text-emerald-400 font-mono leading-none">
              <Counter value={stats.totalCount} />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 0. Lifetime Counter */}
        <section className="md:col-span-2 relative py-4 premium-section-animate" style={{ animationDelay: '100ms' }}>
          <div className="relative z-10 flex flex-col gap-8">
            {/* Top: Pixel Walker & Total */}
            <div className="flex flex-row items-center justify-center gap-4 sm:gap-10 lg:gap-20 w-full px-2">
              {/* Left: Pixel Walker */}
              <div className="flex-shrink-0 ml-8 sm:ml-16">
                 <PixelWalker className="transform scale-[1.2] origin-center translate-y-3" />
              </div>

              {/* Right: Total Time */}
              <div className="flex flex-col items-center sm:items-end text-center sm:text-right min-w-0 flex-1 sm:flex-none">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest mb-1 drop-shadow-md">累計視聴時間</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-4">Lifetime Spent</p>
                
                <div className="flex items-baseline gap-2 justify-center sm:justify-end w-full min-w-0">
                  <span className="text-4xl sm:text-5xl md:text-7xl font-black text-cyan-400 font-mono italic tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] truncate animate-pulse">
                    <Counter value={stats.lifetimeStats.totalHours} />
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-accent italic tracking-tighter drop-shadow-md flex-shrink-0">時間</span>
                </div>
                
                <div className="flex flex-col items-center sm:items-end gap-1.5 mt-4">
                  <p className="text-[10px] text-slate-500 font-medium font-sans leading-tight text-center sm:text-right">
                    ※各作品の(所要時間×話数/巻数)×閲覧回数を合算したものになります。
                  </p>
                  <p className="text-[9px] text-slate-600 font-medium font-sans leading-tight text-center sm:text-right">
                    デフォルト設定：アニメ20分 / ドラマ40分 / 映画120分 / 音楽3分 / マンガ30分(1巻)
                  </p>
                </div>
                
                {stats.lifetimeStats.days > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-2 border-cyan-400/40 px-6 py-3 rounded-2xl inline-flex flex-col items-center sm:items-end gap-1 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Time Conversion / 日付換算</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-cyan-500">約</span>
                      <span className="text-2xl font-black text-accent font-mono italic leading-none drop-shadow-md">{stats.lifetimeStats.days}</span>
                      <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">日</span>
                      <span className="text-2xl font-black text-accent font-mono italic leading-none drop-shadow-md">{stats.lifetimeStats.remainingHours}</span>
                      <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">時間</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Genre Breakdown */}
            <div className="w-full mt-2">
               <h3 className="text-sm font-black text-white tracking-widest mb-3 border-l-4 border-accent pl-2 leading-none">各ジャンルごとの累計視聴時間</h3>
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
                      <div className="relative z-10 flex flex-col justify-start">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.8)]" style={{ backgroundColor: g.color }} />
                          <span className="text-xl font-black text-white truncate drop-shadow-md tracking-wider">{g.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-5 leading-none">{g.id}</span>
                      </div>
                      <div className="relative z-10 text-right flex-shrink-0 flex items-baseline justify-end gap-1">
                        <span className="text-4xl font-black text-accent font-mono drop-shadow-md leading-none">{g.hours}</span>
                        <span className="text-sm font-black text-accent/80 drop-shadow-md">時間</span>
                      </div>
                    </div>
                  ))}
                 {stats.lifetimeStats.genreLifetime.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4 font-bold col-span-2 md:col-span-3">データがありません</p>
                 )}
               </div>
            </div>
          </div>
        </section>

        {/* 3. Hall of Fame - Open Design (No Box) */}
        <section className="md:col-span-2 relative group py-12 premium-section-animate overflow-hidden" style={{ animationDelay: '200ms' }}>
          {/* Animated Golden Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-yellow-500/10 rounded-full blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse" />
          
          <div className="relative z-10">
            {/* Background Sparkles Effect */}
            <div className="absolute -top-10 -right-10 opacity-5">
              <Sparkles className="w-48 h-48 text-yellow-500 animate-spin-slow" />
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-2xl shadow-2xl border border-yellow-200/50">
                    <Award className="w-8 h-8 text-yellow-950" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 uppercase tracking-tighter italic flex items-center flex-wrap gap-x-4 gap-y-1 drop-shadow-sm leading-none">
                    殿堂入り 
                    <span className="text-lg sm:text-xl text-yellow-600/80 font-bold tracking-normal italic normal-case">
                      (現在<Counter value={stats.hallOfFame.length} />作品)
                    </span>
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" />
                  </h2>
                  <p className="text-[11px] text-yellow-600/80 font-black uppercase tracking-[0.3em] mt-2 italic">The Golden Archive / Hall of Fame</p>
                  <p className="text-[10px] text-slate-500 font-medium font-sans mt-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                    ９５点以上の評価点かつ５回以上の閲覧実績が達成された作品
                  </p>
                </div>
              </div>
            </div>

            {stats.hallOfFame.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-yellow-500/10 rounded-[32px] bg-yellow-500/5">
                <div className="relative inline-block mb-4">
                  <Trophy className="w-16 h-16 text-slate-800 opacity-20 mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-slate-900/40">?</span>
                  </div>
                </div>
                <p className="text-sm font-black text-slate-600 uppercase tracking-[0.4em] italic">Legend Awaited</p>
                <p className="text-[10px] text-slate-700 font-bold mt-2 uppercase tracking-widest">まだ伝説は刻まれていません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.hallOfFame.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="group/card relative bg-gradient-to-br from-yellow-500/15 via-black/80 to-black/95 border border-yellow-500/30 p-3 rounded-[24px] overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-yellow-400/60 backdrop-blur-xl premium-section-animate"
                    style={{ animationDelay: `${250 + (idx * 50)}ms` }}
                  >
                    {/* Card Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/5 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000" />
                    
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="relative shrink-0">
                        <div className="absolute -inset-1 bg-yellow-500/20 rounded-2xl blur-md opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-yellow-500/30 shadow-xl bg-black relative">
                          {item.imageBase64 ? (
                            <img src={item.imageBase64} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Target className="w-6 h-6 text-yellow-500/20" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2">
                          <h3 className="font-black text-white text-xl sm:text-2xl truncate uppercase italic tracking-tight group-hover/card:text-yellow-200 transition-colors leading-none drop-shadow-md pr-12">{item.title}</h3>
                        </div>

                        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 shadow-inner shrink-0">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-base font-black text-yellow-400 font-mono italic">{item.rating}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <Eye className="w-4 h-4 text-yellow-600/60" />
                            <span className="text-sm font-black text-yellow-600/80 font-mono italic">{item.views}回</span>
                          </div>
                        </div>

                        {/* Ranking Evolution Trend */}
                        {item.previousRanks && item.previousRanks.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-yellow-500/10">
                            <History className="w-3 h-3 text-yellow-500/40" />
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                              {item.previousRanks.slice(-3).map((hist, hIdx) => (
                                <span key={hIdx} className="text-[9px] font-black text-slate-500 italic whitespace-nowrap">
                                  {hist.rank}位 <span className="mx-0.5 opacity-20">→</span>
                                </span>
                              ))}
                              <span className="text-[9px] font-black text-yellow-500 italic whitespace-nowrap">現在</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Diagonal Genre Ribbon - Enlarged Text */}
                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
                       <div className="absolute top-0 right-0 bg-yellow-500/30 text-yellow-200 text-[13px] font-black uppercase tracking-[0.1em] py-2 px-12 translate-x-[25%] translate-y-[25%] rotate-45 border-b-2 border-yellow-400/50 backdrop-blur-md shadow-[0_5px_20px_rgba(0,0,0,0.4)] whitespace-nowrap">
                          {GENRE_LABELS[item.genre] || 'OTHER'}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* DASHBOARD DIVIDER */}
        <div className="md:col-span-2 mt-8 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic mb-1">Dashboard</p>
              <h2 className="text-xl font-black text-white/40 uppercase tracking-tighter italic">ダッシュボード</h2>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>

        {/* 1. Genre Ratio Chart */}
        <section className="bg-black/40 border border-white/5 rounded-[32px] px-6 py-2 shadow-2xl relative overflow-hidden group premium-section-animate" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
                <PieIcon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Genre Ratio</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ジャンル別比率</p>
              </div>
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

          <div className="grid grid-cols-2 gap-2 mb-4">
            {stats.genreData.map((genre) => (
              <div key={genre.name} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
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

        {/* 2. Score Distribution */}
        <section className="bg-white/5 rounded-[40px] p-6 border border-white/5 shadow-2xl premium-section-animate" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start justify-between mb-8">
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
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-1000" 
                      style={{ width: `${(bin.count / Math.max(...stats.scoreBins.map(b => b.count), 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-[10px] font-black text-white text-right font-mono">{bin.count}<span className="text-[9px] text-slate-600 ml-0.5">作品</span></span>
               </div>
             ))}
          </div>
        </section>


        {/* 4. Genre Average Ranking */}
        <section className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl md:col-span-2 premium-section-animate" style={{ animationDelay: '600ms' }}>
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
            {stats.genreAverages.map((genre, index) => (
              <div key={genre.id} className="relative bg-white/5 border border-white/5 p-4 rounded-[24px] group overflow-hidden h-36 flex flex-col justify-between shadow-lg">
                {/* Random Genre Overlay Image */}
                {genre.bgImage && (
                  <div className="absolute inset-0 z-0 opacity-25 md:group-hover:opacity-40 transition-opacity duration-700">
                    <img src={genre.bgImage} alt="" className="w-full h-full object-cover grayscale brightness-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-accent uppercase tracking-widest leading-none drop-shadow-md">{genre.id.toUpperCase()}</span>
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.8)]" style={{ backgroundColor: genre.color }} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter truncate drop-shadow-md">{genre.name}</h3>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none drop-shadow-md">Average</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 mt-0.5">平均点</p>
                    <p className="text-4xl font-black text-accent font-mono leading-none tracking-tighter drop-shadow-md">{genre.avg}<span className="text-sm ml-0.5 italic">点</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 drop-shadow-md">Count</p>
                    <p className="text-base font-black text-white font-mono leading-none drop-shadow-md">{genre.count}<span className="text-[10px] ml-1 text-slate-400">{GENRE_UNITS[genre.id] || '作品'}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
            <Info className="w-3.5 h-3.5 text-accent opacity-60" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              ※平均スコアは統計上の理由により、小数点以下を切り上げて表示しています
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
