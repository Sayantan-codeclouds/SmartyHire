import React from 'react';
import { Bot, Sparkles, Mic, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const AIAvatar = ({ state = 'speaking', personality = 'Professional & Friendly' }) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 glass-card rounded-2xl border border-indigo-500/20 shadow-2xl">
      {/* Outer Pulse Rings */}
      <div className="relative flex items-center justify-center">
        {state === 'speaking' && (
          <>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute w-36 h-36 rounded-full bg-indigo-500/20 blur-md"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.3 }}
              className="absolute w-44 h-44 rounded-full bg-cyan-500/15 blur-lg"
            />
          </>
        )}

        {/* Central Glowing AI Avatar Sphere */}
        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-1 shadow-lg shadow-indigo-500/30">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border border-indigo-400/30">
            {state === 'thinking' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
                <Brain className="w-12 h-12 text-cyan-400" />
              </motion.div>
            ) : (
              <Bot className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
            )}
          </div>
        </div>
      </div>

      {/* AI State Badge */}
      <div className="mt-5 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        <span>
          {state === 'speaking'
            ? 'SmartyHire AI Speaking...'
            : state === 'listening'
            ? 'Listening to Candidate...'
            : 'Evaluating Response...'}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400 font-mono">Persona: {personality}</p>
    </div>
  );
};

export default AIAvatar;
