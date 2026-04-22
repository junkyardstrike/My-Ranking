import React from 'react';

const HeaderWalker = ({ className = "" }) => {
  return (
    <div className={`relative flex items-end justify-center ${className} mb-[-4px] overflow-visible`} style={{ width: '100px', height: '64px' }}>
      {/* Walking Path (Road) - Aligns with Title Baseline */}
      <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-40" />
      
      {/* The Traveler Character */}
      <div className="relative animate-[walk_6s_linear_infinite] flex flex-col items-center">
        {/* Character Body Group */}
        <div className="relative animate-[bob_0.6s_ease-in-out_infinite_alternate]">
          
          {/* Backpack (Traveler essence) */}
          <div className="absolute top-3 -left-3 w-3 h-5 bg-yellow-900/80 rounded-sm border border-yellow-800/50 shadow-sm" />
          
          {/* Main Body (Tunic) */}
          <div className="w-5 h-7 bg-accent rounded-[2px] relative shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            {/* Belt */}
            <div className="absolute top-4 left-0 right-0 h-[2px] bg-yellow-950/40" />
          </div>
          
          {/* Head */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#fef3c7] rounded-sm">
            {/* Hair/Hat */}
            <div className="absolute -top-1 -left-1 -right-1 h-2 bg-yellow-700 rounded-t-sm" />
            {/* Eye (Facing forward) */}
            <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full" />
          </div>

          {/* Arms */}
          <div className="absolute top-2 -right-1 w-2 h-4 bg-accent/80 rounded-full origin-top animate-[arm_0.6s_ease-in-out_infinite_alternate]" />
          <div className="absolute top-2 -left-1 w-2 h-4 bg-accent/60 rounded-full origin-top animate-[arm_0.6s_ease-in-out_infinite_alternate-reverse] -z-10" />
        </div>
        
        {/* Legs */}
        <div className="flex gap-1 -mt-[1px]">
          <div className="w-2 h-3 bg-yellow-950/80 rounded-b-sm animate-[leg_0.6s_ease-in-out_infinite_alternate]" />
          <div className="w-2 h-3 bg-yellow-950/60 rounded-b-sm animate-[leg_0.6s_ease-in-out_infinite_alternate-reverse]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes walk {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(60px); }
        }
        @keyframes bob {
          0% { transform: translateY(0); }
          100% { transform: translateY(-2px); }
        }
        @keyframes arm {
          0% { transform: rotate(-20deg); }
          100% { transform: rotate(20deg); }
        }
        @keyframes leg {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.7) translateY(-1px); }
        }
      `}} />
    </div>
  );
};

export default HeaderWalker;
