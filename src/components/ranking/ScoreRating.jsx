import { Star } from 'lucide-react';

export default function ScoreRating({ rating = 0, onRatingChange, readOnly = false }) {
  // 10-point scale (0 to 10)
  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
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
            size={11} // Slightly smaller to ensure fit
            className={`${
              star <= rating
                ? 'fill-accent text-accent shadow-accent/50 drop-shadow-[0_0_2px_rgba(212,175,55,0.8)]'
                : 'text-slate-800'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
