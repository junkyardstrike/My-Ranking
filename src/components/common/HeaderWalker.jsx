import React from 'react';

const HeaderWalker = ({ size = 32, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size * 2.5, height: size }}>
      {/* Walking Path (Road) */}
      <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-slate-800/40 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700 to-transparent animate-[shimmer_2s_infinite]" />
      </div>
      
      {/* The Walker Character */}
      <div className="relative animate-[walk_4s_linear_infinite] flex flex-col items-center">
        {/* Head/Body */}
        <div className="relative">
          {/* Character Main Body */}
          <div className="w-3 h-4 bg-accent rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
          {/* Eye */}
          <div className="absolute top-1 right-[2px] w-[2px] h-[2px] bg-black" />
          {/* Cap/Hair */}
          <div className="absolute -top-[2px] left-0 right-0 h-1 bg-yellow-600 rounded-t-sm" />
        </div>
        
        {/* Legs with walking animation */}
        <div className="flex gap-1 -mt-[1px]">
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-[leg_0.4s_infinite_alternate]" />
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-[leg_0.4s_infinite_alternate-reverse]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes walk {
          0% { transform: translateX(-40px); }
          100% { transform: translateX(40px); }
        }
        @keyframes leg {
          0% { transform: translateY(0); }
          100% { transform: translateY(2px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default HeaderWalker;
