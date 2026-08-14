import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email.trim(), password);
      if (data.user?.role !== 'Super Admin') {
        setError('Access Denied: This login portal is strictly reserved for Platform Super Administrators.');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root min-h-screen flex items-center justify-center p-6 selection:bg-amber-500 selection:text-white">
      <div className="max-w-md w-full admin-card p-8 rounded-3xl border border-amber-900/40 shadow-2xl space-y-6">
        {/* Header Badge */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 mx-auto mb-4 shadow-xl shadow-orange-950/60 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Console</h1>
          <p className="text-xs text-amber-500 font-semibold mt-1">Platform Control & User Management Portal</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 font-medium flex items-start gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="admin-label">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                id="admin-email"
                name="admin-email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input pl-10"
                placeholder="admin@yourdomain.com"
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                id="admin-password"
                name="admin-password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs transition-all shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Console'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <a href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Switch to Company Workspace Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
