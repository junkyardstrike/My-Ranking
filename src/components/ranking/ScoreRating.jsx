import { Star } from 'lucide-react';

/**
 * 10-point Star rating component.
 */
export default function ScoreRating({ rating = 0, onRatingChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, i) => {
        const val = i + 1;
        const filled = rating >= val;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={readOnly ? undefined : () => onRatingChange(rating === val ? 0 : val)}
            className={`
              transition-all duration-150
              ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}
              ${filled ? 'text-accent drop-shadow-[0_0_3px_rgba(212,175,55,0.4)]' : 'text-slate-700 hover:text-accent/40'}
            `}
          >
            <Star 
              className={readOnly ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} 
              fill={filled ? 'currentColor' : 'none'} 
              strokeWidth={filled ? 0 : 2}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-1.5 text-[10px] font-black text-accent font-mono leading-none">{rating}<span className="text-[8px] opacity-60 ml-0.5">/10</span></span>
      )}
    </div>
  );
}
