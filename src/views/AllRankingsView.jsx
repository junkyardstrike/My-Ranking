import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ListOrdered } from 'lucide-react';

export default function AllRankingsView() {
  const rankings = useStore(state => state.rankings) || [];
  const navigate = useNavigate();

  const sorted = [...rankings].sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return (
    <div className="animate-in fade-in duration-300 pb-24">
      <h1 className="text-2xl font-bold text-white mb-1">ALL RANKINGS</h1>
      <div className="h-px w-16 bg-accent/60 mb-6" />

      {sorted.length === 0 ? (
        <div className="text-center text-slate-500 mt-20">
          <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ランキングがまだありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((r, i) => (
            <div
              key={r.id}
              onClick={() => navigate(`/ranking/${r.id}`)}
              className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl cursor-pointer transition-all duration-200 group"
            >
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold font-mono text-sm">
                {i + 1}
              </div>
              {r.coverImageBase64 && (
                <img src={r.coverImageBase64} alt={r.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{r.title}</p>
                {r.englishName && <p className="text-xs text-slate-500 tracking-wider uppercase truncate">{r.englishName}</p>}
              </div>
              {r.genre && r.genre !== 'other' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 capitalize flex-shrink-0">
                  {r.genre}
                </span>
              )}
              <div className="text-xs text-slate-500 text-right flex-shrink-0">
                {(r.items || []).filter(it => it.title).length} 件
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
