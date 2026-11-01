import { Star, Target } from 'lucide-react';

export default function ScoreRating({ rating = 0, onRatingChange, readOnly = false }) {
  // 100-point scale
  
  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 w-16 bg-mist rounded-full overflow-hidden border border-line">
          <div 
            className="h-full bg-accent transition-all duration-1000" 
            style={{ width: `${rating}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-accent font-mono leading-none">{rating}pt</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-mist px-2 py-1.5 rounded border border-line group hover:border-accent transition-all max-w-full overflow-hidden">
      <Target size={12} className="text-accent group-hover:text-accent transition-colors flex-shrink-0" />
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
          className="w-10 bg-transparent border-none outline-none text-ink font-black text-xs font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[8px] font-black text-muted uppercase tracking-widest">pt</span>
      </div>
      <div className="w-px h-3 bg-mist flex-shrink-0" />
      <div className="min-w-[30px] flex-1 h-1 bg-mist rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent transition-all duration-300" 
          style={{ width: `${rating}%` }}
        />
      </div>
    </div>
  );
}
