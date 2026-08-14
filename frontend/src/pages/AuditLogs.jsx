import React, { useEffect, useState } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  ShieldCheck,
  Clock,
  User,
  Search,
  Shield,
  CreditCard,
  Settings,
  Key,
  Briefcase,
  BookOpen,
  UserCheck,
  Zap,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL', label: 'All Events' },
  { key: 'BILLING', label: 'Plan & Billing', keywords: ['PLAN', 'SUB', 'PAYMENT'] },
  { key: 'SETTINGS', label: 'Workspace Settings', keywords: ['SETTINGS', 'BRANDING', 'CONFIG'] },
  { key: 'SECURITY', label: 'Security & Keys', keywords: ['KEY', 'AUTH', 'LOGIN', 'SUSPEND'] },
  { key: 'INTERVIEWS', label: 'Interviews & Invites', keywords: ['INTERVIEW', 'INVITATION', 'QUESTION'] },
  { key: 'KNOWLEDGE', label: 'Knowledge Vault', keywords: ['KNOWLEDGE', 'RAG', 'DOC'] },
];

const getActionBadgeStyle = (action = '') => {
  const act = action.toUpperCase();
  if (act.includes('PLAN') || act.includes('UPGRADE') || act.includes('BILLING')) {
    return {
      label: action,
      icon: CreditCard,
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 dark:bg-emerald-950/90 dark:text-emerald-300',
    };
  }
  if (act.includes('SETTINGS') || act.includes('BRANDING')) {
    return {
      label: action,
      icon: Settings,
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40 dark:bg-amber-950/90 dark:text-amber-300',
    };
  }
  if (act.includes('KEY') || act.includes('AUTH') || act.includes('SECURITY')) {
    return {
      label: action,
      icon: Key,
      badgeClass: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40 dark:bg-cyan-950/90 dark:text-cyan-300',
    };
  }
  if (act.includes('INTERVIEW') || act.includes('INVITATION')) {
    return {
      label: action,
      icon: Briefcase,
      badgeClass: 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40 dark:bg-indigo-950/90 dark:text-indigo-300',
    };
  }
  if (act.includes('KNOWLEDGE') || act.includes('DOC') || act.includes('RAG')) {
    return {
      label: action,
      icon: BookOpen,
      badgeClass: 'bg-violet-950/90 text-violet-300 border-violet-500/40 dark:bg-violet-950/90 dark:text-violet-300',
    };
  }
  return {
    label: action,
    icon: Zap,
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  };
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/notifications/audit-logs');
        if (res.data.success) {
          setLogs(res.data.logs || []);
        }
      } catch (err) {
        console.error('[Audit Log Error]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    // Hide Super Admin internal platform logs from company audit trail
    if (l.userRole === 'Super Admin' || l.userName === 'Super Admin') return false;

    // Category filter
    if (selectedCategory !== 'ALL') {
      const catObj = CATEGORIES.find((c) => c.key === selectedCategory);
      if (catObj && catObj.keywords) {
        const matchesCategory = catObj.keywords.some(
          (kw) =>
            l.action?.toUpperCase().includes(kw) ||
            l.entityType?.toUpperCase().includes(kw) ||
            l.details?.toUpperCase().includes(kw)
        );
        if (!matchesCategory) return false;
      }
    }

    // Search query filter
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.userName?.toLowerCase().includes(q) ||
      l.userRole?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.entityType?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Audit Activity Trail <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Immutable security audit logs, plan changes, workspace settings, and compliance tracking
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-xs font-mono text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 w-fit">
            <Shield className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>SOC2 Compliance Logged</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative glass-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400 absolute left-6 top-5" />
          <input
            type="text"
            placeholder="Filter audit trail by performer, plan upgrade, setting, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Audit Logs Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">Loading security audit trail...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Shield className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto opacity-60" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No matching audit logs found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search query or selecting a different event category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-950/60 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Performer</th>
                    <th className="p-4">Audit Action</th>
                    <th className="p-4">Entity Context</th>
                    <th className="p-4">Audit Details</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {filteredLogs.map((log, i) => {
                    const badge = getActionBadgeStyle(log.action);
                    const ActionIcon = badge.icon;
                    return (
                      <tr key={log._id || i} className="hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{log.userName || 'System'}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-normal">{log.userRole || 'User'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono font-bold ${badge.badgeClass}`}>
                            <ActionIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {log.entityType || 'Workspace'}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                          {log.details}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
