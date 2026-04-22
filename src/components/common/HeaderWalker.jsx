import React from 'react';

const HeaderWalker = ({ className = "" }) => {
  return (
    <div className={`relative flex items-end justify-center ${className} mb-[-2px] overflow-visible`} style={{ width: '100px', height: '64px' }}>
      {/* RPG Field Path (Grass/Stone hints) */}
      <div className="absolute bottom-1 left-0 right-0 h-[3px] bg-slate-800/30 rounded-full">
        <div className="absolute inset-0 animate-[path_2s_linear_infinite] bg-[length:20px_100%] bg-gradient-to-r from-transparent via-slate-600/20 to-transparent" />
      </div>
      
      {/* The DQ-style Hero Character */}
      <div className="relative animate-[walk_8s_linear_infinite] flex flex-col items-center">
        {/* Character Group with Bobbing */}
        <div className="relative animate-[dq_bob_0.5s_step-end_infinite]">
          
          {/* Red Cape (Flares slightly) */}
          <div className="absolute top-3 -left-3 w-4 h-6 bg-red-600 rounded-sm origin-right animate-[cape_0.5s_step-end_infinite]" />
          
          {/* Sword on Back (Legendary Sword) */}
          <div className="absolute top-1 -left-1 w-1.5 h-8 bg-slate-400 border-x border-slate-600 rotate-12 -z-10">
            {/* Hilt */}
            <div className="absolute -top-1 -left-1 w-3.5 h-1.5 bg-yellow-500 rounded-full" />
          </div>

          {/* Main Body (Blue Armor/Tunic) */}
          <div className="w-6 h-8 bg-blue-600 rounded-sm relative border-x border-blue-800 shadow-[0_5px_15px_rgba(37,99,235,0.3)]">
            {/* Belt/Detail */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-yellow-500/50" />
          </div>
          
          {/* Head (Helmet/Hero Face) */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#ffe4e1] rounded-sm border-x border-[#ffc0cb]">
            {/* Hero Helmet (Blue with gold hint) */}
            <div className="absolute -top-1 -left-1 -right-1 h-3 bg-blue-700 rounded-t-sm">
              <div className="absolute top-0 left-0 w-1 h-1 bg-yellow-400" />
              <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-400" />
            </div>
            {/* Eye (Facing forward) */}
            <div className="absolute top-2 right-1 w-1 h-1 bg-black rounded-full" />
          </div>

          {/* Arms (Swinging) */}
          <div className="absolute top-3 -right-1.5 w-2.5 h-4 bg-blue-500 border-r border-blue-700 rounded-full origin-top animate-[dq_arm_0.5s_step-end_infinite]" />
        </div>
        
        {/* Legs (Classic 2-frame RPG walk) */}
        <div className="flex gap-1 -mt-[1px]">
          <div className="w-2.5 h-3 bg-blue-900 animate-[dq_leg_0.5s_step-end_infinite]" />
          <div className="w-2.5 h-3 bg-blue-900 animate-[dq_leg_0.5s_step-end_infinite_reverse]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes walk {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(60px); }
        }
        @keyframes dq_bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes dq_arm {
          0%, 100% { transform: rotate(-15deg) translateY(0); }
          50% { transform: rotate(15deg) translateY(-1px); }
        }
        @keyframes dq_leg {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.7); opacity: 0.7; }
        }
        @keyframes cape {
          0%, 100% { transform: scaleX(1) skewY(0deg); }
          50% { transform: scaleX(1.2) skewY(-5deg); }
        }
        @keyframes path {
          0% { transform: translateX(0); }
          100% { transform: translateX(20px); }
        }
      `}} />
    </div>
  );
};

export default HeaderWalker;
