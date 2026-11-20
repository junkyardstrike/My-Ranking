import { useState } from 'react';
import { Plus, X, CalendarDays } from 'lucide-react';
import { logEntries, currentYear, fmtMinutes, logTotalMinutes } from '../../utils/watchLog';

// 年別の視聴時間の入力（時間・分）。onChange には新しい watchLog を渡す
export default function WatchLogEditor({ item, onChange }) {
  const entries = logEntries(item);
  const used = new Set(entries.map(([y]) => y));
  const years = [];
  for (let y = currentYear(); y >= 2005; y--) if (!used.has(String(y))) years.push(String(y));
  const [addYear, setAddYear] = useState('');
  const yearToAdd = years.includes(addYear) ? addYear : years[0];

  const set = (year, minutes) => onChange({ ...(item.watchLog || {}), [year]: Math.max(0, Math.round(minutes)) });
  const remove = (year) => {
    const next = { ...(item.watchLog || {}) };
    delete next[year];
    onChange(next);
  };
  const num = (v) => Math.max(0, parseInt(v) || 0);

  return (
    <div className="bg-mist border border-line px-2.5 py-2 grid gap-2" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-black text-muted"><CalendarDays size={13} />年別の視聴時間</span>
        <span className="text-[11px] font-black">合計 <span className="font-fes">{fmtMinutes(logTotalMinutes(item))}</span></span>
      </div>
      {entries.map(([year, min]) => (
        <div key={year} className="flex items-center gap-1.5">
          <span className="font-fes text-[13px] w-11 flex-shrink-0">{year}</span>
          <label className="flex-1 min-w-0 flex items-center gap-1 bg-white border-2 border-ink px-2 min-h-[44px] cursor-text">
            <input type="number" inputMode="numeric" min="0" aria-label={`${year}年の時間`} value={Math.floor(min / 60) || ''} placeholder="0"
              onChange={e => set(year, num(e.target.value) * 60 + (min % 60))}
              className="w-full bg-transparent outline-none font-fes text-right" />
            <span className="text-[11px] font-black text-muted flex-shrink-0">時間</span>
          </label>
          <label className="flex-1 min-w-0 flex items-center gap-1 bg-white border-2 border-ink px-2 min-h-[44px] cursor-text">
            <input type="number" inputMode="numeric" min="0" max="59" aria-label={`${year}年の分`} value={min % 60 || ''} placeholder="0"
              onChange={e => set(year, Math.floor(min / 60) * 60 + Math.min(59, num(e.target.value)))}
              className="w-full bg-transparent outline-none font-fes text-right" />
            <span className="text-[11px] font-black text-muted flex-shrink-0">分</span>
          </label>
          <button type="button" aria-label={`${year}年の記録を削除`}
            onClick={() => { if (!min || confirm(`${year}年の記録（${fmtMinutes(min)}）を削除しますか？`)) remove(year); }}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center border-2 border-ink bg-white text-coral active:bg-coral active:text-white">
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      ))}
      {years.length > 0 && (
        <div className="flex items-center gap-1.5">
          <select aria-label="追加する年" value={yearToAdd} onChange={e => setAddYear(e.target.value)}
            className="flex-1 min-w-0 min-h-[44px] bg-white border-2 border-ink px-2 font-fes">
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <button type="button" onClick={() => set(yearToAdd, 0)}
            className="flex-shrink-0 min-h-[44px] px-3 flex items-center gap-1 bg-ink text-white text-[12px] font-black active:bg-teal">
            <Plus size={14} strokeWidth={3} />年を追加
          </button>
        </div>
      )}
    </div>
  );
}
