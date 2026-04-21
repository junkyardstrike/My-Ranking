import { Star } from 'lucide-react';

export default function ScoreRating({ rating = 0, onRatingChange, readOnly = false }) {
  // 10-point scale (0 to 10), split into 2 rows of 5
  const row1 = [1, 2, 3, 4, 5];
  const row2 = [6, 7, 8, 9, 10];

  const renderStar = (star) => (
    <button
      key={star}
      type="button"
      disabled={readOnly}
      onClick={(e) => {
        e.stopPropagation();
        if (!readOnly && onRatingChange) onRatingChange(star);
      }}
      className={`transition-all duration-200 ${readOnly ? 'cursor-default' : 'hover:scale-125 cursor-pointer'}`}
    >
      <Star
        size={13}
        className={`${star <= rating
            ? 'fill-accent text-accent shadow-accent/50 drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]'
            : 'text-slate-800'
          }`}
      />
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {row1.map(renderStar)}
      </div>
      <div className="flex items-center gap-1.5">
        {row2.map(renderStar)}
      </div>
    </div>
  );
}
