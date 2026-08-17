import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutGrid,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  ShieldCheck,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Globe,
  IndianRupee,
  Activity,
  ArrowUpRight,
  X,
  Save,
  Eye,
  ArrowLeft,
} from 'lucide-react';

// ─── Admin Layout ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'plans', label: 'Plans', icon: CreditCard },
  { key: 'payments', label: 'Payments', icon: IndianRupee },
];

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`admin-stat-card group border ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${color.replace('border-', 'from-').replace('/40', '/20')} to-transparent`}>
        <Icon className="w-5 h-5 text-white opacity-80" />
      </div>
    </div>
  </div>
);

// ─── Plan Modal ───────────────────────────────────────────────────────────────
const PlanModal = ({ plan, onClose, onSave }) => {
  const [form, setForm] = useState(
    plan || {
      name: '',
      price: '',
      interviewQuota: '',
      features: [''],
      isPopular: false,
      billingCycle: 'monthly',
      sortOrder: 0,
      isActive: true,
    }
  );
  const [saving, setSaving] = useState(false);

  const handleFeatureChange = (i, val) => {
    const f = [...form.features];
    f[i] = val;
    setForm({ ...form, features: f });
  };

  const addFeature = () => setForm({ ...form, features: [...form.features, ''] });
  const removeFeature = (i) => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, features: form.features.filter(Boolean) });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg admin-card rounded-2xl border border-amber-900/40 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{plan?._id ? 'Edit Plan' : 'Create New Plan'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="admin-label">Plan Name</label>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Professional" />
            </div>
            <div>
              <label className="admin-label">Price (₹/mo)</label>
              <input className="admin-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required placeholder="1199" />
            </div>
            <div>
              <label className="admin-label">Interview Quota</label>
              <input className="admin-input" type="number" min="1" value={form.interviewQuota} onChange={(e) => setForm({ ...form, interviewQuota: Number(e.target.value) })} required placeholder="250" />
            </div>
            <div>
              <label className="admin-label">Sort Order</label>
              <input className="admin-input" type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-3 mt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs text-slate-300">Mark as Popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-amber-500" />
                <span className="text-xs text-slate-300">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="admin-label">Features</label>
            <div className="space-y-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="admin-input flex-1"
                    value={f}
                    onChange={(e) => handleFeatureChange(i, e.target.value)}
                    placeholder={`Feature ${i + 1}`}
                  />
                  <button type="button" onClick={() => removeFeature(i)} className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addFeature} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1">
                <Plus className="w-3.5 h-3.5" /> Add Feature
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40 transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {plan?._id ? 'Save Changes' : 'Create Plan'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Overview Tab ───────────────────────────────────────────────────────────────
const OverviewTab = ({ stats }) => {
  if (!stats) return <div className="text-slate-500 text-sm">Loading stats...</div>;
  const { totalCompanies, activeCompanies, totalUsers, totalInterviews, totalCandidates, mrr, planDistribution } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Total Companies" value={totalCompanies} sub={`${activeCompanies} active`} color="border-amber-500/40" />
        <StatCard icon={Users} label="Total Users" value={totalUsers} sub="across all workspaces" color="border-blue-500/40" />
        <StatCard icon={Activity} label="Interviews Run" value={totalInterviews} sub="all time" color="border-violet-500/40" />
        <StatCard icon={ShieldCheck} label="Candidates" value={totalCandidates} sub="all time" color="border-emerald-500/40" />
        <StatCard icon={IndianRupee} label="MRR (This Month)" value={`₹${(mrr || 0).toLocaleString('en-IN')}`} sub="from paid plans" color="border-orange-500/40" />
        <StatCard icon={TrendingUp} label="Conversion" value={totalCompanies ? `${Math.round((activeCompanies / totalCompanies) * 100)}%` : '—'} sub="companies active" color="border-cyan-500/40" />
      </div>

      {planDistribution && planDistribution.length > 0 && (
        <div className="admin-card p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {planDistribution.map((pd) => (
              <div key={pd._id} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-28 truncate">{pd._id || 'Free'}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    style={{ width: `${Math.max(4, (pd.count / (planDistribution.reduce((a, b) => a + b.count, 0))) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-300">{pd.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Maintenance Banner */}
      <div className="admin-card p-5 rounded-2xl border border-rose-900/40 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" /> Database Maintenance & Reset
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Wipe all candidate profiles, interview sessions, audio/video responses, and scorecards across the platform.
          </p>
        </div>
        <button
          onClick={async () => {
            if (!window.confirm('Are you sure you want to delete ALL candidates, interviews, and session data from the platform database?')) return;
            try {
              const res = await api.delete('/admin/clear-data');
              if (res.data.success) {
                alert(`Database Cleared!\n\nDeleted:\n- ${res.data.summary.candidatesDeleted} Candidates\n- ${res.data.summary.interviewsDeleted} Interviews\n- ${res.data.summary.reportsDeleted} Reports\n- ${res.data.summary.responsesDeleted} Responses`);
                window.location.reload();
              }
            } catch (e) {
              alert('Failed to clear database data.');
            }
          }}
          className="px-4 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-bold border border-rose-700/40 transition-all flex-shrink-0"
        >
          Purge Test Data
        </button>
      </div>
    </div>
  );
};

// ─── Companies Tab ───────────────────────────────────────────────────────────────
const CompaniesTab = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrideModal, setOverrideModal] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get('/admin/companies'),
          api.get('/admin/plans'),
        ]);
        setCompanies(cRes.data.companies || []);
        setPlans(pRes.data.plans || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOverridePlan = async (companyId, plan) => {
    try {
      await api.put(`/admin/company/${companyId}/plan`, { plan: plan.name, quota: plan.interviewQuota });
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === companyId ? { ...c, subscription: { ...c.subscription, plan: plan.name } } : c
        )
      );
      setOverrideModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm animate-pulse">Loading companies...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{companies.length} companies total</p>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Users</th>
              <th>Candidates</th>
              <th>Interviews</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c._id}>
                <td>
                  <div>
                    <p className="font-semibold text-white text-xs">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.slug}</p>
                  </div>
                </td>
                <td>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.subscription?.plan === 'Professional' ? 'bg-violet-900/60 text-violet-300 border border-violet-700/40' :
                    c.subscription?.plan === 'Starter' ? 'bg-blue-900/60 text-blue-300 border border-blue-700/40' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {c.subscription?.plan || 'Free'}
                  </span>
                </td>
                <td className="text-slate-300 text-xs text-center">{c.userCount || 0}</td>
                <td className="text-slate-300 text-xs text-center">{c.candidateCount || 0}</td>
                <td className="text-slate-300 text-xs text-center">{c.interviewCount || 0}</td>
                <td>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.subscription?.status === 'active' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.subscription?.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {c.subscription?.status || 'inactive'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => setOverrideModal(c)}
                    className="px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 text-[11px] font-bold border border-amber-700/30 transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Override Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm admin-card rounded-2xl border border-amber-900/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Override Plan — {overrideModal.name}</h2>
              <button onClick={() => setOverrideModal(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-400">Select a plan to manually assign to this company (no payment required).</p>
            <div className="space-y-2">
              {plans.map((plan) => (
                <button
                  key={plan._id}
                  onClick={() => handleOverridePlan(overrideModal._id, plan)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-700/50 text-left transition-all"
                >
                  <span className="text-sm font-semibold text-slate-200">{plan.name}</span>
                  <span className="text-xs text-amber-400 font-bold">₹{plan.price}/mo · {plan.interviewQuota} quota</span>
                </button>
              ))}
              <button
                onClick={() => handleOverridePlan(overrideModal._id, { name: 'Free', interviewQuota: 10 })}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-all"
              >
                <span className="text-sm font-semibold text-slate-200">Free</span>
                <span className="text-xs text-slate-400 font-bold">₹0 · 10 quota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Users Tab ───────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSuspend = async (userId) => {
    setTogglingId(userId);
    try {
      const res = await api.put(`/admin/user/${userId}/suspend`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isSuspended: res.data.isSuspended } : u))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm animate-pulse">Loading users...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="admin-table w-full">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Company</th>
            <th>Last Login</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>
                <div>
                  <p className="font-semibold text-white text-xs">{u.name}</p>
                  <p className="text-[10px] text-slate-500">{u.email}</p>
                </div>
              </td>
              <td>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {u.role}
                </span>
              </td>
              <td className="text-slate-400 text-xs">{u.companyId?.name || '—'}</td>
              <td className="text-slate-400 text-xs">
                {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
              </td>
              <td>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  u.isSuspended ? 'bg-rose-900/50 text-rose-400' : 'bg-emerald-900/50 text-emerald-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  {u.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td>
                <button
                  onClick={() => toggleSuspend(u._id)}
                  disabled={togglingId === u._id}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                    u.isSuspended
                      ? 'bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border-emerald-700/30'
                      : 'bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 border-rose-700/30'
                  }`}
                >
                  {togglingId === u._id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : u.isSuspended ? (
                    <><CheckCircle className="w-3 h-3" /> Activate</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Suspend</>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Plans Tab ───────────────────────────────────────────────────────────────
const PlansTab = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadPlans = async () => {
    try {
      const res = await api.get('/admin/plans');
      setPlans(res.data.plans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const handleSave = async (data) => {
    try {
      if (data._id) {
        await api.put(`/admin/plans/${data._id}`, data);
      } else {
        await api.post('/admin/plans', data);
      }
      await loadPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      setPlans((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm animate-pulse">Loading plans...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{plans.length} plans configured</p>
        <button
          onClick={() => { setModalPlan(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-900/30 transition-all"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan._id} className="admin-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/40">
                      Popular
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-lg font-extrabold text-amber-400 mt-0.5">₹{plan.price.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                <p className="text-[11px] text-slate-400">{plan.interviewQuota} interviews/mo</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setModalPlan(plan); setShowModal(true); }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <ul className="space-y-1">
              {(plan.features || []).map((f, i) => (
                <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">·</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showModal && (
        <PlanModal
          plan={modalPlan}
          onClose={() => { setShowModal(false); setModalPlan(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// ─── Payments Tab ───────────────────────────────────────────────────────────────
const PaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data.payments || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-slate-500 text-sm animate-pulse">Loading payments...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="admin-table w-full">
        <thead>
          <tr>
            <th>Company</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Payment ID</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center text-slate-500 text-xs py-8">No payments yet.</td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p._id}>
                <td className="text-white text-xs font-medium">{p.companyId?.name || '—'}</td>
                <td>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-900/50 text-violet-300 border border-violet-700/40">
                    {p.planName}
                  </span>
                </td>
                <td className="text-emerald-400 font-bold text-xs">₹{((p.amount || 0) / 100).toLocaleString('en-IN')}</td>
                <td className="text-slate-500 font-mono text-[10px]">{p.razorpayPaymentId}</td>
                <td className="text-slate-400 text-xs">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Admin Portal Main ───────────────────────────────────────────────────────────
const AdminPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);

  // Guard: Super Admin only (Redirects to /admin/login)
  useEffect(() => {
    if (user && user.role !== 'Super Admin') {
      navigate('/admin/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.stats);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab stats={stats} />;
      case 'companies': return <CompaniesTab />;
      case 'users': return <UsersTab />;
      case 'plans': return <PlansTab />;
      case 'payments': return <PaymentsTab />;
      default: return null;
    }
  };

  const activeNav = NAV_ITEMS.find((n) => n.key === activeTab);

  return (
    <div className="admin-root min-h-screen flex">
      {/* Sidebar */}
      <aside className="admin-sidebar w-56 flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/40">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white leading-tight">SmartyHire</p>
              <p className="text-[10px] text-amber-500 font-semibold leading-tight">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === key
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {activeTab === key && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-slate-900/60">
            <p className="text-[11px] font-semibold text-slate-200 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-amber-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="admin-topbar flex items-center justify-between px-6 py-4 border-b border-slate-800/80 flex-shrink-0">
          <div>
            <h1 className="text-base font-extrabold text-white">{activeNav?.label || 'Overview'}</h1>
            <p className="text-[11px] text-slate-500">SmartyHire Super Admin Console</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/30 text-[11px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              System Online
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default AdminPortal;
