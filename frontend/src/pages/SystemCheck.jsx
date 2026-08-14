import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CandidateLayout from '../components/layout/CandidateLayout';
import WebCamMonitor from '../components/ui/WebCamMonitor';
import { Camera, Mic, Volume2, Wifi, Maximize, CheckCircle2, ArrowRight } from 'lucide-react';

const SystemCheck = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [tests, setTests] = useState({
    camera: false,
    mic: false,
    speaker: false,
    speed: false,
    fullscreen: false,
  });

  const [audioPlaying, setAudioPlaying] = useState(false);

  // Play audio test sound
  const playSoundTest = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 tone
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setAudioPlaying(true);
    setTimeout(() => {
      osc.stop();
      setAudioPlaying(false);
      setTests((prev) => ({ ...prev, speaker: true }));
    }, 1000);
  };

  const handleStartInterview = () => {
    // Request fullscreen mode
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    navigate(`/interview/room/${candidateId}`);
  };

  useEffect(() => {
    // Auto speed check simulation
    const timer = setTimeout(() => {
      setTests((prev) => ({ ...prev, speed: true, mic: true }));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const allPassed = tests.camera && tests.mic && tests.speaker && tests.speed;

  return (
    <CandidateLayout>
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-4xl w-full glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl glow-border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white">System Hardware Diagnostic Check</h2>
            <p className="text-xs text-slate-400 mt-1">Verify your hardware setup prior to launching the AI Interview room</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: WebCam Monitor Component */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Webcam & Face Recognition Feed</span>
              </h4>
              <WebCamMonitor
                isProctored={true}
                onStreamActive={(active) => setTests((prev) => ({ ...prev, camera: active }))}
              />
            </div>

            {/* Right: Test Checklist Matrix */}
            <div className="space-y-4">
              {/* 1. Camera Status */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Camera Feed</p>
                    <p className="text-[10px] text-slate-400">Webcam video stream</p>
                  </div>
                </div>
                {tests.camera ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 font-mono">Testing...</span>
                )}
              </div>

              {/* 2. Microphone Status */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Microphone Input</p>
                    <p className="text-[10px] text-slate-400">Voice clarity check</p>
                  </div>
                </div>
                {tests.mic ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 font-mono">Detecting...</span>
                )}
              </div>

              {/* 3. Speaker Test */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Speaker Audio Test</p>
                    <p className="text-[10px] text-slate-400">Test AI voice output</p>
                  </div>
                </div>
                <button
                  onClick={playSoundTest}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
                >
                  {audioPlaying ? 'Playing Tone...' : tests.speaker ? 'Re-Test Audio' : 'Play Test Tone'}
                </button>
              </div>

              {/* 4. Speed Test */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Network Latency</p>
                    <p className="text-[10px] text-slate-400">Ping & WebSocket connection</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 42 Mbps (Optimal)
                </span>
              </div>
            </div>
          </div>

          {/* Launch AI Interview Button */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button
              onClick={handleStartInterview}
              disabled={!allPassed}
              className={`w-full py-4 rounded-xl font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                allPassed
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>{allPassed ? 'Launch AI Interview Session' : 'Complete Audio Test to Unlock Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default SystemCheck;
