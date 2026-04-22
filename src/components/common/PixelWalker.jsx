import React, { useState, useEffect } from 'react';

const PALETTES = [
  { hat1: '#fbbf24', hat2: '#f59e0b', visor: '#38bdf8', jacket1: '#fcd34d', jacket2: '#ffffff', pants: '#6b21a8', shoes: '#a855f7' }, // Gold/Purple
  { hat1: '#0ea5e9', hat2: '#0284c7', visor: '#f43f5e', jacket1: '#38bdf8', jacket2: '#ffffff', pants: '#0f172a', shoes: '#f43f5e' }, // Cyber Blue/Red
  { hat1: '#10b981', hat2: '#059669', visor: '#fbbf24', jacket1: '#34d399', jacket2: '#ffffff', pants: '#1e293b', shoes: '#fbbf24' }, // Neon Green/Gold
  { hat1: '#ec4899', hat2: '#be185d', visor: '#38bdf8', jacket1: '#f472b6', jacket2: '#ffffff', pants: '#4c1d95', shoes: '#38bdf8' }, // Synthwave Pink
  { hat1: '#f43f5e', hat2: '#e11d48', visor: '#34d399', jacket1: '#fb7185', jacket2: '#ffffff', pants: '#172554', shoes: '#34d399' }, // Ruby/Mint
];

const PixelWalker = ({ className = "" }) => {
  const [frame, setFrame] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);

  // Walking animation
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Random jump and color change
  useEffect(() => {
    const randomActionTimer = setInterval(() => {
      // 30% chance to jump every 4 seconds
      if (Math.random() > 0.7) {
        handleJump();
      }
    }, 4000);
    return () => clearInterval(randomActionTimer);
  }, [isJumping]);

  const handleJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    // Change color randomly but ensure it's different from current
    setPaletteIndex((prev) => {
      let next = Math.floor(Math.random() * PALETTES.length);
      if (next === prev) next = (next + 1) % PALETTES.length;
      return next;
    });
    
    setTimeout(() => {
      setIsJumping(false);
    }, 600); // Jump duration
  };

  const colors = PALETTES[paletteIndex];

  return (
    <div 
      className={`relative ${className} w-24 h-24 cursor-pointer`}
      onClick={handleJump}
    >
      {/* Background speed lines to simulate movement */}
      <div className="absolute inset-0 opacity-20 overflow-hidden rounded-xl">
         <div className="absolute top-4 left-0 w-8 h-[2px] bg-white animate-[slide_1s_infinite_linear]" style={{ animationDelay: '0s' }} />
         <div className="absolute top-12 left-4 w-12 h-[2px] bg-accent animate-[slide_1.5s_infinite_linear]" style={{ animationDelay: '0.5s' }} />
         <div className="absolute top-20 left-2 w-6 h-[2px] bg-white animate-[slide_0.8s_infinite_linear]" style={{ animationDelay: '0.2s' }} />
      </div>

      <svg
        viewBox="0 0 16 16"
        className={`w-full h-full transition-transform duration-300 ${isJumping ? '-translate-y-4' : (frame === 1 ? '-translate-y-1' : '')}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Hair / Hat */}
        <rect x="5" y="1" width="6" height="2" fill={colors.hat1} />
        <rect x="4" y="2" width="1" height="2" fill={colors.hat1} />
        <rect x="11" y="2" width="1" height="2" fill={colors.hat1} />
        <rect x="5" y="0" width="2" height="1" fill={colors.hat2} />
        <rect x="9" y="0" width="2" height="1" fill={colors.hat2} />

        {/* Head/Face */}
        <rect x="5" y="3" width="6" height="4" fill="#fef3c7" />
        
        {/* Cyber Visor / Eyes */}
        <rect x="5" y="4" width="7" height="2" fill="#1e293b" />
        <rect x="6" y="4" width="5" height="1" fill={colors.visor} />

        {/* Body/Jacket */}
        <rect x="5" y="7" width="6" height="5" fill={colors.jacket1} />
        
        {/* Accent on Jacket */}
        <rect x="7" y="8" width="2" height="4" fill={colors.jacket2} />

        {/* Left Arm */}
        <rect x="4" y="7" width="1" height="4" fill={colors.jacket1} />
        {frame === 0 && !isJumping ? (
          <rect x="4" y="11" width="1" height="1" fill="#fef3c7" />
        ) : (
          <rect x="3" y="10" width="1" height="1" fill="#fef3c7" /> // Hand up
        )}

        {/* Right Arm */}
        <rect x="11" y="7" width="1" height="4" fill={colors.jacket1} />
        {frame === 0 && !isJumping ? (
          <rect x="11" y="11" width="1" height="1" fill="#fef3c7" />
        ) : (
          <rect x="12" y="10" width="1" height="1" fill="#fef3c7" /> // Hand up
        )}

        {/* Left Leg */}
        {frame === 0 && !isJumping ? (
          <>
            <rect x="5" y="12" width="2" height="3" fill={colors.pants} />
            <rect x="4" y="14" width="2" height="1" fill={colors.shoes} /> {/* Shoe */}
          </>
        ) : (
          <>
            <rect x="6" y="12" width="2" height="2" fill={colors.pants} />
            <rect x="7" y="13" width="2" height="1" fill={colors.shoes} /> {/* Shoe lifted */}
          </>
        )}

        {/* Right Leg */}
        {frame === 0 && !isJumping ? (
          <>
            <rect x="9" y="12" width="2" height="2" fill={colors.pants} />
            <rect x="8" y="13" width="2" height="1" fill={colors.shoes} /> {/* Shoe lifted */}
          </>
        ) : (
          <>
            <rect x="9" y="12" width="2" height="3" fill={colors.pants} />
            <rect x="9" y="14" width="2" height="1" fill={colors.shoes} /> {/* Shoe */}
          </>
        )}
      </svg>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide {
          from { transform: translateX(100px); }
          to { transform: translateX(-100px); }
        }
      `}} />
    </div>
  );
};

export default PixelWalker;
