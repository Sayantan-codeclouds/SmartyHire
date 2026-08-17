import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Award,
  Users,
  Radio,
  FileText,
  Check,
  Brain,
  Mic,
  Eye,
  BarChart3,
  Clock,
  Star,
  ChevronDown,
  Lock,
  Globe,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Animated Counter ─────────────────────────────────────── */
const Counter = ({ end, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [end]);
  return <>{prefix}{count.toLocaleString()}{suffix}</>;
};

/* ─── Feature Cards ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain,
    color: 'indigo',
    title: 'SmartyHire Voice AI Interviewer',
    desc: 'Real-time conversational AI that adapts questioning depth based on candidate answers. Zero script, infinite intelligence.',
  },
  {
    icon: ShieldCheck,
    color: 'cyan',
    title: 'Advanced Proctoring HUD',
    desc: 'Detect tab switches, devtools access, face pose, and gaze deviation — all flagged live with a trust score.',
  },
  {
    icon: Award,
    color: 'emerald',
    title: '10-Skill Radar Scorecards',
    desc: 'Instant AI-generated evaluation across 10 competency axes with strengths, red flags & downloadable PDF.',
  },
  {
    icon: Radio,
    color: 'rose',
    title: 'Live HR Monitoring Wall',
    desc: 'Watch active candidate sessions over WebSocket streams. Receive alerts and intervene in real-time.',
  },
  {
    icon: Users,
    color: 'amber',
    title: 'Kanban Recruitment Pipeline',
    desc: 'Drag-and-drop candidate stage tracking from Applied → Offer Sent with full audit trails.',
  },
  {
    icon: FileText,
    color: 'violet',
    title: 'Knowledge Vault RAG',
    desc: 'Upload company handbooks and role specs so the AI interviews contextually against your actual company knowledge.',
  },
];

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-400',   glow: 'shadow-cyan-500/20'   },
  emerald:{ bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400',glow: 'shadow-emerald-500/20' },
  rose:   { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400',   glow: 'shadow-rose-500/20'   },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  glow: 'shadow-amber-500/20'  },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
};

/* ─── Pricing Plans ─────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Free',
    price: 0,
    badge: null,
    desc: 'Get started at no cost. Perfect for exploring SmartyHire.',
    features: [
      '10 AI Interviews / month',
      'Autonomous Voice Interviewer',
      'Basic Evaluation Scorecard',
      'Community Support',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Starter',
    price: 499,
    badge: 'POPULAR',
    desc: 'For growing teams ready to automate candidate screening.',
    features: [
      '50 AI Interviews / month',
      'Webcam & Mic Proctoring',
      'Full PDF Scorecard Export',
      'Email Invite + ATS API',
      'Standard Email Support',
    ],
    cta: 'Start with Starter',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 1199,
    badge: null,
    desc: 'Enterprise-grade volume, live monitoring and RAG knowledge.',
    features: [
      '250 AI Interviews / month',
      'Advanced Live Proctoring',
      'Knowledge Vault RAG',
      'Live Candidate Monitoring',
      'Priority Technical Support',
    ],
    cta: 'Go Pro',
    highlight: false,
  },
];

/* ─── Testimonials ─────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'VP Engineering, Fintech Startup',
    avatar: 'PS',
    text: 'We replaced 3 rounds of phone screens with SmartyHire. Candidates complete AI interviews in their own time and we get radar scorecards by morning.',
    rating: 5,
  },
  {
    name: 'Aditya Verma',
    role: 'Head of Talent, EdTech Platform',
    avatar: 'AV',
    text: 'The real-time proctoring and trust scores gave us immense confidence that we\'re comparing candidates on a level playing field.',
    rating: 5,
  },
  {
    name: 'Sneha Kapoor',
    role: 'CTO, SaaS Company',
    avatar: 'SK',
    text: 'The AI voice interviewer adapts based on answers — it actually asked follow-up questions about our specific tech stack. Unreal.',
    rating: 5,
  },
];

/* ─── FAQ ─────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'How does the AI interview candidate voices?',
    a: 'SmartyHire uses high-speed neural speech transcription and real-time LLM reasoning to generate contextual follow-up questions in real-time. The entire loop is autonomous.',
  },
  {
    q: 'Is the proctoring privacy-compliant?',
    a: 'Candidates provide explicit consent before the session begins. Webcam data is processed locally via MediaPipe face detection and never stored permanently. Only violation event metadata is saved.',
  },
  {
    q: 'Can I use my own interview questions?',
    a: 'Yes. You can seed the AI with a custom question bank or upload role-specific job descriptions. The AI uses this as context for generating adaptive questions.',
  },
  {
    q: 'How are scorecards generated?',
    a: 'After the interview completes, the AI analyzes all transcribed answers across 10 skill dimensions and generates a radar chart, overall score, and written summary — typically in under 30 seconds.',
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-slate-200 hover:bg-slate-800/40 transition-colors gap-4"
      >
        <span>{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-xs text-slate-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Landing Page ─────────────────────────────────────── */
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-indigo-600/20 via-cyan-500/8 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] right-[-200px] w-[600px] h-[600px] bg-gradient-radial from-violet-600/10 to-transparent blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-100px] w-[400px] h-[400px] bg-gradient-radial from-cyan-500/8 to-transparent blur-[80px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Sticky Nav ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-2xl bg-[#070B12]/90 border-b border-slate-800/80 shadow-xl shadow-black/30'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              SmartyHire <span className="text-indigo-400">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            {[['#features', 'Features'], ['#how-it-works', 'How It Works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">

          {/* Announcement pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Powered by SmartyHire Neural Engine • Speech latency &lt;500ms</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-[4.5rem] font-extrabold tracking-tight leading-[1.12] text-white"
          >
            Interview Candidates{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300">
                10× Faster
              </span>
              <span className="absolute inset-x-0 bottom-1 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 blur-sm rounded-full opacity-60" />
            </span>
            {' '}with Autonomous Voice AI
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            SmartyHire conducts unlimited AI voice interviews with real-time proctoring, live monitoring, and instant skill radar scorecards. No recruiters required.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-2 group"
            >
              <span>Create Free Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-slate-700 hover:border-indigo-500/50 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <span>Sign In to Workspace</span>
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-[11px] text-slate-600 font-medium"
          >
            No credit card required &nbsp;·&nbsp; Free plan forever &nbsp;·&nbsp; Setup in 2 minutes
          </motion.p>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-800"
          >
            {[
              { value: 50000, suffix: '+', label: 'Candidates Screened', color: 'text-white' },
              { value: 500, suffix: 'ms', prefix: '<', label: 'AI Voice Latency', color: 'text-cyan-400' },
              { value: 99, suffix: '.4%', label: 'Proctoring Accuracy', color: 'text-emerald-400' },
              { value: 10, suffix: '×', label: 'Faster Time-to-Hire', color: 'text-indigo-400' },
            ].map((s, i) => (
              <div key={i} className="bg-[#070B12]/80 px-4 py-6 text-center">
                <p className={`text-2xl sm:text-3xl font-extrabold ${s.color}`}>
                  <Counter end={s.value} suffix={s.suffix} prefix={s.prefix} />
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── App Mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-sm">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-800 bg-slate-950/60">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 bg-slate-800/70 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-500 text-center max-w-xs mx-auto">
                app.smartyhire.ai / live-ai-session
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Left: AI Interviewer Panel */}
              <div className="border-r border-slate-800/60 p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800/60">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">SmartyHire AI Interviewer</p>
                    <p className="text-[10px] text-indigo-400 font-mono">Neural Voice Engine • Active</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Question — Q3 of 5</p>
                  <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    "Walk me through how you'd architect a real-time notification system that handles 1M concurrent users."
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/20">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-300">Listening to candidate...</span>
                  <div className="ml-auto flex gap-0.5 items-end h-4">
                    {[3, 5, 4, 6, 3, 5, 7, 4].map((h, i) => (
                      <div key={i} className="w-0.5 rounded-full bg-emerald-400 animate-pulse" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Session Progress</p>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-3/5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-500">3/5 questions complete</p>
                </div>
              </div>

              {/* Right: Transcript + Proctoring */}
              <div className="lg:col-span-2 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Real-Time Proctoring & Speech Stream
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> TRUST 98%
                  </span>
                </div>

                {/* Live transcript */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/60">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
                    <span>Candidate: Arjun Mehta</span>
                    <span>Audio Latency: 28ms</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    "I'd use a fan-out architecture with Redis Pub/Sub for the hot path and Kafka for durable event streaming. Each user would maintain a persistent WebSocket connection through a gateway, and the notification microservice would broadcast targeted payloads..."
                  </p>
                </div>

                {/* Proctoring badges */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Tab Switches', value: '0 Flags', color: 'emerald' },
                    { label: 'Face Pose', value: 'Centered', color: 'cyan' },
                    { label: 'Devtools', value: 'Not Open', color: 'emerald' },
                    { label: 'Live Score', value: '91 / 100', color: 'indigo' },
                  ].map((b, i) => (
                    <div key={i} className={`p-2.5 rounded-xl text-center border ${b.color === 'indigo' ? 'bg-indigo-950/40 border-indigo-800/40' : b.color === 'cyan' ? 'bg-cyan-950/40 border-cyan-800/40' : 'bg-emerald-950/40 border-emerald-800/40'}`}>
                      <p className="text-[9px] text-slate-500 mb-1">{b.label}</p>
                      <p className={`text-[11px] font-bold ${b.color === 'indigo' ? 'text-indigo-400' : b.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'}`}>{b.value}</p>
                    </div>
                  ))}
                </div>

                {/* Radar preview bar */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Live Skill Radar Preview</p>
                  <div className="space-y-1.5">
                    {[['System Design', 88], ['Communication', 94], ['Technical Depth', 86]].map(([skill, score]) => (
                      <div key={skill} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-28 flex-shrink-0">{skill}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: 1 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating glow under mockup */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-3/4 h-20 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-24 px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-[3px] mb-3">Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">From Invite to Scorecard in Minutes</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto">No scheduling. No recruiters. Candidates interview on their time, you get AI analysis overnight.</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: '01', icon: Users, title: 'Create Interview', desc: 'Define role, skills, and difficulty. AI generates a dynamic question bank.' },
                { step: '02', icon: Zap, title: 'Invite Candidates', desc: 'Send email invites with secure 48h-expiry links. Candidates go at their own pace.' },
                { step: '03', icon: Mic, title: 'AI Conducts Session', desc: 'AI voices questions, transcribes responses, and proctors live in fullscreen.' },
                { step: '04', icon: BarChart3, title: 'Review Scorecards', desc: 'Instant AI evaluation with radar chart, score, summary, and downloadable PDF.' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center group"
                >
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 group-hover:border-indigo-500/50 transition-colors mb-5 shadow-lg mx-auto">
                    <s.icon className="w-6 h-6 text-indigo-400" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-600 text-[9px] font-black text-white flex items-center justify-center">{s.step}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-[3px] mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything Recruiters Need, Nothing They Don't</h2>
            <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto">A complete AI interviewing platform that replaces phone screens, take-home tests, and manual scorecards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const c = COLOR_MAP[f.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className={`group relative p-6 rounded-3xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 transition-all duration-300 hover:shadow-xl ${c.glow}`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${c.bg} ${c.border} border flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <f.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-24 px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-[3px] mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Trusted by Fast-Moving Teams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all space-y-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-[3px] mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Simple, Transparent Plans</h2>
            <p className="text-sm text-slate-400 mt-3">Start free. Upgrade as your hiring scales. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${
                  p.highlight
                    ? 'border-indigo-500/70 bg-gradient-to-b from-indigo-950/60 to-slate-950/60 shadow-2xl shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-lg">
                    {p.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-100 mb-1">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mt-3">
                    {p.price === 0 ? (
                      <span className="text-3xl font-extrabold text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-slate-400">₹</span>
                        <span className="text-3xl font-extrabold text-white">{p.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-500">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all ${
                    p.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {p.cta} →
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            All plans include 48-hour invite expiry, audit logs, and candidate PDF scorecards.
          </p>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-16 px-6 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Lock,    title: 'SOC 2 Ready',        desc: 'Audit-ready security controls' },
              { icon: Globe,   title: 'India-Based',         desc: 'Data hosted locally on Atlas' },
              { icon: Cpu,     title: 'Ultra-Low Latency',   desc: 'Sub-500ms voice inference' },
              { icon: ShieldCheck, title: 'GDPR Compliant', desc: 'Consent-first proctoring design' },
            ].map((b, i) => (
              <div key={i} className="text-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                <b.icon className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-200">{b.title}</p>
                <p className="text-[10px] text-slate-500 mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-[3px] mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-white">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-950 p-12 text-center overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.12)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to Hire 10× Smarter?
              </h2>
              <p className="text-sm text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                Join companies that have eliminated manual phone screens and switched to autonomous AI interviews with SmartyHire.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-2 group"
                >
                  Create Free Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center"
                >
                  Sign In to Workspace
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-sm text-white">SmartyHire AI</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-slate-600 font-medium">
            <a href="#features" className="hover:text-slate-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-400 transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-slate-400 transition-colors">Login</Link>
          </div>
          <p className="text-[11px] text-slate-700">© 2026 SmartyHire AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
