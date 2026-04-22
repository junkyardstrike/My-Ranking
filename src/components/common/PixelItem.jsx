import React from 'react';

const ITEMS = {
  sword: {
    name: 'Sword',
    color1: '#fbbf24', // Gold
    color2: '#f59e0b',
    color3: '#fef3c7',
    viewBox: "5 0 6 16", // Tighten to the sword width
    render: (c1, c2, c3) => (
      <svg viewBox="5 0 6 16" className="w-full h-full drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
        <rect x="7" y="1" width="2" height="10" fill={c3} />
        <rect x="7" y="0" width="2" height="1" fill="#fff" />
        <rect x="5" y="10" width="6" height="2" fill={c1} />
        <rect x="7" y="12" width="2" height="3" fill="#78350f" />
        <rect x="7" y="15" width="2" height="1" fill={c1} />
      </svg>
    )
  },
  grimoire: {
    name: 'Grimoire',
    color1: '#3b82f6', // Blue
    color2: '#1d4ed8',
    color3: '#bfdbfe',
    viewBox: "4 3 8 10", // Tighten to the book size
    render: (c1, c2, c3) => (
      <svg viewBox="4 3 8 10" className="w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
        <rect x="4" y="3" width="8" height="10" fill={c2} />
        <rect x="5" y="4" width="6" height="8" fill={c1} />
        <rect x="11" y="4" width="1" height="8" fill="#fff" opacity="0.8" />
        <rect x="7" y="6" width="2" height="4" fill={c3} opacity="0.6" />
        <rect x="6" y="7" width="4" height="2" fill={c3} opacity="0.6" />
      </svg>
    )
  },
  potion: {
    name: 'Potion',
    color1: '#10b981', // Emerald
    color2: '#065f46',
    color3: '#a7f3d0',
    viewBox: "4 2 8 12", // Tighten to the bottle size
    render: (c1, c2, c3) => (
      <svg viewBox="4 2 8 12" className="w-full h-full drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
        <rect x="7" y="2" width="2" height="2" fill="#78350f" />
        <rect x="6" y="4" width="4" height="2" fill="#fff" opacity="0.3" />
        <rect x="4" y="6" width="8" height="8" fill="#fff" opacity="0.2" />
        <rect x="5" y="7" width="6" height="6" fill={c1} />
        <rect x="5" y="7" width="6" height="2" fill={c3} opacity="0.4" />
      </svg>
    )
  },
  key: {
    name: 'Key',
    color1: '#a855f7', // Purple
    color2: '#7e22ce',
    color3: '#e9d5ff',
    viewBox: "6 2 5 12", // Tighten to the key size
    render: (c1, c2, c3) => (
      <svg viewBox="6 2 5 12" className="w-full h-full drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
        <rect x="6" y="2" width="4" height="4" fill={c1} />
        <rect x="7" y="3" width="2" height="2" fill="#000" opacity="0.4" />
        <rect x="7" y="6" width="2" height="8" fill={c1} />
        <rect x="9" y="10" width="2" height="1" fill={c1} />
        <rect x="9" y="12" width="2" height="1" fill={c1} />
      </svg>
    )
  }
};

const PixelItem = ({ type = 'sword', size = 72, className = "" }) => {
  const item = ITEMS[type] || ITEMS.sword;
  
  // Calculate aspect ratio based on viewBox to keep correct width
  const [vx, vy, vw, vh] = item.viewBox.split(' ').map(Number);
  const width = (vw / vh) * size;

  return (
    <div 
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ width: width, height: size }}
    >
      {item.render(item.color1, item.color2, item.color3)}
    </div>
  );
};

export default PixelItem;
