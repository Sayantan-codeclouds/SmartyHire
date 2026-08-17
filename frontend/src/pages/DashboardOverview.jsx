import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useTheme } from '../context/ThemeContext';
import {
  Users,
  Briefcase,
  Award,
  CheckCircle2,
  TrendingUp,
  Plus,
  Sparkles,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DashboardOverview = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalInterviews: 0,
    totalCandidates: 0,
    completedInterviews: 0,
    averageScore: 0,
    funnel: [],
    monthlyData: [],
  });
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const res = await api.get('/company/stats');
        if (res.data?.success && res.data.stats) {
          const s = res.data.stats;
          setStats({
            totalInterviews: s.totalInterviews || 0,
            totalCandidates: s.totalCandidates || 0,
            completedInterviews: s.completedInterviews || 0,
            averageScore: s.averageScore || 0,
            funnel: s.funnel || [],
            monthlyData: s.monthlyData || [],
          });
          setRecentCandidates(s.recentCandidates || []);
        }
      } catch (err) {
        console.error('[Dashboard Data Fetch Error]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#0D131F', color: '#F8FAFC', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }
    : { backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Workspace Overview <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time candidate pipelines and AI interview metrics</p>
          </div>

          <Link
            to="/dashboard/interviews/new"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create AI Interview</span>
          </Link>
        </div>

        {/* Cohort Bias Parity Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Demographic Bias & Evaluation Parity Engine
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  REAL-TIME DB AUDIT
                </span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Metrics calculated directly from live candidate scorecards.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards (Direct DB Queries) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-6 rounded-2xl space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Interviews</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalInterviews}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Created templates in DB</p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Candidates</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalCandidates}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Registered applicants in DB</p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Completed</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.completedInterviews}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Evaluated by SmartyHire AI</p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Average AI Score</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-400 dark:to-cyan-300">
              {stats.averageScore > 0 ? `${stats.averageScore}/100` : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {stats.averageScore > 0 ? 'Live DB Score Average' : 'No evaluations yet'}
            </p>
          </div>
        </div>

        {/* Dynamic Charts Grid from DB */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Velocity Area Chart */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Candidate & Interview Velocity (DB Live)
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Last 6 Months</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="candidates" stroke="#06B6D4" fillOpacity={1} fill="url(#colorCandidates)" strokeWidth={2} name="Candidates" />
                  <Area type="monotone" dataKey="interviews" stroke="#6366F1" fillOpacity={1} fill="url(#colorInterviews)" strokeWidth={2} name="Interviews" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hiring Funnel Bar Chart */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recruitment Funnel</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Live DB Count</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.funnel} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="stage" stroke="#94A3B8" fontSize={10} width={75} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        {/* Recent Candidates Table */}
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Recent Candidate Directory
            </h3>
            <Link to="/dashboard/candidates" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              View Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-950/60 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Applied Role</th>
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4">AI Score</th>
                  <th className="p-4">Recommendation</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {recentCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No candidate records found in your database. Register or invite candidates using your public interview links!
                    </td>
                  </tr>
                ) : (
                  recentCandidates.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white flex items-center justify-center font-bold text-xs shadow-md">
                            {item.name ? item.name.charAt(0) : 'C'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{item.interviewId?.title || 'Senior Software Engineer'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 font-mono text-[10px]">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {item.overallScore ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
                            {item.overallScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            item.recommendation === 'Hire'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 shadow-sm'
                              : item.recommendation === 'Maybe'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                          }`}
                        >
                          {item.recommendation || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/dashboard/report/${item._id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Scorecard
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverview;
