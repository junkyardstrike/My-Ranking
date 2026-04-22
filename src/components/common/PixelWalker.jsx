import React, { useState, useEffect } from 'react';

const PixelWalker = ({ className = "" }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 250); // 250ms per frame
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative ${className} w-24 h-24 overflow-hidden`}>
      {/* Background speed lines to simulate movement */}
      <div className="absolute inset-0 opacity-20">
         <div className="absolute top-4 left-0 w-8 h-[2px] bg-white animate-[slide_1s_infinite_linear]" style={{ animationDelay: '0s' }} />
         <div className="absolute top-12 left-4 w-12 h-[2px] bg-accent animate-[slide_1.5s_infinite_linear]" style={{ animationDelay: '0.5s' }} />
         <div className="absolute top-20 left-2 w-6 h-[2px] bg-white animate-[slide_0.8s_infinite_linear]" style={{ animationDelay: '0.2s' }} />
      </div>

      <svg
        viewBox="0 0 16 16"
        className={`w-full h-full transition-transform duration-100 ${frame === 1 ? '-translate-y-1' : ''}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Hair / Hat (Luxury Gold & Neon) */}
        <rect x="5" y="1" width="6" height="2" fill="#fbbf24" />
        <rect x="4" y="2" width="1" height="2" fill="#fbbf24" />
        <rect x="11" y="2" width="1" height="2" fill="#fbbf24" />
        <rect x="5" y="0" width="2" height="1" fill="#f59e0b" />
        <rect x="9" y="0" width="2" height="1" fill="#f59e0b" />

        {/* Head/Face */}
        <rect x="5" y="3" width="6" height="4" fill="#fef3c7" />
        
        {/* Cyber Visor / Eyes */}
        <rect x="5" y="4" width="7" height="2" fill="#1e293b" />
        <rect x="6" y="4" width="5" height="1" fill="#38bdf8" />

        {/* Body/Jacket */}
        <rect x="5" y="7" width="6" height="5" fill="#fcd34d" />
        
        {/* Accent on Jacket */}
        <rect x="7" y="8" width="2" height="4" fill="#ffffff" />

        {/* Left Arm */}
        <rect x="4" y="7" width="1" height="4" fill="#fcd34d" />
        {frame === 0 ? (
          <rect x="4" y="11" width="1" height="1" fill="#fef3c7" /> // Hand down
        ) : (
          <rect x="3" y="10" width="1" height="1" fill="#fef3c7" /> // Hand up
        )}

        {/* Right Arm */}
        <rect x="11" y="7" width="1" height="4" fill="#fcd34d" />
        {frame === 0 ? (
          <rect x="11" y="11" width="1" height="1" fill="#fef3c7" /> // Hand down
        ) : (
          <rect x="12" y="10" width="1" height="1" fill="#fef3c7" /> // Hand up
        )}

        {/* Left Leg */}
        {frame === 0 ? (
          <>
            <rect x="5" y="12" width="2" height="3" fill="#6b21a8" />
            <rect x="4" y="14" width="2" height="1" fill="#a855f7" /> {/* Shoe */}
          </>
        ) : (
          <>
            <rect x="6" y="12" width="2" height="2" fill="#6b21a8" />
            <rect x="7" y="13" width="2" height="1" fill="#a855f7" /> {/* Shoe lifted */}
          </>
        )}

        {/* Right Leg */}
        {frame === 0 ? (
          <>
            <rect x="9" y="12" width="2" height="2" fill="#6b21a8" />
            <rect x="8" y="13" width="2" height="1" fill="#a855f7" /> {/* Shoe lifted */}
          </>
        ) : (
          <>
            <rect x="9" y="12" width="2" height="3" fill="#6b21a8" />
            <rect x="9" y="14" width="2" height="1" fill="#a855f7" /> {/* Shoe */}
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
