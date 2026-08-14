import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Briefcase, Copy, Check, Users, Clock, Plus, Search, Mail, Send, X, Sparkles, Power, Trash2, RotateCcw } from 'lucide-react';

const InterviewsList = () => {
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Invite Email Modal state
  const [inviteModalInterview, setInviteModalInterview] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteErr, setInviteErr] = useState('');

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const res = await api.get('/interviews');
        if (res.data.success) {
          setInterviews(res.data.interviews);
        }
      } catch (err) {
        console.error('[Fetch Interviews Error]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Published' ? 'Archived' : 'Published';
    setInterviews((prev) => prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item)));
    try {
      await api.put(`/interviews/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error('[Status Update Error]', err);
      setInterviews((prev) => prev.map((item) => (item._id === id ? { ...item, status: currentStatus } : item)));
    }
  };

  const handleRestoreInterview = async (id) => {
    setInterviews((prev) => prev.map((item) => (item._id === id ? { ...item, status: 'Published' } : item)));
    try {
      await api.put(`/interviews/${id}/status`, { status: 'Published' });
    } catch (err) {
      console.error('[Restore Error]', err);
    }
  };

  const handleDeleteInterview = async (id, title) => {
    if (!window.confirm(`Are you sure you want to move "${title}" to Trash (Deleted status)?`)) return;
    setInterviews((prev) => prev.map((item) => (item._id === id ? { ...item, status: 'Deleted' } : item)));
    try {
      await api.delete(`/interviews/${id}`);
    } catch (err) {
      console.error('[Delete Interview Error]', err);
    }
  };

  const copyPublicLink = (publicId) => {
    const url = `${window.location.origin}/interview/${publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendInviteEmail = async (e) => {
    e.preventDefault();
    if (!inviteModalInterview) return;
    setInviteLoading(true);
    setInviteMsg('');
    setInviteErr('');

    try {
      const res = await api.post(`/interviews/${inviteModalInterview._id}/invite`, {
        candidateName,
        candidateEmail,
      });

      if (res.data.success) {
        setInviteMsg(`Invitation email sent to ${candidateEmail} via Resend!`);
        setCandidateName('');
        setCandidateEmail('');
        setTimeout(() => {
          setInviteMsg('');
          setInviteModalInterview(null);
        }, 2000);
      }
    } catch (err) {
      setInviteErr(err.response?.data?.message || 'Failed to send invitation email.');
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.jobRole?.toLowerCase().includes(search.toLowerCase()) ||
      item.department?.toLowerCase().includes(search.toLowerCase()) ||
      (item.skillsRequired || []).some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = !deptFilter || item.department === deptFilter;

    // By default (empty filter), hide Deleted templates. If user selects 'Deleted', show Deleted templates!
    const matchesStatus = statusFilter ? item.status === statusFilter : item.status !== 'Deleted';

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title & Create Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Interview Templates <Sparkles className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage AI-driven technical and behavioral interview blueprints</p>
          </div>

          <Link
            to="/dashboard/interviews/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create AI Interview</span>
          </Link>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search interview templates by role, title, department, or required skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="AI Research">AI Research</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Sales">Sales</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses (Active & Deactivated)</option>
              <option value="Published">Active (Published)</option>
              <option value="Archived">Deactivated (Archived)</option>
              <option value="Draft">Draft</option>
              <option value="Deleted">Deleted (Trash)</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading interview templates...</div>
        ) : filteredInterviews.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-slate-500 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-slate-200">No Interview Templates Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'Deleted' ? 'No deleted interview templates in Trash.' : 'Create your first AI Interview blueprint to start inviting candidates via Resend email.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInterviews.map((item) => (
              <div key={item._id} className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                      {item.department}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        item.status === 'Published'
                          ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30'
                          : item.status === 'Archived'
                          ? 'text-rose-400 bg-rose-950/80 border-rose-500/30'
                          : item.status === 'Deleted'
                          ? 'text-red-400 bg-red-950/90 border-red-500/40 font-bold'
                          : 'text-amber-400 bg-amber-950/80 border-amber-500/30'
                      }`}
                    >
                      {item.status === 'Published' ? 'Active' : item.status === 'Archived' ? 'Deactivated' : item.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">{item.jobRole} • {item.experience}</p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {(item.skillsRequired || []).slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" /> {item.candidatesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> {item.durationMinutes}m
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'Deleted' ? (
                        <button
                          onClick={() => handleRestoreInterview(item._id)}
                          title="Restore interview template"
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleStatus(item._id, item.status)}
                            title={item.status === 'Published' ? 'Deactivate interview' : 'Activate interview'}
                            className={`p-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              item.status === 'Published'
                                ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-500/30 text-rose-300'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <Power className={`w-3.5 h-3.5 ${item.status === 'Published' ? 'text-rose-400' : 'text-emerald-400'}`} />
                            <span>{item.status === 'Published' ? 'Deactivate' : 'Activate'}</span>
                          </button>

                          <button
                            onClick={() => copyPublicLink(item.publicId)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === item.publicId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                            <span>{copiedId === item.publicId ? 'Copied' : 'Link'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteInterview(item._id, item.title)}
                            title="Move to Trash (Soft Delete)"
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setInviteModalInterview(item)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Send Candidate Invitation Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEND EMAIL INVITATION MODAL */}
        {inviteModalInterview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-md w-full bg-[#0D131F] dark:bg-[#0D131F] bg-white rounded-3xl border border-slate-700/80 shadow-2xl p-6 relative text-slate-100">
              <button
                onClick={() => setInviteModalInterview(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <Mail className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-lg font-extrabold text-white">Send Candidate Email Invite</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Position: <span className="text-indigo-300 font-semibold">{inviteModalInterview.title}</span>
                </p>
              </div>

              {inviteMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{inviteMsg}</span>
                </div>
              )}

              {inviteErr && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 text-center font-medium">
                  {inviteErr}
                </div>
              )}

              <form onSubmit={handleSendInviteEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. candidate@gmail.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {inviteLoading ? 'Sending Resend Email...' : 'Send Invitation Email via Resend'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewsList;
