import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CandidateLayout from '../components/layout/CandidateLayout';
import { Briefcase, Clock, ShieldCheck, Video, Mic, CheckCircle2, ArrowRight } from 'lucide-react';

const PublicInterviewLanding = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInterview() {
      try {
        const res = await api.get(`/interviews/public/${publicId}`);
        if (res.data.success) {
          setInterview(res.data.interview);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Interview link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    }
    fetchInterview();
  }, [publicId]);

  if (loading) {
    return (
      <CandidateLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </CandidateLayout>
    );
  }

  if (error || !interview) {
    return (
      <CandidateLayout>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-rose-500/30">
            <h3 className="text-xl font-bold text-rose-400">Interview Not Available</h3>
            <p className="text-xs text-slate-400 mt-2">{error}</p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-3xl w-full glass-card p-8 md:p-10 rounded-3xl border border-slate-800 shadow-2xl glow-border">
          {/* Header Badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg">
              {interview.company?.name ? interview.company.name.charAt(0) : 'C'}
            </div>
            <div>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                {interview.company?.name || 'Company'} Hiring Portal
              </h3>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{interview.title}</h1>
            </div>
          </div>

          {/* Quick Details Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px]">Department</span>
              <span className="font-semibold text-slate-200">{interview.department}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px]">Role Type</span>
              <span className="font-semibold text-slate-200">{interview.employmentType}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px]">Duration</span>
              <span className="font-semibold text-slate-200">{interview.durationMinutes} mins</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px]">Questions</span>
              <span className="font-semibold text-slate-200">{interview.questionCount} Questions</span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 my-6 text-xs text-slate-300 space-y-3">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Session & Proctoring Requirements</span>
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Webcam & Microphone access are strictly required.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Anti-cheating tab switch & window blur monitoring is enabled.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Groq AI engine will adapt follow-up questions in real-time.</span>
              </li>
            </ul>
          </div>

          {/* Action CTA */}
          <button
            onClick={() => navigate(`/interview/register/${publicId}`)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <span>Proceed to Candidate Registration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default PublicInterviewLanding;
