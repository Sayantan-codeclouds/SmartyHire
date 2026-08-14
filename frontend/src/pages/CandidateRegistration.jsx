import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CandidateLayout from '../components/layout/CandidateLayout';
import { User, Mail, Phone, Upload, Linkedin, Globe, Shield, ArrowRight, TimerReset, Calendar } from 'lucide-react';

const CandidateRegistration = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownInfo, setCooldownInfo] = useState(null); // { unlocksAt, cooldownMonths }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) {
      setError('You must accept the proctoring consent to proceed.');
      return;
    }

    setLoading(true);
    setError('');
    setCooldownInfo(null);

    try {
      const formData = new FormData();
      formData.append('publicId', publicId);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('linkedIn', linkedIn);
      formData.append('portfolio', portfolio);
      if (resumeFile) formData.append('resume', resumeFile);
      formData.append('systemCheck', JSON.stringify({ consentGiven: true }));

      const res = await api.post('/candidates/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        // Save candidate ID locally and proceed to hardware system check
        sessionStorage.setItem('sh_candidateId', res.data.candidateId);
        navigate(`/interview/system-check/${res.data.candidateId}`);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.isCooldown) {
        setCooldownInfo({ unlocksAt: data.unlocksAt, cooldownMonths: data.cooldownMonths });
      } else {
        setError(data?.message || 'Registration failed. Please check form entries.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidateLayout>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl glow-border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white">Candidate Registration</h2>
            <p className="text-xs text-slate-400 mt-1">Provide your details to initiate the AI Interview</p>
          </div>

          {/* Cooldown Banner */}
          {cooldownInfo && (
            <div className="mb-6 p-5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-center space-y-3 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <TimerReset className="w-5 h-5" />
                <span className="font-bold text-sm">Application on Cooldown</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                This email address has already been used for this interview and is currently in a re-application cooldown period.
              </p>
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-900/40 border border-amber-600/30">
                <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-300">
                  You may re-apply after{' '}
                  <span className="font-extrabold text-white">
                    {new Date(cooldownInfo.unlocksAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
              <p className="text-[10px] text-amber-700/80">
                Cooldown period: {cooldownInfo.cooldownMonths} {cooldownInfo.cooldownMonths === 1 ? 'month' : 'months'}
              </p>
            </div>
          )}

          {/* Generic Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
                  placeholder="Sophia Chen"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
                  placeholder="sophia@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">LinkedIn Profile</label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Upload Resume (PDF, DOCX)</label>
              <div className="relative flex items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-900/50 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>{resumeFile ? resumeFile.name : 'Click or drop resume file here'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-400 leading-tight">
                  I consent to video/audio recording, automated face detection, tab activity monitoring, and AI evaluation of my responses.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? 'Registering...' : 'Continue to Hardware System Check'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateRegistration;
