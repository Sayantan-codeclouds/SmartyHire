import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

const ProctoredWrapper = ({ candidateId, interviewId, companyId, enabled = true, children, onViolation }) => {
  const { socket } = useSocket();
  const [violations, setViolations] = useState([]);
  const [warningModal, setWarningModal] = useState(null);

  const registerViolation = (type, details) => {
    if (!enabled) return;

    const newViolation = {
      type,
      details,
      timestamp: new Date().toLocaleTimeString(),
    };

    setViolations((prev) => [...prev, newViolation]);
    setWarningModal(newViolation);

    if (onViolation) {
      onViolation(newViolation);
    }

    // Log violation to MongoDB backend
    if (candidateId) {
      api.post('/candidates/violation', {
        candidateId,
        interviewId,
        companyId,
        type,
        details,
        severity: 'medium',
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
        severity: 'medium',
      });
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
  }, [enabled, candidateId]);

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

            <p className="text-xs text-slate-400 mb-6">
              This action has been logged into your candidate evaluation report. Continued violations will automatically terminate the session.
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
