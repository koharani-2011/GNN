import React from 'react';

const Logo = () => {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0 group">
      {/* Glow effect behind logo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
      
      {/* Hexagon/Graph SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-transform duration-700 group-hover:rotate-180"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="node-grad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* Central pulsing ring */}
        <circle cx="50" cy="50" r="28" stroke="url(#logo-grad)" strokeWidth="1.5" className="animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30 origin-center" />

        {/* Edges */}
        <path d="M 50 15 L 85 35 L 85 70 L 50 90 L 15 70 L 15 35 Z" stroke="url(#logo-grad)" strokeWidth="3" strokeLinejoin="round" />
        
        {/* Internal connections */}
        <path d="M 50 15 L 50 50 M 85 35 L 50 50 M 85 70 L 50 50 M 50 90 L 50 50 M 15 70 L 50 50 M 15 35 L 50 50" stroke="url(#logo-grad)" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 4" className="animate-[spin_15s_linear_infinite] origin-center" />
        
        {/* Outer Nodes */}
        <circle cx="50" cy="15" r="5" fill="url(#node-grad)" className="filter drop-shadow-[0_0_5px_#fff]" />
        <circle cx="85" cy="35" r="5" fill="url(#node-grad)" />
        <circle cx="85" cy="70" r="5" fill="url(#node-grad)" />
        <circle cx="50" cy="90" r="5" fill="url(#node-grad)" className="filter drop-shadow-[0_0_5px_#fff]" />
        <circle cx="15" cy="70" r="5" fill="url(#node-grad)" />
        <circle cx="15" cy="35" r="5" fill="url(#node-grad)" />

        {/* Central Core */}
        <circle cx="50" cy="50" r="8" fill="url(#logo-grad)" className="filter drop-shadow-[0_0_10px_#6366f1]" />
        <circle cx="50" cy="50" r="4" fill="#fff" />
      </svg>
    </div>
  );
};

export default Logo;
