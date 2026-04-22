import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
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
  Target
} from 'lucide-react';

const GENRE_LABELS = {
  anime: 'アニメ',
  manga: '漫画',
  movie: '映画',
  drama: 'ドラマ',
  game: 'ゲーム',
  music: '音楽',
  other: 'その他'
};

const GENRE_COLORS = {
  anime: '#7c3aed', // Violet
  manga: '#ec4899', // Pink
  movie: '#ef4444', // Red
  drama: '#f59e0b', // Amber
  game: '#0ea5e9',  // Sky
  music: '#10b981', // Emerald
  other: '#64748b'  // Slate
};

export default function StatsView() {
  const getAllItems = useStore(state => state.getAllItems);
  const rankings = useStore(state => state.rankings);
  const unrankedItems = useStore(state => state.unrankedItems);
  
  // Memoized statistical calculations
  const stats = useMemo(() => {
    const allItems = getAllItems();
    const rankedItems = allItems.filter(item => item.isSelected && item.title);
    
    // 1. Genre Distribution
    const genreCounts = {};
    allItems.forEach(item => {
      const g = item.genre || 'other';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    
    const genreData = Object.entries(genreCounts).map(([genre, count]) => ({
      name: GENRE_LABELS[genre] || genre,
      value: count,
      color: GENRE_COLORS[genre] || GENRE_COLORS.other
    })).sort((a, b) => b.value - a.value);

    // 2. Score Distribution (Histogram)
    const scoreBins = [
      { range: '100', min: 100, max: 100, count: 0 },
      { range: '90s', min: 90, max: 99, count: 0 },
      { range: '80s', min: 80, max: 89, count: 0 },
      { range: '70s', min: 70, max: 79, count: 0 },
      { range: '60s', min: 60, max: 69, count: 0 },
      { range: '<60', min: 0, max: 59, count: 0 },
    ];
    
    allItems.forEach(item => {
      if (item.rating > 0) {
        const bin = scoreBins.find(b => item.rating >= b.min && item.rating <= b.max);
        if (bin) bin.count++;
      }
    });

    // 3. Hall of Fame (Rating 100 & Views >= 5)
    const hallOfFame = allItems.filter(item => item.rating === 100 && (item.views || 0) >= 5);

    // 4. Genre Average Scores
    const genreScores = {};
    allItems.forEach(item => {
      if (item.rating > 0) {
        const g = item.genre || 'other';
        if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
        genreScores[g].total += item.rating;
        genreScores[g].count += 1;
      }
    });

    const genreAverages = Object.entries(genreScores)
      .map(([genre, data]) => ({
        name: GENRE_LABELS[genre] || genre,
        avg: Math.round((data.total / data.count) * 10) / 10,
        count: data.count,
        color: GENRE_COLORS[genre] || GENRE_COLORS.other
      }))
      .sort((a, b) => b.avg - a.avg);

    return {
      totalCount: allItems.length,
      genreData,
      scoreBins,
      hallOfFame,
      genreAverages
    };
  }, [rankings, unrankedItems, getAllItems]);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            <TrendingUp className="text-accent" />
            Stats
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Data Analysis Dashboard</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Collection</p>
          <p className="text-3xl font-black text-accent font-mono leading-none">{stats.totalCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Genre Ratio Chart */}
        <section className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
              <PieIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Genre Ratio</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ジャンル別比率</p>
            </div>
          </div>
          
          <div className="h-64 relative">
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
                >
                  {stats.genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ratio</span>
              <span className="text-xl font-black text-white italic">ANALYSIS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {stats.genreData.map((genre) => (
              <div key={genre.name} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: genre.color }} />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{genre.name}</span>
                </div>
                <div className="text-right">
                   <span className="text-xs font-black text-white font-mono">{genre.value}</span>
                   <span className="text-[8px] font-bold text-slate-500 ml-1">({Math.round((genre.value / stats.totalCount) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Score Distribution Histogram */}
        <section className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Score Distribution</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">スコア分布</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scoreBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="range" 
                  stroke="#475569" 
                  fontSize={10} 
                  fontWeight="bold" 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis hide />
                <RechartsTooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
             {stats.scoreBins.map(bin => (
               <div key={bin.range} className="flex items-center gap-4">
                  <span className="w-8 text-[10px] font-black text-slate-500 font-mono">{bin.range}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-1000" 
                      style={{ width: `${(bin.count / Math.max(...stats.scoreBins.map(b => b.count), 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-[10px] font-black text-white text-right font-mono">{bin.count}</span>
               </div>
             ))}
          </div>
        </section>

        {/* 3. Hall of Fame - Gold Section */}
        <section className="md:col-span-2 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 rounded-[44px] blur-[2px] opacity-20" />
          <div className="relative bg-black/60 backdrop-blur-2xl border border-yellow-500/30 rounded-[40px] p-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                  <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-yellow-500 uppercase tracking-tighter italic flex items-center gap-2">
                    Hall of Fame
                    <Crown className="w-4 h-4" />
                  </h2>
                  <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">殿堂入り作品 (100pt & 5+ Views)</p>
                </div>
              </div>
              <div className="bg-yellow-500/10 px-4 py-2 rounded-2xl border border-yellow-500/20">
                <span className="text-[10px] font-black text-yellow-600 uppercase mr-2">Inductees</span>
                <span className="text-2xl font-black text-yellow-500 font-mono">{stats.hallOfFame.length}</span>
              </div>
            </div>

            {stats.hallOfFame.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                <Star className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest italic">Legend Awaited</p>
                <p className="text-[10px] text-slate-700 font-bold mt-1">100点かつ5回以上の鑑賞で殿堂入り</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.hallOfFame.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-3xl group hover:bg-yellow-500/10 transition-all duration-500">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-yellow-500/20 shadow-lg flex-shrink-0">
                      {item.imageBase64 ? (
                        <img src={item.imageBase64} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center">
                          <Target className="w-6 h-6 text-yellow-500/30" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-white text-sm truncate uppercase italic tracking-tight">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-500 font-mono">100</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-yellow-600" />
                          <span className="text-[10px] font-black text-yellow-600 font-mono">{item.views}</span>
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase ml-auto px-2 py-0.5 bg-black/40 rounded-full border border-white/5">
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

        {/* 4. Genre Average Ranking */}
        <section className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 shadow-2xl md:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Star className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Genre Performance</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ジャンル別平均スコア</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.genreAverages.map((genre, index) => (
              <div key={genre.name} className="relative bg-white/5 border border-white/5 p-6 rounded-[32px] group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Hash className="w-12 h-12 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rank {index + 1}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: genre.color }} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">{genre.name}</h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Average</p>
                      <p className="text-3xl font-black text-accent font-mono leading-none">{genre.avg}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Samples</p>
                      <p className="text-sm font-black text-slate-400 font-mono">{genre.count}</p>
                    </div>
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
