import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-card p-6 rounded-2xl animate-pulse border border-slate-800">
    <div className="flex items-center justify-between mb-4">
      <div className="w-24 h-4 bg-slate-800 rounded" />
      <div className="w-8 h-8 bg-slate-800 rounded-full" />
    </div>
    <div className="w-16 h-8 bg-slate-800 rounded mb-2" />
    <div className="w-32 h-3 bg-slate-800 rounded" />
  </div>
);

export const TableSkeleton = () => (
  <div className="glass-card rounded-2xl overflow-hidden animate-pulse border border-slate-800">
    <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between">
      <div className="w-36 h-5 bg-slate-800 rounded" />
      <div className="w-20 h-5 bg-slate-800 rounded" />
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="p-4 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full" />
          <div>
            <div className="w-28 h-4 bg-slate-800 rounded mb-1" />
            <div className="w-20 h-3 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="w-16 h-6 bg-slate-800 rounded-full" />
      </div>
    ))}
  </div>
);
