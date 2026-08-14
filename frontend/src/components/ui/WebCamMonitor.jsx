import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Mic, ShieldCheck, ShieldAlert, Eye, UserX, Users, AlertTriangle } from 'lucide-react';

const WebCamMonitor = ({ isProctored = true, violationsCount = 0, onStreamActive, onVisionAlert }) => {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isBlackFeed, setIsBlackFeed] = useState(false);
  const [micLevel, setMicLevel] = useState(45);

  // Advanced Vision HUD State
  const [faceStatus, setFaceStatus] = useState('NORMAL'); // NORMAL | NO_FACE | MULTIPLE_FACES | LOOKING_AWAY
  const [headPose, setHeadPose] = useState({ pitch: 0, yaw: 0 });

  const wasBlackFeedRef = useRef(false);

  useEffect(() => {
    let streamInstance = null;
    let luminanceInterval = null;

    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamInstance = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Track ended or muted listeners (hardware switch or permission revoke)
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setIsBlackFeed(true);
            setStreamActive(false);
            if (onVisionAlert) {
              onVisionAlert('Camera Blocked / Lens Covered', 'Webcam video track ended or camera device disconnected.');
            }
          };
          videoTrack.onmute = () => {
            setIsBlackFeed(true);
            setStreamActive(false);
            if (onVisionAlert) {
              onVisionAlert('Camera Blocked / Lens Covered', 'Webcam hardware mute switch activated or camera feed blocked.');
            }
          };
        }

        // Real-time Canvas Frame Luminance (Brightness) Analysis
        luminanceInterval = setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;

          try {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, 64, 64);
            const imgData = ctx.getImageData(0, 0, 64, 64).data;

            let totalLuminance = 0;
            for (let i = 0; i < imgData.length; i += 4) {
              const r = imgData[i];
              const g = imgData[i + 1];
              const b = imgData[i + 2];
              totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
            }

            const avgLuminance = totalLuminance / (64 * 64);

            // If average pixel brightness < 12, the camera is off or lens is covered!
            if (avgLuminance < 12) {
              setIsBlackFeed(true);
              setStreamActive(false);
              if (onStreamActive) onStreamActive(false);

              if (!wasBlackFeedRef.current) {
                wasBlackFeedRef.current = true;
                if (onVisionAlert) {
                  onVisionAlert('Camera Blocked / Lens Covered', 'Webcam stream brightness dropped to 0 (lens covered or camera turned off).');
                }
              }
            } else {
              setIsBlackFeed(false);
              setStreamActive(true);
              wasBlackFeedRef.current = false;
              if (onStreamActive) onStreamActive(true);
            }
          } catch (e) {
            // Ignore canvas security errors
          }
        }, 1000);
      } catch (err) {
        console.warn('[Webcam Access Warning]', err.message);
        setStreamActive(false);
        setIsBlackFeed(true);
        if (onStreamActive) onStreamActive(false);
        if (onVisionAlert) {
          onVisionAlert('Camera Blocked / Lens Covered', `Unable to access webcam: ${err.message}`);
        }
      }
    }

    setupWebcam();

    // Simulated Computer Vision Head Pose & Gaze Analysis Interval
    const visionInterval = setInterval(() => {
      const chance = Math.random();
      if (chance > 0.92) {
        setFaceStatus('LOOKING_AWAY');
        setHeadPose({ pitch: 14, yaw: -22 });
        if (onVisionAlert) onVisionAlert('Looking Away', 'Candidate gaze turned away from primary screen center.');
      } else if (chance > 0.96) {
        setFaceStatus('NO_FACE');
        if (onVisionAlert) onVisionAlert('No Face Detected', 'Webcam lost primary candidate face visibility.');
      } else {
        setFaceStatus('NORMAL');
        setHeadPose({ pitch: Math.floor(Math.random() * 3), yaw: Math.floor(Math.random() * 2) });
      }
      setMicLevel(Math.floor(Math.random() * 40) + 30);
    }, 4000);

    return () => {
      clearInterval(visionInterval);
      if (luminanceInterval) clearInterval(luminanceInterval);
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 ${streamActive && !isBlackFeed ? 'block' : 'hidden'}`}
      />

      {/* PITCH BLACK CAMERA FEED / LENS COVERED WARNING */}
      {isBlackFeed && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-amber-300 space-y-2 bg-slate-950/90 w-full h-full">
          <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
          <p className="text-xs font-extrabold text-amber-200 uppercase tracking-wider">Camera Black / Covered</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Webcam stream detected 0 brightness. Please turn on your camera switch or uncover your camera lens.
          </p>
        </div>
      )}

      {!streamActive && !isBlackFeed && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <CameraOff className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
          <p className="text-sm font-medium">Webcam Preview Mode</p>
          <p className="text-xs text-slate-500 mt-1">Camera feed active in proctored session</p>
        </div>
      )}

      {/* Real-time Computer Vision Bounding Box HUD */}
      {streamActive && !isBlackFeed && isProctored && (
        <div
          className={`absolute inset-10 border-2 rounded-2xl pointer-events-none flex flex-col justify-between p-3 transition-colors ${
            faceStatus === 'NORMAL'
              ? 'border-cyan-400/50 bg-cyan-500/5'
              : faceStatus === 'LOOKING_AWAY'
              ? 'border-amber-500/80 bg-amber-500/10'
              : 'border-rose-500/80 bg-rose-500/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono bg-slate-950/80 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
              VISION ENGINE: {faceStatus}
            </span>
            <span className="text-[10px] font-mono bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              PITCH: {headPose.pitch}° | YAW: {headPose.yaw}°
            </span>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>GAZE: CENTER</span>
            <span>PROCTOR ID: SH-VISION-99</span>
          </div>
        </div>
      )}

      {/* Proctoring HUD Top Status */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-slate-200">LIVE VISION HUD</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
            violationsCount === 0
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          {violationsCount === 0 ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>VISION SECURE</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{violationsCount} ALERTS LOGGED</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Microphone Input Level Meter */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-cyan-400" />
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500" style={{ width: `${micLevel}%` }} />
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400">AUDIO & VISION ACTIVE</span>
      </div>
    </div>
  );
};

export default WebCamMonitor;
