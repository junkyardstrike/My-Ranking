import React from 'react';

const ITEMS = {
  sword: {
    name: 'Sword',
    color1: '#fbbf24', // Gold
    color2: '#f59e0b',
    color3: '#fef3c7',
    render: (c1, c2, c3) => (
      <svg viewBox="0 0 16 16" className="w-full h-full drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
        {/* Blade */}
        <rect x="7" y="2" width="2" height="10" fill={c3} />
        <rect x="7" y="1" width="2" height="1" fill="#fff" />
        {/* Crossguard */}
        <rect x="5" y="10" width="6" height="2" fill={c1} />
        {/* Hilt */}
        <rect x="7" y="12" width="2" height="3" fill="#78350f" />
        <rect x="7" y="15" width="2" height="1" fill={c1} />
      </svg>
    ),
    animation: 'animate-bounce'
  },
  grimoire: {
    name: 'Grimoire',
    color1: '#3b82f6', // Blue
    color2: '#1d4ed8',
    color3: '#bfdbfe',
    render: (c1, c2, c3) => (
      <svg viewBox="0 0 16 16" className="w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
        {/* Cover */}
        <rect x="4" y="3" width="8" height="10" fill={c2} />
        <rect x="5" y="4" width="6" height="8" fill={c1} />
        {/* Pages (side) */}
        <rect x="11" y="4" width="1" height="8" fill="#fff" opacity="0.8" />
        {/* Magic Symbol */}
        <rect x="7" y="6" width="2" height="4" fill={c3} opacity="0.6" />
        <rect x="6" y="7" width="4" height="2" fill={c3} opacity="0.6" />
      </svg>
    ),
    animation: 'animate-[float_3s_infinite_ease-in-out]'
  },
  potion: {
    name: 'Potion',
    color1: '#10b981', // Emerald
    color2: '#065f46',
    color3: '#a7f3d0',
    render: (c1, c2, c3) => (
      <svg viewBox="0 0 16 16" className="w-full h-full drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">
        {/* Cork */}
        <rect x="7" y="2" width="2" height="2" fill="#78350f" />
        {/* Bottle Neck */}
        <rect x="6" y="4" width="4" height="2" fill="#fff" opacity="0.3" />
        {/* Bottle Body */}
        <rect x="4" y="6" width="8" height="8" fill="#fff" opacity="0.2" />
        {/* Liquid */}
        <rect x="5" y="7" width="6" height="6" fill={c1} />
        <rect x="5" y="7" width="6" height="2" fill={c3} opacity="0.4" />
        {/* Bubble */}
        <rect x="7" y="9" width="1" height="1" fill="#fff" opacity="0.8" className="animate-pulse" />
      </svg>
    ),
    animation: 'animate-[pulse_2s_infinite_ease-in-out]'
  },
  key: {
    name: 'Key',
    color1: '#a855f7', // Purple
    color2: '#7e22ce',
    color3: '#e9d5ff',
    render: (c1, c2, c3) => (
      <svg viewBox="0 0 16 16" className="w-full h-full drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
        {/* Head */}
        <rect x="6" y="2" width="4" height="4" fill={c1} />
        <rect x="7" y="3" width="2" height="2" fill="#000" opacity="0.4" />
        {/* Shaft */}
        <rect x="7" y="6" width="2" height="8" fill={c1} />
        {/* Teeth */}
        <rect x="9" y="10" width="2" height="1" fill={c1} />
        <rect x="9" y="12" width="2" height="1" fill={c1} />
      </svg>
    ),
    animation: 'animate-[spin_4s_infinite_linear]'
  }
};

const PixelItem = ({ type = 'sword', size = 48, className = "" }) => {
  const item = ITEMS[type] || ITEMS.sword;

  return (
    <div 
      className={`inline-block ${item.animation} ${className}`}
      style={{ width: size, height: size }}
    >
      {item.render(item.color1, item.color2, item.color3)}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}} />
    </div>
  );
};

export default PixelItem;
