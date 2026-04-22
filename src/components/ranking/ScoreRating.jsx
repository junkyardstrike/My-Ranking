import { Star, Target } from 'lucide-react';

export default function ScoreRating({ rating = 0, onRatingChange, readOnly = false }) {
  // 100-point scale
  
  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-accent transition-all duration-1000 shadow-[0_0_8px_rgba(212,175,55,0.4)]" 
            style={{ width: `${rating}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-accent font-mono leading-none">{rating}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-black/40 px-2 py-1.5 rounded-xl border border-white/5 group hover:border-accent/30 transition-all max-w-full overflow-hidden">
      <Target size={12} className="text-accent/50 group-hover:text-accent transition-colors flex-shrink-0" />
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          min="0"
          max="100"
          value={rating}
          onClick={e => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
            if (onRatingChange) onRatingChange(val);
          }}
          className="w-10 bg-transparent border-none outline-none text-white font-black text-xs font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">pts</span>
      </div>
      <div className="w-px h-3 bg-white/10 flex-shrink-0" />
      <div className="min-w-[30px] flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent transition-all duration-300" 
          style={{ width: `${rating}%` }}
        />
      </div>
    </div>
  );
}
