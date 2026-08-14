import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { User, Mail, Phone, FileText, Award, ShieldCheck, ArrowLeft, Send, MessageSquare, Globe } from 'lucide-react';

const CandidateDetail = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [responses, setResponses] = useState([]);
  const [report, setReport] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await api.get(`/candidates/${id}`);
        if (res.data.success) {
          setCandidate(res.data.candidate);
          setResponses(res.data.responses || []);
          setReport(res.data.report);
        }
      } catch (err) {
        console.error('[Candidate Detail Error]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await api.post(`/candidates/${id}/notes`, { text: newNote });
      if (res.data.success) {
        setCandidate((prev) => ({ ...prev, notes: res.data.notes }));
        setNewNote('');
      }
    } catch (err) {
      console.error('[Note Error]', err);
    }
  };

  if (loading || !candidate) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">Loading candidate profile...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link to="/dashboard/candidates" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Candidates List
        </Link>

        {/* Candidate Profile Header Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glow-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-extrabold text-xl flex items-center justify-center shadow-lg">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{candidate.name}</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {candidate.email} • {candidate.candidateCode}
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-800 text-[10px] font-bold">
                {candidate.interviewId?.title || 'Engineer'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Overall Score</span>
              <span className="text-2xl font-extrabold text-indigo-400">
                {(candidate.overallScore || report?.overallScore) ? `${candidate.overallScore || report.overallScore}/100` : 'Pending'}
              </span>
            </div>

            <Link
              to={`/dashboard/report/${candidate._id}`}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Full AI Scorecard</span>
            </Link>
          </div>
        </div>

        {/* Candidate Contact & Resume Info Bar */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-6 text-slate-300">
            {candidate.phone && (
              <span className="flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-cyan-400" /> {candidate.phone}
              </span>
            )}
            {candidate.linkedIn && (
              <a href={candidate.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:underline">
                <Globe className="w-3.5 h-3.5" /> LinkedIn Profile
              </a>
            )}
            {candidate.portfolio && (
              <a href={candidate.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:underline">
                <Globe className="w-3.5 h-3.5" /> Portfolio
              </a>
            )}
          </div>

          {candidate.resumeUrl ? (
            <a
              href={`http://localhost:5000${candidate.resumeUrl}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-bold flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Download Candidate Resume (PDF)</span>
            </a>
          ) : (
            <span className="text-slate-500 italic">No resume PDF uploaded</span>
          )}
        </div>

        {/* Audio Transcript & Answer Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Interview Transcripts & Answers</h3>
            {responses.length === 0 ? (
              <p className="text-xs text-slate-500">No transcripts recorded yet.</p>
            ) : (
              responses.map((resp, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300">Q{i + 1}: {resp.questionTitle}</span>
                    <span className="font-mono text-cyan-400">{resp.score ? `${resp.score}/100` : ''}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    {resp.answerText}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Recruiter Notes Sidebar */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Recruiter Notes
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {(candidate.notes || []).map((note, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <p className="font-semibold text-indigo-300 text-[11px]">{note.author}</p>
                  <p className="text-slate-300 mt-1">{note.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 bg-slate-900 text-xs text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none"
                placeholder="Add recruiter feedback note..."
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all border border-slate-700"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateDetail;
