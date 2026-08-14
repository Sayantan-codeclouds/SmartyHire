import React, { useState } from 'react';
import api from '../../services/api';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, X, KeyRound } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        setMessage(res.data.message || 'Password reset link sent to your email! Please check your inbox.');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to process password reset request. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-md w-full glass-card p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 mx-auto mb-3 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-extrabold text-white">Reset Your Password</h3>
          <p className="text-xs text-slate-400">Enter your registered work email to receive a password reset link.</p>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Sending Reset Email...' : 'Send Password Reset Link'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-1">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white transition-colors font-medium">
            Cancel & Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
