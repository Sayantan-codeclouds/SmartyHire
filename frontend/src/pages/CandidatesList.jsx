import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  Search, Download, Eye, Sparkles, UserPlus, Mail, Send, X, Check,
  Lock, Unlock, ChevronDown, ChevronRight, Calendar, Clock, Briefcase,
  BarChart2, User, CheckCircle2, AlertTriangle, HelpCircle,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const scoreColor = (score) => {
  if (!score) return 'text-slate-500';
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
};

const scoreBg = (score) => {
  if (!score) return 'bg-slate-900 border-slate-700';
  if (score >= 75) return 'bg-emerald-950/60 border-emerald-500/30';
  if (score >= 50) return 'bg-amber-950/60 border-amber-500/30';
  return 'bg-rose-950/60 border-rose-500/30';
};

const recConfig = {
  Hire:    { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500/40', icon: CheckCircle2 },
  Maybe:   { bg: 'bg-amber-950/80',   text: 'text-amber-400',   border: 'border-amber-500/40',   icon: HelpCircle },
  Reject:  { bg: 'bg-rose-950/80',    text: 'text-rose-400',    border: 'border-rose-500/40',    icon: AlertTriangle },
  Pending: { bg: 'bg-slate-900',      text: 'text-slate-400',   border: 'border-slate-700',      icon: Clock },
};

const stateColor = {
  'Completed':   'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
  'In Progress': 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
  'Not Started': 'bg-slate-900 text-slate-400 border-slate-700',
  'Terminated':  'bg-rose-950/80 text-rose-300 border-rose-500/30',
};

// ─── Interview Row (sub-row inside grouped candidate) ───────────────────────

const InterviewRow = ({ item, onToggleExpire }) => {
  const rec = recConfig[item.recommendation] || recConfig.Pending;
  const RecIcon = rec.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40 transition-colors group">
      {/* Interview info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-100 truncate">
            {item.interviewId?.title || 'Interview'}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="text-[10px] text-slate-500 font-mono">{item.candidateCode}</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(item.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(item.createdAt)}
            </span>
            {item.completedAt && (
              <>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-emerald-500">
                  Completed {formatDate(item.completedAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        {/* Interview state */}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stateColor[item.interviewState] || stateColor['Not Started']}`}>
          {item.interviewState}
        </span>

        {/* Link status */}
        {item.isExpired ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Expired
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
            <Unlock className="w-2.5 h-2.5" /> Active
          </span>
        )}

        {/* Score */}
        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-mono ${scoreBg(item.overallScore)} ${scoreColor(item.overallScore)}`}>
          {item.overallScore ? `${item.overallScore}/100` : 'Pending'}
        </span>

        {/* Recommendation */}
        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${rec.bg} ${rec.text} ${rec.border}`}>
          <RecIcon className="w-2.5 h-2.5" />
          {item.recommendation || 'Pending'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggleExpire(item._id)}
          title={item.isExpired ? 'Reactivate Link' : 'Expire Link'}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          {item.isExpired
            ? <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            : <Lock className="w-3.5 h-3.5 text-rose-400" />}
        </button>

        <Link
          to={`/dashboard/candidate/${item._id}`}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
        >
          <User className="w-3 h-3 text-cyan-400" />
          <span>Profile</span>
        </Link>

        <Link
          to={`/dashboard/report/${item._id}`}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-md shadow-indigo-900/30 transition-all"
        >
          <Eye className="w-3 h-3" />
          <span>Scorecard</span>
        </Link>
      </div>
    </div>
  );
};

// ─── Candidate Group Card ───────────────────────────────────────────────────

const CandidateGroup = ({ email, name, avatar, interviews, onToggleExpire }) => {
  const [expanded, setExpanded] = useState(true);

  const bestScore = Math.max(...interviews.map((i) => i.overallScore || 0));
  const latestDate = interviews.reduce((latest, i) =>
    !latest || new Date(i.createdAt) > new Date(latest) ? i.createdAt : latest, null);
  const hasHire = interviews.some((i) => i.recommendation === 'Hire');
  const hasMaybe = interviews.some((i) => i.recommendation === 'Maybe');
  const overallRec = hasHire ? 'Hire' : hasMaybe ? 'Maybe' : interviews[0]?.recommendation || 'Pending';
  const rec = recConfig[overallRec] || recConfig.Pending;

  return (
    <div className="glass-card rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Candidate header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between gap-4 p-4 hover:bg-slate-900/50 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-lg shadow-indigo-600/20">
            {name ? name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-white truncate">{name}</p>
              {/* Overall rec badge */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${rec.bg} ${rec.text} ${rec.border}`}>
                {overallRec}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Interviews count */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-base font-extrabold text-indigo-400">{interviews.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Interview{interviews.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Best score */}
          {bestScore > 0 && (
            <div className="hidden sm:flex flex-col items-center">
              <span className={`text-base font-extrabold ${scoreColor(bestScore)}`}>{bestScore}</span>
              <span className="text-[10px] text-slate-500 font-medium">Best Score</span>
            </div>
          )}

          {/* View Profile CTA */}
          {interviews[0]?._id && (
            <Link
              to={`/dashboard/candidate/${interviews[0]._id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors shadow-md"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>View Profile</span>
            </Link>
          )}

          {/* Chevron */}
          <div className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </button>

      {/* Interview rows */}
      {expanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/30">
          {interviews.map((item) => (
            <InterviewRow key={item._id} item={item} onToggleExpire={onToggleExpire} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recFilter, setRecFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (recFilter) params.recommendation = recFilter;

      const res = await api.get('/candidates', { params });
      if (res.data.success) setCandidates(res.data.candidates);
    } catch (err) {
      console.error('[Fetch Candidates Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, [search, statusFilter, recFilter]);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const res = await api.get('/interviews');
        if (res.data.success) {
          setInterviews(res.data.interviews);
          if (res.data.interviews.length > 0) setSelectedInterviewId(res.data.interviews[0]._id);
        }
      } catch (err) { console.error('[Fetch Interviews Error]', err); }
    }
    fetchInterviews();
  }, []);

  // ── Group candidates by email ──────────────────────────────────────────
  const groupedCandidates = useMemo(() => {
    const map = new Map();
    candidates.forEach((c) => {
      const key = c.email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { email: c.email, name: c.name, interviews: [] });
      }
      map.get(key).interviews.push(c);
    });
    // Sort each group's interviews by newest first
    map.forEach((group) => {
      group.interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return Array.from(map.values());
  }, [candidates]);

  const handleAddAndInvite = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/candidates/invite', { name, email, interviewId: selectedInterviewId });
      if (res.data.success) {
        setSuccessMsg(`Candidate added & invitation email sent to ${email}!`);
        setName('');
        setEmail('');
        fetchCandidates();
        setTimeout(() => { setSuccessMsg(''); setShowAddModal(false); }, 2200);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add candidate or send email invitation.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleExpire = async (candidateId) => {
    try {
      const res = await api.put(`/candidates/${candidateId}/expire`);
      if (res.data.success) fetchCandidates();
    } catch (err) { console.error('[Expire Link Error]', err); }
  };

  const handleExportCSV = () => {
    if (candidates.length === 0) return;
    const headers = ['Candidate Name', 'Email', 'Candidate Code', 'Role', 'Status', 'Score', 'Recommendation', 'Link Expired', 'Applied Date'];
    const rows = candidates.map((c) => [
      `"${c.name}"`, `"${c.email}"`, `"${c.candidateCode}"`,
      `"${c.interviewId?.title || 'Engineer'}"`, `"${c.status}"`,
      `"${c.overallScore || 0}"`, `"${c.recommendation || 'Pending'}"`,
      `"${c.isExpired ? 'Yes' : 'No'}"`, `"${formatDate(c.createdAt)}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SmartyHire_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Candidate Directory <Sparkles className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Candidates are grouped by identity — expand to see all interviews per person
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Candidate & Invite</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/dashboard/kanban"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
            >
              Kanban Board →
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && candidates.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Unique Candidates', value: groupedCandidates.length, color: 'text-indigo-400', icon: User },
              { label: 'Total Interviews', value: candidates.length, color: 'text-cyan-400', icon: Briefcase },
              { label: 'Completed', value: candidates.filter(c => c.interviewState === 'Completed').length, color: 'text-emerald-400', icon: CheckCircle2 },
              { label: 'Avg Score', value: candidates.filter(c => c.overallScore > 0).length > 0
                  ? Math.round(candidates.filter(c => c.overallScore > 0).reduce((a, c) => a + c.overallScore, 0) / candidates.filter(c => c.overallScore > 0).length)
                  : '—',
                color: 'text-amber-400', icon: BarChart2 },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="glass-card rounded-2xl p-3.5 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className={`text-lg font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or candidate code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Interviewed">Interviewed</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={recFilter}
              onChange={(e) => setRecFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Recommendations</option>
              <option value="Hire">Hire</option>
              <option value="Maybe">Maybe</option>
              <option value="Reject">Reject</option>
            </select>
          </div>
        </div>

        {/* Grouped Candidate Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl border border-slate-800 h-20 animate-pulse" />
            ))}
          </div>
        ) : groupedCandidates.length === 0 ? (
          <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center">
            <UserPlus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No candidates found.</p>
            <p className="text-slate-500 text-xs mt-1">Click <strong className="text-indigo-400">Add Candidate & Invite</strong> to invite your first candidate.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedCandidates.map((group) => (
              <CandidateGroup
                key={group.email}
                email={group.email}
                name={group.name}
                interviews={group.interviews}
                onToggleExpire={handleToggleExpire}
              />
            ))}
          </div>
        )}
      </div>

      {/* ADD CANDIDATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100 animate-fade-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 mx-auto mb-3 shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-white">Add Candidate & Send Invite</h3>
              <p className="text-xs text-slate-400 mt-1">Register candidate and dispatch a personalized interview invitation</p>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 text-center font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddAndInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. candidate@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Interview Blueprint</label>
                <select
                  value={selectedInterviewId}
                  onChange={(e) => setSelectedInterviewId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {interviews.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title} ({item.department})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {submitLoading ? 'Dispatching Invitation...' : 'Add Candidate & Send Email Invitation'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CandidatesList;
