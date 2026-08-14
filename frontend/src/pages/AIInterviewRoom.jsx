import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CandidateLayout from '../components/layout/CandidateLayout';
import ProctoredWrapper from '../components/ui/ProctoredWrapper';
import AIAvatar from '../components/ui/AIAvatar';
import AudioVisualizer from '../components/ui/AudioVisualizer';
import WebCamMonitor from '../components/ui/WebCamMonitor';
import {
  Mic, MicOff, ArrowRight, Clock, Sparkles, Code, Lock,
  Video, Play, Terminal, ChevronRight, SkipForward, Lightbulb,
  CheckCircle, CheckCircle2, AlertCircle, Volume2, VolumeX,
} from 'lucide-react';

// ─── Type badge config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Technical:  { bg: 'bg-indigo-950/80',  text: 'text-indigo-300',  border: 'border-indigo-500/30'  },
  Behavioral: { bg: 'bg-violet-950/80',  text: 'text-violet-300',  border: 'border-violet-500/30'  },
  Coding:     { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  HR:         { bg: 'bg-cyan-950/80',    text: 'text-cyan-300',    border: 'border-cyan-500/30'    },
  Scenario:   { bg: 'bg-amber-950/80',   text: 'text-amber-300',   border: 'border-amber-500/40'   },
  Aptitude:   { bg: 'bg-rose-950/80',    text: 'text-rose-300',    border: 'border-rose-500/30'    },
  'Follow-up':{ bg: 'bg-cyan-950/80',    text: 'text-cyan-300',    border: 'border-cyan-500/30'    },
};

const getTypeStyle = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.Technical;

// ─── Circular Timer ──────────────────────────────────────────────────────────
const CircularTimer = ({ seconds, total }) => {
  const pct = total > 0 ? seconds / total : 1;
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const isWarning = seconds <= 30;
  const isCritical = seconds <= 10;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#6366F1'}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={`text-sm font-bold font-mono tabular-nums ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'}`}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </span>
    </div>
  );
};

