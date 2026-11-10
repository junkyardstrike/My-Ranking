
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
    <label className="flex items-center gap-2 min-w-0 cursor-text" onClick={e => e.stopPropagation()}>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="100"
        aria-label="スコア（0〜100点）"
        value={rating}
        onClick={e => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
          if (onRatingChange) onRatingChange(val);
        }}
        className="w-14 h-11 bg-white border-2 border-ink outline-none focus:border-teal text-ink font-fes text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[11px] font-black text-muted">pt</span>
      <span className="hidden xs:block w-14 h-1 bg-white flex-shrink-0" aria-hidden="true">
        <span className="block h-full bg-teal" style={{ width: `${rating}%` }} />
      </span>
    </label>
  );
}
