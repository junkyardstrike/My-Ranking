import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, onRatingChange, readOnly = false }) {
  const handleMouseMove = (e, index) => {
    if (readOnly) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    const newRating = index + (percent < 0.5 ? 0.5 : 1);
    if (onRatingChange) onRatingChange(newRating);
  };

  const handleClick = (e, index) => {
    if (readOnly) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    const newRating = index + (percent < 0.5 ? 0.5 : 1);
    if (onRatingChange) onRatingChange(newRating);
  };

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const fillPercent = Math.max(0, Math.min(1, rating - i)) * 100;
        
        return (
          <div
            key={i}
            className={`relative ${!readOnly ? 'cursor-pointer' : ''}`}
            onMouseMove={!readOnly ? (e) => handleMouseMove(e, i) : undefined}
            onClick={!readOnly ? (e) => handleClick(e, i) : undefined}
            style={{ width: '24px', height: '24px' }}
          >
            {/* Background Star (Empty) */}
            <Star 
              className="absolute inset-0 w-6 h-6 text-slate-700" 
              strokeWidth={1.5}
            />
            {/* Foreground Star (Filled, clipped) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star 
                className="w-6 h-6 text-accent fill-accent" 
                strokeWidth={1.5}
              />
            </div>
          </div>
        );
      })}
      {rating > 0 && (
        <span className="ml-2 text-sm font-bold text-accent font-mono">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
