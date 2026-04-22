import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
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
  Clock
} from 'lucide-react';
import Counter from '../components/common/Counter';
import PixelWalker from '../components/common/PixelWalker';

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
    const hallOfFame = allItems.filter(item => {
      const r = Number(item.rating || 0);
      const v = Number(item.views || 0);
      return r >= 95 && v >= 5;
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
          avg: Math.round((data.total / data.count) * 10) / 10,
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
      
      const isAutoCalculatedGenre = ['manga', 'anime', 'drama'].includes(g);
      let durationPerView = 0;
      if (!isAutoCalculatedGenre && item.duration !== undefined && item.duration !== null && item.duration !== '' && Number(item.duration) > 0) {
        durationPerView = Number(item.duration);
      } else {
        const episodes = (item.episodes !== undefined && item.episodes !== null && item.episodes !== '') ? Number(item.episodes) : null;
        switch (g) {
          case 'anime': durationPerView = (episodes !== null ? episodes : 1) * 20; break;
          case 'drama': durationPerView = (episodes !== null ? episodes : 1) * 40; break;
          case 'movie': durationPerView = 120; break;
          case 'music': durationPerView = 3; break;
          case 'manga': 
            const volumes = (item.volumes !== undefined && item.volumes !== null && item.volumes !== '') ? Number(item.volumes) : 1;
            durationPerView = 30 * volumes; 
            break;
          default: durationPerView = 0; break;
        }
      }
      
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
      {/* Header */}
      <div className="flex items-end justify-between px-1 mb-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            <TrendingUp className="text-accent" size={24} />
            Stats <span className="text-xs text-slate-500 not-italic ml-2 tracking-widest font-bold">/ 統計データ</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-2xl border border-accent/20">
            <span className="text-sm font-black text-slate-400">総作品数</span>
            <span className="text-3xl font-black text-accent font-mono leading-none">
              <Counter value={stats.totalCount} />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 0. Lifetime Counter */}
        <section className="md:col-span-2 relative py-4">
          <div className="relative z-10 flex flex-col gap-8">
            {/* Top: Pixel Walker & Total */}
            <div className="flex flex-row items-center justify-center gap-4 sm:gap-10 lg:gap-20 w-full px-2">
              {/* Left: Pixel Walker */}
              <div className="flex-shrink-0 ml-8 sm:ml-16">
                 <PixelWalker className="transform scale-[1.2] origin-center" />
              </div>

              {/* Right: Total Time */}
              <div className="flex flex-col items-center sm:items-end text-center sm:text-right min-w-0 flex-1 sm:flex-none">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest mb-1 drop-shadow-md">累計視聴時間</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-4">Lifetime Spent</p>
                
                <div className="flex items-baseline gap-2 justify-center sm:justify-end w-full min-w-0">
                  <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white font-mono tracking-tighter drop-shadow-xl truncate">
                    <Counter value={stats.lifetimeStats.totalHours} />
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-accent italic tracking-tighter drop-shadow-md flex-shrink-0">時間</span>
                </div>
                
                <p className="text-[9px] text-slate-500 font-bold mt-2 tracking-widest">※(各作品の(所要時間×話数/巻数) × 閲覧・視聴回数) を合算</p>
                
                {stats.lifetimeStats.days > 0 && (
                  <div className="mt-4 bg-white/5 border border-white/10 px-4 sm:px-5 py-2 rounded-full inline-flex items-center gap-2 shadow-lg">
                    <span className="text-xs font-black text-slate-300">約</span>
                    <span className="text-sm sm:text-base font-black text-white font-mono">{stats.lifetimeStats.days}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">日</span>
                    <span className="text-sm sm:text-base font-black text-white font-mono">{stats.lifetimeStats.remainingHours}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">時間</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Genre Breakdown */}
            <div className="w-full mt-2">
               <h3 className="text-sm font-black text-white tracking-widest mb-3 border-l-4 border-accent pl-2 leading-none">各ジャンルごとの累計視聴時間</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {stats.lifetimeStats.genreLifetime.map(g => (
                   <button 
                     key={g.id} 
                     onTouchStart={() => navigate('/all', { state: { filterGenre: g.id } })}
                     onClick={() => navigate('/all', { state: { filterGenre: g.id } })}
                     className="relative h-28 rounded-xl overflow-hidden group shadow-lg border border-white/10 flex flex-col justify-between p-3.5 bg-black/40 md:hover:border-accent/50 md:hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] text-left w-full block"
                     style={{ WebkitTapHighlightColor: 'transparent' }}
                   >
                      {g.bgImage && (
                        <div className="absolute inset-0 z-0 opacity-30 md:group-hover:opacity-50 transition-opacity duration-500">
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
                   </button>
                 ))}
                 {stats.lifetimeStats.genreLifetime.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4 font-bold col-span-2 md:col-span-3">データがありません</p>
                 )}
               </div>
            </div>
          </div>
        </section>

        {/* 3. Hall of Fame */}
        <section className="md:col-span-2 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 rounded-[34px] blur-[2px] opacity-20" />
          <div className="relative bg-black/60 border border-yellow-500/30 rounded-[32px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-yellow-500 uppercase tracking-tighter flex items-center gap-2">
                    殿堂入り <span className="text-[10px] text-yellow-700 font-bold tracking-widest ml-1 italic">/ Hall of Fame</span>
                  </h2>
                  <p className="text-[10px] text-yellow-600/60 font-bold uppercase tracking-widest mt-0.5">※ 95点以上かつ5回以上の鑑賞で殿堂入り</p>
                </div>
              </div>
              <div className="bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20 flex items-center gap-2">
                <span className="text-[10px] font-black text-yellow-600 uppercase">Inductees</span>
                <span className="text-xl font-black text-yellow-500 font-mono leading-none">
                  <Counter value={stats.hallOfFame.length} />
                </span>
              </div>
            </div>

            {stats.hallOfFame.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-[24px]">
                <Star className="w-8 h-8 text-slate-800 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic leading-none">Legend Awaited</p>
                <p className="text-[8px] text-slate-700 font-bold mt-1 uppercase">NO INDUCTEES YET</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.hallOfFame.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-2xl group md:hover:bg-yellow-500/10 transition-all duration-500">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-yellow-500/20 shadow-lg flex-shrink-0">
                      {item.imageBase64 ? (
                        <img src={item.imageBase64} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center">
                          <Target className="w-4 h-4 text-yellow-500/30" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-white text-xs truncate uppercase italic tracking-tight">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-500 font-mono leading-none">{item.rating}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Eye className="w-2.5 h-2.5 text-yellow-600" />
                          <span className="text-[10px] font-black text-yellow-600 font-mono leading-none">{item.views}</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase ml-auto px-1.5 py-0.5 bg-black/40 rounded-full border border-white/5">
                          {GENRE_LABELS[item.genre] || 'OTHER'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 1. Genre Ratio Chart */}
        <section className="bg-black/40 border border-white/5 rounded-[32px] px-6 py-2 shadow-2xl relative overflow-hidden group">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 leading-none">Total</span>
              <span className="text-xl font-black text-white italic font-mono leading-none">
                <Counter value={stats.totalCount} />
              </span>
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
        <section className="bg-black/40 border border-white/5 rounded-[32px] p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
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
        <section className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl md:col-span-2">
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
        </section>
      </div>
    </div>
  );
}
