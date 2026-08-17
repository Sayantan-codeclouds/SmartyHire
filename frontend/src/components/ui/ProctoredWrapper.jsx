import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, ShieldX } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

const ProctoredWrapper = ({
  candidateId,
  interviewId,
  companyId,
  enabled = true,
  maxViolations = 5,
  children,
  onViolation,
  onTerminate,
}) => {
  const { socket } = useSocket();
  const [violations, setViolations] = useState([]);
  const [warningModal, setWarningModal] = useState(null);
  const [terminated, setTerminated] = useState(false);
  const violationCount = useRef(0);

  const registerViolation = (type, details) => {
    if (!enabled || terminated) return;

    violationCount.current += 1;
    const count = violationCount.current;

    const newViolation = {
      type,
      details,
      timestamp: new Date().toLocaleTimeString(),
      count,
    };

    setViolations((prev) => [...prev, newViolation]);
    setWarningModal(newViolation);

    if (onViolation) onViolation(newViolation);

    // Log violation to workspace backend
    if (candidateId) {
      api.post('/candidates/violation', {
        candidateId,
        interviewId,
        companyId,
        type,
        details,
        severity: count >= maxViolations - 1 ? 'high' : 'medium',
      }).catch(() => {});
    }

    // Emit live WebSocket violation to HR Proctoring Room
    if (socket) {
      socket.emit('proctor_violation', {
        candidateId,
        interviewId,
        companyId,
        type,
        details,
        severity: count >= maxViolations - 1 ? 'high' : 'medium',
      });
    }

    // Auto-terminate session when max violations reached
    if (count >= maxViolations) {
      setTerminated(true);
      setWarningModal(null);
      if (onTerminate) onTerminate();
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Tab Switching & Visibility Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation('Tab Switch', 'Candidate navigated away from the interview tab.');
      }
    };

    // 2. Window Blur Detection
    const handleWindowBlur = () => {
      registerViolation('Window Blur', 'Focus lost from active interview window.');
    };

    // 3. Prevent Copy-Paste
    const handleCopyPaste = (e) => {
      e.preventDefault();
      registerViolation('Copy Paste Attempt', 'Candidate attempted to copy or paste content.');
    };

    // 4. Keydown Detection (DevTools & Context Menu)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        registerViolation('Developer Tools Open', 'Candidate attempted to open browser developer tools.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, candidateId, terminated]);

  // ── Session Terminated Overlay ──────────────────────────────────────────────
  if (terminated) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
        <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-rose-500/50 shadow-2xl text-center space-y-5 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto">
            <ShieldX className="w-10 h-10 text-rose-400" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Session Terminated</h2>
            <p className="text-sm text-rose-400 font-semibold mt-1">Maximum violations exceeded</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your interview session has been automatically terminated due to repeated proctoring violations
            ({maxViolations}/{maxViolations} violations recorded). Your responses up to this point have been saved.
          </p>
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs font-mono text-rose-300">
            {violations.length} violation{violations.length !== 1 ? 's' : ''} logged · Session auto-closed
          </div>
          <p className="text-[11px] text-slate-500">
            The hiring team has been notified. You may close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {children}

      {/* Proctoring Warning Overlay Popup */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-rose-500/40 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-100">Proctoring Warning Alert</h3>
            <p className="text-sm text-rose-400 font-semibold mt-1">{warningModal.type} Detected</p>

            <div className="my-4 p-3 bg-rose-950/40 rounded-xl border border-rose-900/50 text-xs text-slate-300">
              {warningModal.details}
            </div>

            {/* Violation counter */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: maxViolations }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < warningModal.count ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Violation {warningModal.count} of {maxViolations} — session will be auto-terminated at {maxViolations}
            </p>

            <button
              onClick={() => setWarningModal(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-medium text-sm transition-all shadow-lg shadow-rose-900/40"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoredWrapper;
