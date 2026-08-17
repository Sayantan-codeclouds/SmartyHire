import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CandidateLayout from '../components/layout/CandidateLayout';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Sparkles, Clock, Cpu, BarChart2 } from 'lucide-react';

const QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Opportunities don\'t happen, you create them." — Chris Grosser',
  '"Success is not final; failure is not fatal." — Winston Churchill',
  '"The only way to do great work is to love what you do." — Steve Jobs',
  '"Dream big and dare to fail." — Norman Vaughan',
];

const InterviewCompleted = () => {
  const { candidateId } = useParams();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    document.title = 'Interview Submitted | SmartyHire AI';

    // Staggered confetti bursts
    const fire = (origin) =>
      confetti({ particleCount: 80, spread: 60, origin, disableForReducedMotion: true });

    fire({ y: 0.6, x: 0.4 });
    const t1 = setTimeout(() => fire({ y: 0.55, x: 0.6 }), 350);
    const t2 = setTimeout(() => fire({ y: 0.65, x: 0.5 }), 700);

    // Animate AI processing steps
    const steps = [0, 1, 2, 3];
    const timers = steps.map((s) => setTimeout(() => setStep(s + 1), (s + 1) * 900));

    return () => {
      clearTimeout(t1); clearTimeout(t2);
      timers.forEach(clearTimeout);
      document.title = 'SmartyHire AI';
    };
  }, []);

  const processingSteps = [
    { icon: Cpu,       label: 'Parsing voice transcripts',          done: step >= 1 },
    { icon: BarChart2, label: 'Scoring candidate responses',        done: step >= 2 },
    { icon: ShieldCheck,label: 'Compiling proctoring trust report', done: step >= 3 },
    { icon: Sparkles,  label: 'Generating final scorecard',         done: step >= 4 },
  ];

  return (
    <CandidateLayout>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full space-y-6">

          {/* Main Card */}
          <div className="glass-card p-10 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 glow-border space-y-6 animate-fade-in">

            {/* Success Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-40" />
              <div className="relative w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white">Interview Submitted!</h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                Your responses have been recorded. The SmartyHire AI engine is now analysing your session.
              </p>
            </div>

            {/* Session Hash */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Session Reference</p>
              <p className="text-cyan-400 font-bold text-sm">
                SH-EVAL-{candidateId ? candidateId.substring(0, 8).toUpperCase() : 'OK9928'}
              </p>
            </div>

            {/* AI Processing Steps */}
            <div className="space-y-2.5 text-left">
              {processingSteps.map(({ icon: Icon, label, done }, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-500 ${
                    done
                      ? 'bg-emerald-950/40 border border-emerald-500/20'
                      : step === i
                      ? 'bg-slate-900/60 border border-slate-700'
                      : 'border border-transparent opacity-40'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-medium ${done ? 'text-emerald-300' : 'text-slate-500'}`}>{label}</span>
                  {step === i && !done && (
                    <div className="ml-auto w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              ))}
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 py-2.5 rounded-full border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Evaluation Report Delivered to Hiring Team</span>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-center animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 italic leading-relaxed">{quote}</p>
          </div>

          <p className="text-[11px] text-slate-600">
            You may safely close this window. Results will be shared by the hiring team.
          </p>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default InterviewCompleted;
