import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { logEntries, fmtMinutes, currentYear } from '../../utils/watchLog';
import { openDetail } from '../ranking/dialogs';

// STATS：YouTube の年別視聴時間（年を選ぶと、その年の合計とチャンネル別の順位）
export default function YoutubeYearly({ entries }) {
  const { years, byYear } = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      if (e.genre !== 'youtube') return;
      logEntries(e.item).forEach(([year, min]) => {
        if (!min) return;
        (map[year] = map[year] || []).push({ id: e.id, title: e.item.title || 'Untitled', min });
      });
    });
    Object.values(map).forEach(list => list.sort((a, b) => b.min - a.min));
    return { years: Object.keys(map).sort((a, b) => b - a), byYear: map };
  }, [entries]);

  const [picked, setPicked] = useState(null);
  const [expanded, setExpanded] = useState(false);
  if (!years.length) return null;
  const year = years.includes(picked) ? picked : years[0];
  const list = byYear[year];
  const total = list.reduce((s, c) => s + c.min, 0);
  const prev = byYear[String(Number(year) - 1)]?.reduce((s, c) => s + c.min, 0);
  const top = list[0].min;

  return (
    <section className="cv-section fes-section grid gap-3">
      <h2 className="fes-h">YOUTUBE<small>年別視聴時間</small></h2>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {years.map(y => (
          <button key={y} type="button" aria-pressed={y === year} onClick={() => { setPicked(y); setExpanded(false); }}
            className={`flex-shrink-0 px-3 min-h-[44px] border-[1.5px] border-ink font-fes text-[13px] ${y === year ? 'bg-ink text-white' : 'bg-white text-ink active:bg-mist'}`}>
            {y}
          </button>
        ))}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="flex items-baseline gap-1 min-w-0">
          <span className="font-fes text-[40px] leading-none text-genre-youtube">{Math.floor(total / 60)}</span>
          <span className="text-sm font-black">時間</span>
          <span className="font-fes text-[20px] leading-none ml-1">{total % 60}</span>
          <span className="text-sm font-black">分</span>
        </p>
        <p className="text-right text-[10px] font-bold text-muted leading-tight flex-shrink-0">
          {year === String(currentYear()) ? '今年' : `${year}年`}・<span className="font-fes text-[13px] text-ink">{list.length}</span>チャンネル
          {prev !== undefined && <><br />前年 {fmtMinutes(prev)}</>}
        </p>
      </div>
      <ol className="grid gap-1.5">
        {list.slice(0, expanded ? undefined : 10).map((c, i) => (
          <li key={c.id}>
            <button type="button" onClick={() => openDetail(c.id)} className="w-full text-left grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-1.5 border-b border-line active:bg-mist">
              <span className={`font-fes text-[15px] text-center ${i < 3 ? 'text-genre-youtube' : 'text-muted'}`}>{i + 1}</span>
              <span className="text-[13px] font-black truncate">{c.title}</span>
              <span className="text-[11px] font-black whitespace-nowrap">{fmtMinutes(c.min)}</span>
              <span className="col-start-2 col-span-2 h-1 bg-mist">
                <span className="block h-full bg-genre-youtube" style={{ width: `${(c.min / top) * 100}%` }} />
              </span>
            </button>
          </li>
        ))}
      </ol>
      {list.length > 10 && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="w-full py-3 bg-ink text-white font-black text-[12px] flex items-center justify-center gap-2 active:bg-teal">
          {expanded ? '閉じる' : `すべて見る（${list.length}）`}
          <ChevronDown className={`w-4 h-4 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}
