import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import PixelWalker from '../components/common/PixelWalker';
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
import { getItemMetrics, getDefaultDuration } from '../utils/itemMetrics';

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
  manga: '作品',
  anime: '作品',
  movie: '作品',
  drama: '作品',
  game: '作品',
  music: '曲',
  other: '作品'
};

const GENRE_COLORS = {
  anime: '#0a7a6f',
  manga: '#c13b7a',
  movie: '#ff5a3c',
  drama: '#e2a400',
  game: '#3c5bd6',
  music: '#7a8a89',
  other: '#7a8a89'
};

function Section({ en, ja, children, className = '' }) {
  return (
    <section className={`fes-section grid gap-3 ${className}`}>
      <h2 className="fes-h">{en}<small>{ja}</small></h2>
      {children}
    </section>
  );
}

export default function StatsView() {
  const getAllItems = useStore(state => state.getAllItems);
  const rankings = useStore(state => state.rankings);
  const unrankedItems = useStore(state => state.unrankedItems);
  const settings = useStore(state => state.settings);
  
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
      { range: '60点未満', min: 0, max: 59, count: 0 },
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
    let totalHours = 0;
    const genreLifetime = {};

    allItems.forEach(item => {
      // 作品カード・詳細画面と同じ計算式を使う
      const { genre: g, totalHours: hrs } = getItemMetrics(item, settings);

      totalHours += hrs;
      genreLifetime[g] = (genreLifetime[g] || 0) + hrs;
    });

    const lifetimeStats = {
      totalHours: Math.floor(totalHours),
      days: Math.floor(totalHours / 24),
      remainingHours: Math.floor(totalHours % 24),
      genreLifetime: Object.entries(genreLifetime).map(([id, hrs]) => ({
        id,
        name: GENRE_LABELS[id],
        hours: Math.floor(hrs),
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

  const maxBin = Math.max(...stats.scoreBins.map(b => b.count), 1);
  const dd = (g) => getDefaultDuration(g, settings);

  return (
    <div className="pt-1 pb-32 grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="fes-pass">
        <p className="font-fes text-[11px] tracking-[0.04em] opacity-90">FESTIVAL REPORT</p>
        <h1 className="font-fes text-[24px] sm:text-3xl leading-tight mt-0.5">MASTERPIECE STATS</h1>
        <p className="text-[10px] font-bold tracking-[0.12em] opacity-85 mt-1">Analytics ／ 統計データ</p>
      </div>

      {/* 累計視聴時間 */}
      <Section en="LIFETIME" ja="累計視聴時間">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-baseline gap-1">
              <span className="font-fes text-[44px] sm:text-6xl leading-none text-teal"><Counter value={stats.lifetimeStats.totalHours} /></span>
              <span className="text-sm font-black">時間</span>
            </p>
            {stats.lifetimeStats.days > 0 && (
              <p className="mt-2 inline-flex items-baseline gap-1 bg-mist border-l-4 border-teal px-2.5 py-1.5 text-[11px] font-black">
                日付換算　約<span className="font-fes text-lg text-ink">{stats.lifetimeStats.days}</span>日
                <span className="font-fes text-lg text-ink">{stats.lifetimeStats.remainingHours}</span>時間
              </p>
            )}
          </div>
          <div className="flex-shrink-0 mt-14">
            <PixelWalker
              className="transform scale-[1.05] origin-bottom-right"
              stats={{
                totalCount: stats.totalCount,
                hallOfFameCount: stats.hallOfFame.length,
                totalHours: stats.lifetimeStats.totalHours
              }}
            />
          </div>
        </div>
        <div className="text-[10px] text-muted font-bold leading-relaxed">
          <p>※（所要時間×話数／巻）×閲覧回数を合算した概算値です。</p>
          <p>アニメ{dd('anime')}分／ドラマ{dd('drama')}分／映画{dd('movie')}分／漫画{dd('manga')}分／音楽{dd('music')}分（ゲームは{dd('game') > 0 ? `${dd('game')}時間` : '時間入力'}）</p>
        </div>
      </Section>

      {/* ジャンル別視聴時間 */}
      <Section en="GENRE TIME" ja="ジャンル別視聴時間">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {stats.lifetimeStats.genreLifetime.map(g => (
            <div key={g.id} className="relative overflow-hidden bg-mist border-l-4 p-2.5 min-h-[86px] flex flex-col justify-between" style={{ borderColor: g.color }}>
              {g.bgImage && <img src={g.bgImage} alt="" className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-25 grayscale" />}
              <div className="relative flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[13px] font-black truncate">{g.name}</p>
                  <p className="font-fes text-[9px] text-muted uppercase">{g.id}</p>
                </div>
                <p className="text-right text-[10px] font-bold text-muted leading-tight">
                  COUNT<br />
                  <span className="font-fes text-[13px] text-ink">{stats.genreData.find(gd => gd.id === g.id)?.value || 0}</span>
                  <span className="ml-0.5">{GENRE_UNITS[g.id] || '作品'}</span>
                </p>
              </div>
              <p className="relative text-right"><span className="font-fes text-[26px] leading-none">{g.hours}</span><span className="text-[11px] font-black ml-0.5">時間</span></p>
            </div>
          ))}
        </div>
      </Section>

      {/* 殿堂入り */}
      <Section en="HALL OF FAME" ja="殿堂入り">
        <p className="text-[13px] font-black">選出数 <span className="font-fes text-[26px] text-coral mx-1">{stats.hallOfFame.length}</span>作品</p>
        <div className="flex flex-wrap justify-around gap-2 bg-coral text-white px-3 py-2 text-[11px] font-black">
          <span>最小評価点 <span className="font-fes text-lg">95</span>pt</span>
          <span>最低視聴回数 <span className="font-fes text-lg">5</span>回</span>
        </div>
        {stats.hallOfFame.length === 0 ? (
          <div className="py-12 grid justify-items-center gap-2 border-2 border-dashed border-ink">
            <Trophy className="w-10 h-10 text-muted" />
            <p className="font-fes text-sm text-muted">NO LEGENDS YET</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {stats.hallOfFame.slice(0, isHallOfFameExpanded ? undefined : 6).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedHallItem(item)}
                className="relative overflow-hidden bg-ink text-white text-left p-3 min-h-[120px] flex flex-col justify-between active:opacity-80"
              >
                {item.imageBase64 && <img src={item.imageBase64} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                <span className="relative">
                  <span className="block text-[9px] font-black tracking-[0.15em] text-sun">RATING</span>
                  <span className="font-fes text-[34px] leading-none text-sun">{item.rating}</span><span className="font-fes text-xs text-sun ml-0.5">PT</span>
                </span>
                <span className="relative flex items-center gap-1 text-[10px] font-bold"><Eye className="w-3 h-3" />VIEWS <span className="font-fes text-[13px]">{item.views}</span></span>
                <span className="relative text-[14px] font-black leading-tight truncate">{item.title}</span>
              </button>
            ))}
          </div>
        )}
        {stats.hallOfFame.length > 6 && (
          <button
            type="button"
            onClick={() => setIsHallOfFameExpanded(!isHallOfFameExpanded)}
            className="w-full py-3 bg-ink text-white font-black text-[12px] flex items-center justify-center gap-2 active:bg-teal"
          >
            {isHallOfFameExpanded ? '閉じる' : `すべて見る（${stats.hallOfFame.length}）`}
            <ChevronDown className={`w-4 h-4 transition-transform ${isHallOfFameExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </Section>

      <p className="font-fes text-[13px] text-muted -mb-2">DASHBOARD <span className="font-sans text-[10px] font-bold">ダッシュボード</span></p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ジャンル別比率 */}
        <Section en="GENRE RATIO" ja="ジャンル別比率">
          <div className="h-40 relative pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.genreData} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                  {stats.genreData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-muted">合計</span>
              <span className="font-fes text-[28px] leading-none"><Counter value={stats.totalCount} /></span>
              <span className="text-[10px] font-black text-muted">作品</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {stats.genreData.map((genre) => (
              <div key={genre.name} className="flex items-center justify-between text-[11px] font-bold border-b border-line py-1">
                <span className="flex items-center gap-1.5 min-w-0"><span className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: genre.color }} /><span className="truncate">{genre.name}</span></span>
                <span><span className="font-fes">{genre.value}</span>作品</span>
              </div>
            ))}
          </div>
        </Section>

        {/* スコア分布 */}
        <Section en="SCORE" ja="スコア分布">
          <div className="grid grid-cols-6 gap-2 items-end h-32 border-b-2 border-ink">
            {stats.scoreBins.map(bin => (
              <div key={bin.range} className="bg-teal" style={{ height: `${(bin.count / maxBin) * 100}%` }} title={`${bin.range} ${bin.count}作品`} />
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2 -mt-2 text-[9px] font-bold text-muted text-center">
            {stats.scoreBins.map(bin => <span key={bin.range}>{bin.range}</span>)}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {stats.scoreBins.map(bin => (
              <div key={bin.range} className="flex items-center justify-between text-[11px] font-bold border-b border-line py-1">
                <span>{bin.range}</span><span><span className="font-fes">{bin.count}</span>作品</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ジャンル別平均スコア */}
      <Section en="PERFORMANCE" ja="ジャンル別平均スコア">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.genreAverages.map((genre) => (
            <div key={genre.id} className="relative overflow-hidden bg-mist border-l-4 p-2.5 min-h-[96px] flex flex-col justify-between" style={{ borderColor: genre.color }}>
              {genre.bgImage && <img src={genre.bgImage} alt="" className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-25 grayscale" />}
              <div className="relative flex items-start justify-between gap-1">
                <span className="font-fes text-[9px] text-muted">{genre.id.toUpperCase()}</span>
                <span className="text-right text-[10px] font-bold text-muted leading-tight">COUNT<br /><span className="font-fes text-[12px] text-ink">{genre.count}</span>{GENRE_UNITS[genre.id] || '作品'}</span>
              </div>
              <p className="relative text-[13px] font-black truncate">{genre.name}</p>
              <p className="relative text-[10px] font-bold text-muted">平均点 <span className="font-fes text-[24px] text-ink">{genre.avg}</span>点</p>
            </div>
          ))}
        </div>
        <p className="flex items-start gap-1.5 text-[10px] text-muted font-bold"><Info className="w-3.5 h-3.5 flex-shrink-0" />※平均スコアは統計上の理由により小数点表示しています。</p>
      </Section>

      {/* 殿堂入りの詳細 */}
      {selectedHallItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setSelectedHallItem(null)} />
          <div className="relative bg-white w-full max-w-lg overflow-hidden border-2 border-ink">
            <div className="relative aspect-video w-full bg-ink">
              {selectedHallItem.imageBase64 ? (
                <img src={selectedHallItem.imageBase64} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Trophy className="w-16 h-16 text-sun" /></div>
              )}
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setSelectedHallItem(null)}
                className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center bg-white border-2 border-ink active:bg-mist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="fes-tag text-white" style={{ backgroundColor: GENRE_COLORS[selectedHallItem.genre], borderColor: GENRE_COLORS[selectedHallItem.genre] }}>{GENRE_LABELS[selectedHallItem.genre]}</span>
                {['anime', 'drama', 'manga'].includes(selectedHallItem.genre) && (
                  <span className="fes-tag">{selectedHallItem.genre === 'manga' ? `${selectedHallItem.volumes || 1}巻` : `${selectedHallItem.episodes || 1}話`}</span>
                )}
                <span className="fes-tag ml-auto"><Eye className="w-3 h-3 mr-1" />{selectedHallItem.views} VIEWS</span>
              </div>
              <h2 className="text-2xl font-black leading-tight">{selectedHallItem.title}</h2>
              <div className="bg-ink text-white p-3 flex items-baseline justify-center gap-1">
                <span className="text-[10px] font-black tracking-[0.15em] text-sun mr-2">RATING</span>
                <span className="font-fes text-4xl text-sun">{selectedHallItem.rating}</span>
                <span className="font-fes text-xs text-sun">PTS</span>
              </div>
              <button type="button" onClick={() => setSelectedHallItem(null)} className="w-full py-3.5 bg-white border-2 border-ink font-black text-sm active:bg-ink active:text-white">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
