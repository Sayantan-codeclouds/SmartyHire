import React from 'react';

const AudioVisualizer = ({ isActive = true, barCount = 12, color = 'indigo' }) => {
  return (
    <div className="flex items-center gap-1.5 h-8 justify-center px-4 py-2 bg-slate-900/60 rounded-full border border-slate-800 backdrop-blur-sm">
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${
            color === 'indigo'
              ? 'bg-gradient-to-t from-indigo-500 to-cyan-400'
              : 'bg-gradient-to-t from-emerald-500 to-teal-300'
          }`}
          style={{
            height: isActive ? `${Math.floor(Math.random() * 20) + 8}px` : '4px',
            animation: isActive ? `wave 0.8s ease-in-out infinite alternate ${i * 0.1}s` : 'none',
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
