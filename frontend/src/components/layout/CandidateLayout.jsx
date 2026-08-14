import React from 'react';

const CandidateLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between glass-panel">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center font-bold text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-cyan-300 text-xs">
              SH
            </div>
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            SmartyHire <span className="text-indigo-400">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-slate-400">PROCTORED INTERVIEW ENVIRONMENT</span>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

export default CandidateLayout;
