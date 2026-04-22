import React, { useState, useEffect } from 'react';

const HeaderWalker = ({ className = "" }) => {
  const [frame, setFrame] = useState(0);

  // 2-frame walking animation at RPG speed
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Character Color Palette
  const C = {
    blue: "#2563eb",   // Armor
    blue_d: "#1e3a8a", // Shadow
    red: "#dc2626",    // Cape
    gold: "#fbbf24",   // Helmet/Sword
    skin: "#ffedd5",   // Face
    black: "#000000",  // Eye
    silver: "#cbd5e1", // Sword blade
    ground: "#334155"  // Road
  };

  // Rendering the pixel hero (16x16 grid)
  const renderHero = () => {
    return (
      <g transform={frame === 1 ? 'translate(0, -1)' : ''}>
        {/* Cape (Red) */}
        <rect x="3" y="6" width="6" height="7" fill={C.red} />
        {frame === 1 && <rect x="2" y="7" width="1" height="5" fill={C.red} />}
        
        {/* Sword on Back */}
        <rect x="4" y="4" width="2" height="2" fill={C.gold} />
        <rect x="3" y="3" width="4" height="1" fill={C.gold} />
        <rect x="4" y="2" width="2" height="1" fill={C.silver} />

        {/* Body (Blue Armor) */}
        <rect x="5" y="6" width="6" height="7" fill={C.blue} />
        <rect x="6" y="9" width="4" height="1" fill={C.gold} opacity="0.5" />
        
        {/* Head */}
        <rect x="6" y="2" width="5" height="5" fill={C.skin} />
        {/* Helmet */}
        <rect x="5" y="1" width="7" height="3" fill={C.blue} />
        <rect x="5" y="1" width="1" height="1" fill={C.gold} />
        <rect x="11" y="1" width="1" height="1" fill={C.gold} />
        {/* Eye */}
        <rect x="9" y="4" width="1" height="1" fill={C.black} />

        {/* Arms */}
        <rect x="10" y="7" width="2" height="4" fill={C.blue} />
        
        {/* Legs (2-frame logic) */}
        {frame === 0 ? (
          <>
            <rect x="5" y="13" width="2" height="2" fill={C.blue_d} />
            <rect x="9" y="13" width="2" height="2" fill={C.blue_d} />
          </>
        ) : (
          <>
            <rect x="6" y="12" width="2" height="2" fill={C.blue_d} />
            <rect x="8" y="12" width="2" height="2" fill={C.blue_d} />
          </>
        )}
      </g>
    );
  };

  return (
    <div className={`relative ${className} flex items-end overflow-visible`} style={{ width: '80px', height: '64px' }}>
      {/* The Road */}
      <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-slate-800/40" />
      
      {/* Animated Hero Container */}
      <div className="relative animate-[walk_8s_linear_infinite] w-12 h-12">
        <svg 
          viewBox="0 0 16 16" 
          className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" 
          style={{ shapeRendering: 'crispEdges' }}
        >
          {renderHero()}
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes walk {
          0% { transform: translateX(-40px); }
          100% { transform: translateX(40px); }
        }
      `}} />
    </div>
  );
};

export default HeaderWalker;
