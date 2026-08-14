import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Award, Download, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, MessageSquare, Code, Clock, Video } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const ReportDetail = () => {
  const { candidateId } = useParams();
  const [report, setReport] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [evaluating, setEvaluating] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Fetch Candidate details first
      const candidateRes = await api.get(`/candidates/${candidateId}`);
      if (candidateRes.data.success) {
        setCandidate(candidateRes.data.candidate);
        setResponses(candidateRes.data.responses || []);
      }

      // Fetch Report
      try {
        const reportRes = await api.get(`/reports/candidate/${candidateId}`);
        if (reportRes.data.success) {
          setReport(reportRes.data.report);
        }
      } catch (rErr) {
        console.warn('[Report Not Found Yet]', rErr.message);
      }
    } catch (err) {
      console.error('[Report Detail Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [candidateId]);

  const handleGenerateScorecard = async () => {
    setEvaluating(true);
    try {
      const evalRes = await api.post(`/ai/evaluate/${candidateId}`);
      if (evalRes.data.success) {
        setReport(evalRes.data.report);
        if (evalRes.data.candidate) {
          setCandidate(evalRes.data.candidate);
        }
        await fetchReportData();
      }
    } catch (err) {
      console.error('[Evaluation Trigger Error]', err);
      alert('Failed to generate scorecard. Please ensure the candidate has completed responses.');
    } finally {
      setEvaluating(false);
    }
  };

  // Clean Blob PDF Download using configured axios API client
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/candidate/${candidateId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const candidateName = candidate?.name ? candidate.name.replace(/\s+/g, '_') : 'Candidate';
      link.setAttribute('download', `SmartyHire_AI_Report_${candidateName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PDF Download Error]', err);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-mono text-xs">Loading Groq AI evaluation report & transcript...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6 font-sans py-8">
          <Link to="/dashboard/candidates" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 text-indigo-400" /> Back to Candidates Directory
          </Link>

          <div className="glass-card p-10 rounded-3xl border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Scorecard Pending Evaluation</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Candidate <strong className="text-slate-200">{candidate?.name || 'Candidate'}</strong> has completed or attempted interview questions. Click below to generate the full AI Scorecard using Groq GPT-OSS 120b.
            </p>

            <button
              onClick={handleGenerateScorecard}
              disabled={evaluating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{evaluating ? 'Evaluating Candidate Responses...' : 'Generate AI Scorecard Now'}</span>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { overallScore = 85, recommendation = 'Hire', scores = {}, strengths = [], weaknesses = [], aiSummaryExplanation = '' } = report;
  const recordingFullUrl = candidate?.recordingUrl || '';

  const radarData = Object.entries(scores).map(([key, val]) => ({
    skill: key.toUpperCase(),
    score: val,
  }));

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/dashboard/candidates" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 text-indigo-400" /> Back to Candidates Directory
          </Link>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating PDF...' : 'Download Official PDF Report (Full Q&A)'}</span>
          </button>
        </div>

        {/* Scorecard Hero Banner */}
        <div className="glass-card p-8 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center glow-border">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-1">OFFICIAL CANDIDATE SCORECARD</span>
            <h1 className="text-2xl font-extrabold text-white">{candidate?.name || report.candidateId?.name || 'Candidate'}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Position: <span className="text-indigo-300 font-semibold">{candidate?.interviewId?.title || 'Senior Engineer'}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Code: {candidate?.candidateCode} • Email: {candidate?.email}</p>
          </div>

          {/* Circular Score Metric */}
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-28 h-28 rounded-full border-4 border-indigo-500/30 flex items-center justify-center bg-slate-950 shadow-inner">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                {overallScore}
              </span>
              <span className="absolute bottom-3 text-[10px] font-mono text-slate-500">/ 100</span>
            </div>
            <span className="text-xs font-semibold text-slate-300 mt-2">Groq AI Quality Score</span>
          </div>

          {/* Recommendation Chip */}
          <div className="text-center md:text-right space-y-2">
            <span className="text-[10px] text-slate-400 block font-mono">RECOMMENDATION</span>
            <span
              className={`inline-block px-5 py-2 rounded-full text-sm font-extrabold tracking-wider border ${
                recommendation === 'Hire'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-950/50'
                  : recommendation === 'Maybe'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                  : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
              }`}
            >
              {recommendation.toUpperCase()}
            </span>
          </div>
        </div>

        {/* WEBCAM VIDEO RECORDING PLAYER SECTION */}
        {recordingFullUrl && (
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" /> Recorded Candidate Interview Session Video
            </h3>
            <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
              <video controls src={recordingFullUrl} className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {/* Radar Matrix & Strengths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Performance Chart */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Skill Competency Radar Matrix
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="skill" stroke="#94A3B8" fontSize={9} />
                  <PolarRadiusAxis domain={[0, 100]} hide />
                  <Radar name="Score" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Key Candidate Strengths
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {strengths.map((str, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Areas for Growth & Development
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {weaknesses.map((wk, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Executive AI Rationale */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-200">Executive Groq AI Rationale Summary</h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {aiSummaryExplanation || 'Comprehensive rationale generated by Groq GPT-OSS 120b AI Engine.'}
          </p>
        </div>

        {/* FULL SET OF QUESTIONS & ANSWERS TRANSCRIPT SECTION */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" /> Full Question & Answer Transcript
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Complete list of all {responses.length} interview questions asked and candidate's transcribed answers
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-xs font-mono text-indigo-300 font-bold">
              {responses.length} Questions Answered
            </span>
          </div>

          {responses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">No answer responses logged for this candidate.</div>
          ) : (
            <div className="space-y-6">
              {responses.map((resp, idx) => {
                const assigned = candidate?.assignedQuestions?.[idx] || candidate?.assignedQuestions?.find(aq => aq._id?.toString() === resp.questionId?.toString());
                const displayTitle = (resp.questionTitle && resp.questionTitle !== 'Question') ? resp.questionTitle : (assigned?.title || `Question ${idx + 1}`);
                const displayText = resp.questionText || assigned?.questionText || '';

                return (
                  <div key={resp._id || idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-xs font-bold font-mono">
                        Question {idx + 1}: {displayTitle}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> {resp.durationSeconds || 60}s
                      </span>
                    </div>

                    {displayText && (
                      <p className="text-xs font-semibold text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                        💬 <span className="text-indigo-300 font-bold">Question:</span> "{displayText}"
                      </p>
                    )}

                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 font-bold">Candidate Answer Transcript:</span>
                    <p className="text-xs text-slate-100 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                      {resp.answerText || 'Candidate responded via audio stream.'}
                    </p>
                  </div>

                  {resp.codeSubmitted && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                        <Code className="w-3.5 h-3.5" /> Submitted Code Solution:
                      </span>
                      <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                        {resp.codeSubmitted}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportDetail;