// ─── Question Dot Navigator ──────────────────────────────────────────────────
const QuestionDots = ({ total, current }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-300 ${
          i < current       ? 'w-2 h-2 bg-indigo-500'
          : i === current   ? 'w-3 h-2 bg-indigo-400 shadow-md shadow-indigo-500/40'
          : 'w-2 h-2 bg-slate-700'
        }`}
      />
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const AIInterviewRoom = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  // ── Session state ──────────────────────────────────────────────────────────
  const [candidate, setCandidate] = useState(null);
  const [interview, setInterview]   = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [isExpiredError, setIsExpiredError] = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [hasShownFollowUp, setHasShownFollowUp] = useState(false);
  const [aiQAAnswer, setAiQAAnswer]       = useState('');

  // ── AI/voice state ─────────────────────────────────────────────────────────
  const [aiState, setAiState]           = useState('speaking');
  const [isRecording, setIsRecording]   = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const [answerText, setAnswerText]     = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [overallSeconds, setOverallSeconds] = useState(1800);
  const [violationsCount, setViolationsCount] = useState(0);
  const [showHints, setShowHints]       = useState(false);

  // ── Coding state ───────────────────────────────────────────────────────────
  const [codeValue, setCodeValue]       = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  // ── Refs (no stale closures) ───────────────────────────────────────────────
  const recognitionRef  = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef       = useRef(null);
  const handleNextRef   = useRef(null); // always holds latest handleNextQuestion
  const isSubmittingRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Speech Recognition & TTS helpers
  // ─────────────────────────────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend    = null;
      recognitionRef.current.onstart  = null;
      recognitionRef.current.onerror  = null;
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopRecognition();                      // always clear previous instance first
    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = 'en-US';
    rec.onresult = (e) => {
      let full = '';
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      setAnswerText(full);
    };
    rec.onstart = () => setIsRecording(true);
    rec.onend   = () => setIsRecording(false);
    rec.onerror = (ev) => {
      console.warn('[SpeechRecognition]', ev.error);
      setIsRecording(false);
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch (_) {}
  }, [stopRecognition]);

  const speakQuestion = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) {
      setAiState('listening');
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.pitch = 1.0;
    setAiState('speaking');
    utt.onend = () => {
      setAiState('listening');
      startRecognition();
    };
    utt.onerror = () => setAiState('listening');
    window.speechSynthesis.speak(utt);
  }, [isMuted, startRecognition]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecognition();
    } else {
      startRecognition();
    }
  }, [isRecording, startRecognition, stopRecognition]);

  // ─────────────────────────────────────────────────────────────────────────
  // Video Recording
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || isExpiredError) return;

    async function startVideoRecorder() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        recordedChunksRef.current = [];
        let rec;
        try { rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' }); }
        catch (_) { rec = new MediaRecorder(stream); }
        rec.ondataavailable = (e) => { if (e.data?.size > 0) recordedChunksRef.current.push(e.data); };
        rec.start(1000);
        mediaRecorderRef.current = rec;
      } catch (err) {
        console.warn('[Video Recorder]', err.message);
      }
    }
    startVideoRecorder();

    return () => {
      mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [loading, isExpiredError]);

  const uploadVideo = async () => {
    if (!recordedChunksRef.current.length) return;
    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const fd   = new FormData();
      fd.append('video', blob, `session-${candidateId}.webm`);
      await api.post(`/candidates/recording/${candidateId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) { console.error('[Video Upload]', err); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Load session
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/candidates/session/${candidateId}`);
        if (res.data.success) {
          setCandidate(res.data.candidate);
          setInterview(res.data.interview);
          setQuestions(res.data.questions || []);
        }
      } catch (err) {
        if (err.response?.status === 403 || err.response?.data?.isExpired) {
          setIsExpiredError(true);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [candidateId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Reset per question & start TTS — runs whenever currentIndex changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || isExpiredError || !questions.length) return;
    const q = questions[currentIndex];
    if (!q) return;

    window.speechSynthesis?.cancel();
    stopRecognition();
    setAnswerText('');
    setConsoleOutput('');
    setFollowUpQuestion('');
    setAiQAAnswer('');
    setHasShownFollowUp(false);
    setShowHints(false);
    setTimerSeconds(q.timeLimitSeconds || 180);

    if (q.type === 'Coding') {
      setCodeValue('// Write your solution here\nfunction solution() {\n  // your code\n}\n');
    } else {
      setCodeValue('');
    }

    // Slight delay so state settles
    const tid = setTimeout(() => speakQuestion(q.questionText), 300);
    return () => clearTimeout(tid);
  }, [currentIndex, loading, isExpiredError, questions.length]);

  // ─────────────────────────────────────────────────────────────────────────
  // handleNextQuestion — forward-declared via ref to avoid stale closures
  // ─────────────────────────────────────────────────────────────────────────
  const handleNextQuestion = useCallback(async (isAutoAdvance = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setAiState('thinking');
    window.speechSynthesis?.cancel();
    stopRecognition();

    const q = questions[currentIndex];

    try {
      // CANDIDATE Q&A CONTINUOUS RAG RESPONSE LOOP ON FINAL QUESTION
      if (q?.type === 'Candidate-Q&A' || q?.isCandidateQA) {
        const textToSend = answerText.trim() || 'What is the company culture and team structure like?';
        try {
          const qaRes = await api.post('/ai/candidate-qa', {
            candidateId,
            candidateQuestion: textToSend,
          });

          if (qaRes.data.success && qaRes.data.aiAnswer) {
            setAiQAAnswer(qaRes.data.aiAnswer);
            speakQuestion(qaRes.data.aiAnswer);
            setAnswerText(''); // Reset text box so candidate can easily ask their next question!

            // If candidate indicated they have no further questions or AI declared closing:
            if (qaRes.data.isClosing) {
              setTimeout(async () => {
                try {
                  mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop();
                  await uploadVideo().catch((e) => console.warn('[Video Upload Warning]', e));
                } catch (_) {}

                try {
                  await api.post(`/candidates/complete/${candidateId}`);
                } catch (cErr) {
                  console.warn('[Complete API Warning]', cErr.message);
                }

                navigate(`/interview/completed/${candidateId}`, { replace: true });
              }, 4500);
              return;
            }

            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return; // Stay on screen for candidate's next question!
          }
        } catch (e) {
          console.warn('[Candidate QA RAG Error]', e);
        }
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return; // Always prevent fall-through on Candidate-Q&A question
      }

      // Submit answer
      await api.post('/candidates/response', {
        candidateId,
        questionId: q?._id || null,
        questionTitle: q?.title || `Question ${currentIndex + 1}`,
        questionText:  q?.questionText || '',
        answerText:    answerText || 'No response provided.',
        codeSubmitted: q?.type === 'Coding' ? codeValue : '',
        durationSeconds: (q?.timeLimitSeconds || 180) - timerSeconds,
      });

      // Try follow-up only on manual submit, once per question, for substantive answers
      if (!isAutoAdvance && !hasShownFollowUp && answerText.trim().length > 40) {
        try {
          const res = await api.post('/ai/follow-up', {
            candidateId,
            questionText:    q?.questionText,
            candidateAnswer: answerText,
            jobTitle:        interview?.title || 'Engineer',
            expectedAnswerKeyPoints: q?.expectedAnswerKeyPoints || [],
          });
          if (res.data.success && res.data.followUpQuestion) {
            setFollowUpQuestion(res.data.followUpQuestion);
            setHasShownFollowUp(true);
            setTimerSeconds(60); // 60s for follow-up
            speakQuestion(res.data.followUpQuestion);
            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return; // stay on same question for follow-up answer
          }
        } catch (_) {}
      }

      // Advance or complete
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(p => p + 1);
      } else {
        // Complete interview (fail-safe sequence)
        try {
          mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop();
          await uploadVideo().catch(e => console.warn('[Video Upload Warning]', e));
        } catch (_) {}

        try {
          await api.post(`/candidates/complete/${candidateId}`);
        } catch (cErr) {
          console.warn('[Complete API Warning]', cErr.message);
        }

        try {
          await api.post(`/ai/evaluate/${candidateId}`);
        } catch (eErr) {
          console.warn('[Evaluate API Warning]', eErr.message);
        }

        navigate(`/interview/completed/${candidateId}`);
      }
    } catch (err) {
      console.error('[Submit Error]', err);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(p => p + 1);
      } else {
        try {
          await api.post(`/candidates/complete/${candidateId}`);
          await api.post(`/ai/evaluate/${candidateId}`);
        } catch (_) {}
        navigate(`/interview/completed/${candidateId}`);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [questions, currentIndex, answerText, codeValue, timerSeconds, hasShownFollowUp,
      candidateId, interview, navigate, stopRecognition, speakQuestion]);

  // Keep ref current
  handleNextRef.current = handleNextQuestion;

  // ─────────────────────────────────────────────────────────────────────────
  // Timer — uses ref to avoid stale closure bug
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (interview?.durationMinutes) {
      setOverallSeconds(interview.durationMinutes * 60);
    }
  }, [interview?.durationMinutes]);

  useEffect(() => {
    if (loading || isExpiredError || aiState === 'thinking') return;
    const id = setInterval(() => {
      setOverallSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [loading, isExpiredError, aiState]);

  useEffect(() => {
    if (loading || isExpiredError || aiState === 'thinking') return;
    const id = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimeout(() => handleNextRef.current?.(true), 0); // auto-advance via ref
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [currentIndex, loading, isExpiredError, aiState]);

  // ─────────────────────────────────────────────────────────────────────────
  // Code execution sandbox
  // ─────────────────────────────────────────────────────────────────────────
  const runCode = useCallback(() => {
    setConsoleOutput('Running in sandboxed JS environment…\n');
    try {
      const logs = [];
      const sandbox = {
        log:   (...a) => logs.push(a.join(' ')),
        error: (...a) => logs.push('[ERR] ' + a.join(' ')),
        warn:  (...a) => logs.push('[WARN] ' + a.join(' ')),
      };
      // eslint-disable-next-line no-new-func
      new Function('console', codeValue)(sandbox);
      setConsoleOutput(logs.join('\n') || '✓ Executed with no output.');
    } catch (err) {
      setConsoleOutput(`[RuntimeError]: ${err.message}`);
    }
  }, [codeValue]);

  const handleVisionAlert = useCallback((type, details) => {
    setViolationsCount(p => p + 1);
    if (candidateId) {
      api.post('/candidates/violation', {
        candidateId,
        type,
        details,
        severity: 'medium',
      }).catch(() => {});
    }
  }, [candidateId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex] || {
    title: 'Loading…', questionText: 'Please wait while we prepare your question.',
    type: 'Technical', timeLimitSeconds: 180, difficulty: 'Mid-Level',
    competency: 'General', expectedAnswerKeyPoints: [],
  };
  const totalTime    = currentQuestion.timeLimitSeconds || 180;
  const typeStyle    = getTypeStyle(currentQuestion.type);
  const progressPct  = questions.length ? Math.round(((currentIndex) / questions.length) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading screen
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <CandidateLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm font-medium">Initialising your interview session…</p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Expired screen
  // ─────────────────────────────────────────────────────────────────────────
  if (isExpiredError) {
    return (
      <CandidateLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Interview Link Expired</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This interview invitation has expired or was already completed. Interview links are valid for <strong className="text-white">48 hours</strong>.
          </p>
          <code className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300">
            ERR: LINK_EXPIRED_48H
          </code>
        </div>
      </CandidateLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Interview Room
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ProctoredWrapper
      candidateId={candidateId}
      interviewId={interview?._id}
      companyId={candidate?.companyId}
      enabled={true}
      onViolation={() => setViolationsCount(p => p + 1)}
    >
      <CandidateLayout>
        {/* ── Top HUD Bar ─────────────────────────────────────────────── */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md flex-wrap">
          {/* Left: progress */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Q {currentIndex + 1} / {questions.length}
            </span>
            <QuestionDots total={questions.length} current={currentIndex} />
            <div className="hidden sm:flex w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Right: badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Overall Session Duration Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] sm:text-[11px] font-mono font-bold text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Session: {Math.floor(overallSeconds / 60)}:{String(overallSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Mute TTS */}
            <button
              onClick={() => { setIsMuted(p => !p); window.speechSynthesis?.cancel(); }}
              title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Recording badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-[10px] font-bold text-rose-300">
              <Video className="w-3 h-3 animate-pulse" />
              <span className="hidden sm:inline">Recording</span>
            </div>

            {/* Violations */}
            {violationsCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                <AlertCircle className="w-3 h-3" />
                {violationsCount} Alert{violationsCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Layout ──────────────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-6 max-w-[1400px] mx-auto w-full items-start">

          {/* ── Left Panel: AI + Webcam ──────────────────────────────── */}
          <div className="space-y-4">
            <AIAvatar state={aiState} personality={interview?.aiConfig?.personality || 'Professional & Friendly'} />
            <AudioVisualizer isActive={aiState === 'speaking' || isRecording} color={aiState === 'speaking' ? 'indigo' : 'emerald'} />
            <WebCamMonitor isProctored={true} violationsCount={violationsCount} onVisionAlert={handleVisionAlert} />
          </div>

          {/* ── Right Panel: Question + Answer ───────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Question Card */}
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              {/* Card header */}
              <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap bg-slate-950/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                    {currentQuestion.type}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300 uppercase tracking-wide">
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {currentQuestion.competency}
                  </span>
                  {followUpQuestion && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> AI Follow-Up
                    </span>
                  )}
                </div>
                <CircularTimer seconds={timerSeconds} total={totalTime} />
              </div>

              {/* Question text */}
              <div className="px-5 py-5">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {followUpQuestion || currentQuestion.questionText}
                </h3>

                {/* Hints toggle */}
                {currentQuestion.expectedAnswerKeyPoints?.length > 0 && !followUpQuestion && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowHints(p => !p)}
                      className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-400 transition-colors font-medium"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      {showHints ? 'Hide key points' : 'Show expected key points'}
                      <ChevronRight className={`w-3 h-3 transition-transform ${showHints ? 'rotate-90' : ''}`} />
                    </button>
                    {showHints && (
                      <ul className="mt-2 space-y-1.5">
                        {currentQuestion.expectedAnswerKeyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Coding Editor (Coding questions only) ─────────────── */}
            {currentQuestion.type === 'Coding' && (
              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    Interactive Code Sandbox
                  </span>
                  <button
                    onClick={runCode}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Play className="w-3 h-3 fill-white" /> Run
                  </button>
                </div>
                <textarea
                  value={codeValue}
                  onChange={e => setCodeValue(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  className="w-full p-4 font-mono text-xs bg-[#0A0E16] text-cyan-300 focus:outline-none resize-none leading-relaxed border-b border-slate-800"
                  placeholder="// Write your solution here"
                />
                {consoleOutput && (
                  <div className="p-4 bg-slate-950 text-[11px] font-mono text-slate-300 max-h-32 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mb-1.5">
                      <Terminal className="w-3 h-3 text-cyan-400" /> CONSOLE OUTPUT
                    </div>
                    <pre className="whitespace-pre-wrap text-slate-200">{consoleOutput}</pre>
                  </div>
                )}
              </div>
            )}

            {/* ── Answer Area ───────────────────────────────────────── */}
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  Your Answer
                  {isRecording && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </label>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                    isRecording
                      ? 'bg-rose-950/80 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? 'Stop Mic' : 'Start Mic'}
                </button>
              </div>

              <div className="p-5 space-y-4">
                {aiQAAnswer && (
                  <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-xs text-slate-100 space-y-2 font-sans shadow-lg">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>AI Interviewer Answer (RAG):</span>
                    </div>
                    <p className="leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-slate-200">{aiQAAnswer}</p>
                  </div>
                )}

                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-slate-900/80 text-sm text-slate-100 placeholder-slate-600 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors resize-none leading-relaxed"
                  placeholder={
                    currentQuestion?.type === 'Candidate-Q&A' || currentQuestion?.isCandidateQA
                      ? 'Type or speak your question for the AI Interviewer about the role, tech stack, or company culture...'
                      : isRecording ? 'Listening… speak your answer or type here' : 'Type your answer or start mic recording…'
                  }
                />

                <div className="flex items-center justify-between pt-1 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600 font-mono">{answerText.length} chars</span>
                    {/* Skip */}
                    <button
                      onClick={() => handleNextRef.current?.(true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                    >
                      <SkipForward className="w-3.5 h-3.5" /> Skip
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {(currentQuestion?.type === 'Candidate-Q&A' || currentQuestion?.isCandidateQA) && (
                      <button
                        onClick={() => {
                          setAnswerText('No more questions, thank you.');
                          setTimeout(() => handleNextRef.current?.(false), 50);
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>No More Questions (Finish)</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNextRef.current?.(false)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                        : <>
                            {(currentQuestion?.type === 'Candidate-Q&A' || currentQuestion?.isCandidateQA)
                              ? 'Ask AI Interviewer'
                              : (currentIndex + 1 === questions.length ? 'Submit Interview' : 'Next Question')
                            }
                            <ArrowRight className="w-4 h-4" />
                          </>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CandidateLayout>
    </ProctoredWrapper>
  );
};

export default AIInterviewRoom;
