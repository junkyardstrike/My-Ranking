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
        switch (g) {
          case 'anime': unitDuration = 20; break;
          case 'drama': unitDuration = 40; break;
          case 'movie': unitDuration = 120; break;
          case 'music': unitDuration = 3; break;
          case 'manga': unitDuration = 30; break;
          default: unitDuration = 0; break;
        }
      }

      let totalDurationPerView = unitDuration;
      if (g === 'manga') {
        const volumes = (item.volumes !== undefined && item.volumes !== null && item.volumes !== '') ? Number(item.volumes) : 1;
        totalDurationPerView = unitDuration * volumes;
      } else if (g === 'anime' || g === 'drama') {
        const episodes = (item.episodes !== undefined && item.episodes !== null && item.episodes !== '') ? Number(item.episodes) : 1;
        totalDurationPerView = unitDuration * episodes;
      }

      const durationPerView = totalDurationPerView; // For clarity in the existing loop structure
      
      const itemTotalMinutes = durationPerView * views;
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
            <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-500/50 to-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-line-run" style={{ animationDelay: '0.4s' }} />
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">Real-time Analysis</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genre Pie Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md premium-section-animate" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <PieIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider italic">ジャンル分布</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1500}
                >
                  {stats.genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {stats.genreData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black text-white">{item.value}<span className="text-[9px] ml-0.5 text-slate-500">{item.unit}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md premium-section-animate" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider italic">スコア分布</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scoreBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="range" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  animationBegin={400}
                >
                  {stats.scoreBins.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#fbbf24' : index === 1 ? '#10b981' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">殿堂入り作品数</span>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.hallOfFame.length} <span className="text-xs text-slate-500 font-normal">items in Hall of Fame</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Counter */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md premium-section-animate" style={{ animationDelay: '300ms' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-xl">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider italic">LIFETIME WATCHED</h2>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-11">累計視聴時間の解析</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tighter flex items-baseline gap-2">
              <Counter value={stats.lifetimeStats.days} />
              <span className="text-lg text-yellow-500 uppercase italic">Days</span>
              <Counter value={stats.lifetimeStats.remainingHours} />
              <span className="text-lg text-yellow-500 uppercase italic">Hours</span>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total: {stats.lifetimeStats.totalHours.toLocaleString()} Hours</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.lifetimeStats.genreLifetime.map((item, idx) => (
            <div 
              key={item.id} 
              className="group relative overflow-hidden rounded-2xl bg-black/40 border border-white/5 p-4 transition-all duration-500 hover:border-white/20 hover:-translate-y-1"
            >
              {item.bgImage && (
                <div className="absolute inset-0 z-0 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={item.bgImage} alt="" className="w-full h-full object-cover scale-110 group-hover:scale-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono leading-none">
                    <Counter value={item.hours} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">hrs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hall of Fame Highlights */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md premium-section-animate" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider italic">HALL OF FAME</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
            <Crown className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Premium Selection</span>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {stats.hallOfFame.length > 0 ? (
            stats.hallOfFame.map((item, idx) => (
              <div 
                key={item.id} 
                className="flex-shrink-0 w-40 group relative overflow-hidden rounded-2xl bg-black/40 border border-yellow-500/20 p-3 transition-all duration-500 hover:border-yellow-500/50"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative">
                  {item.imageBase64 ? (
                    <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Star className="w-8 h-8 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-yellow-500/30">
                    <span className="text-[10px] font-black text-yellow-400">{item.rating}</span>
                  </div>
                </div>
                <h3 className="text-xs font-black text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">{item.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Eye className="w-2.5 h-2.5 text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500">{item.views} Views</span>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full py-12 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-dashed border-white/10">
              <Award className="w-12 h-12 text-slate-700 mb-4 opacity-20" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Hall of Fame yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex justify-center pb-8 border-t border-white/5 pt-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm max-w-lg">
            <Info className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
              <span className="text-emerald-400">殿堂入りの条件:</span> 95点以上の評価点かつ5回以上の閲覧実績が達成された作品。
            </p>
          </div>
          <PixelWalker size={48} />
        </div>
      </div>
    </div>
  );
}
