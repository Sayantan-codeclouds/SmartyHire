import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CandidateLayout from '../components/layout/CandidateLayout';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Award } from 'lucide-react';

const InterviewCompleted = () => {
  const { candidateId } = useParams();

  useEffect(() => {
    // Fire confetti celebration animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <CandidateLayout>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-card p-10 rounded-3xl border border-slate-800 shadow-2xl glow-border">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-white">Interview Submitted!</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Thank you for completing your automated session. Your responses and evaluation logs are currently being processed by the SmartyHire Groq AI Engine.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <p className="text-slate-500 text-[10px]">Session Hash Reference</p>
            <p className="text-cyan-400 font-bold">SH-EVAL-{candidateId ? candidateId.substring(0, 8).toUpperCase() : 'OK9928'}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 py-2 rounded-full border border-indigo-500/30">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Evaluation Report Delivered to Hiring Team</span>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default InterviewCompleted;
