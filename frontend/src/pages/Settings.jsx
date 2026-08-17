import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  Settings as SettingsIcon,
  Building,
  Key,
  Sparkles,
  Check,
  RefreshCw,
  CreditCard,
  Zap,
  Shield,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Copy,
  TimerReset,
} from 'lucide-react';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PLAN_ICONS = {
  Free: Zap,
  Starter: Shield,
  Pro: Sparkles,
  Professional: Sparkles,
  Enterprise: Sparkles,
};

const PLAN_COLORS = {
  Free: 'from-slate-500 to-slate-600',
  Starter: 'from-blue-500 to-cyan-500',
  Pro: 'from-violet-500 to-purple-600',
  Professional: 'from-violet-500 to-purple-600',
  Enterprise: 'from-amber-500 to-orange-500',
};

const Settings = () => {
  const { company, setCompany, user } = useAuth();
  const [name, setName] = useState(company?.name || '');
  const [brandColor, setBrandColor] = useState(company?.brandColor || '#6366F1');
  const [apiKey, setApiKey] = useState(company?.apiKey || '');
  const [savedBranding, setSavedBranding] = useState(false);
  const [savedPolicy, setSavedPolicy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cooldownMonths, setCooldownMonths] = useState(
    company?.settings?.candidateCooldownMonths ?? 3
  );

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'failed'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, statusRes] = await Promise.all([
          api.get('/payments/plans'),
          api.get('/payments/status'),
        ]);
        setPlans(plansRes.data.plans || []);
        setSubscription(statusRes.data.subscription);
        setRecentPayments(statusRes.data.recentPayments || []);
      } catch (err) {
        console.error('[Settings fetch error]', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/company/settings', {
        name,
        brandColor,
      });
      if (res.data.success) {
        setCompany(res.data.company);
        setSavedBranding(true);
        setTimeout(() => setSavedBranding(false), 2500);
      }
    } catch (err) {
      console.error('[Branding Save Error]', err);
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/company/settings', {
        settings: { candidateCooldownMonths: Number(cooldownMonths) },
      });
      if (res.data.success) {
        setCompany(res.data.company);
        setSavedPolicy(true);
        setTimeout(() => setSavedPolicy(false), 2500);
      }
    } catch (err) {
      console.error('[Policy Save Error]', err);
    }
  };

  const handleRegenerateKey = async () => {
    try {
      const res = await api.post('/company/api-key');
      if (res.data.success) setApiKey(res.data.apiKey);
    } catch (err) {
      console.error('[Key Error]', err);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpgradePlan = async (plan) => {
    setPayingPlanId(plan._id);
    setPaymentStatus(null);

    // Free Plan (price === 0): Switch directly without Razorpay payment modal
    if (plan.price === 0) {
      try {
        const res = await api.put('/company/subscription', { plan: plan.name });
        if (res.data.success) {
          setCompany((prev) => ({ ...prev, subscription: res.data.subscription }));
          setSubscription(res.data.subscription);
          setPaymentStatus('success');
        }
      } catch (err) {
        console.error('[Free Plan Switch Error]', err);
        setPaymentStatus('failed');
      } finally {
        setPayingPlanId(null);
      }
      return;
    }

    // Paid Plan: Trigger Razorpay Checkout
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay. Please check your internet connection.');
        setPayingPlanId(null);
        return;
      }

      const orderRes = await api.post('/payments/create-order', { planId: plan._id });
      if (!orderRes.data.success) {
        alert(orderRes.data.message || 'Could not create payment order.');
        setPayingPlanId(null);
        return;
      }

      const { orderId, amount, currency, keyId, planName } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SmartyHire',
        description: `${planName} Plan — Monthly Access`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#6366F1' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId: plan._id,
            });
            if (verifyRes.data.success) {
              setCompany(verifyRes.data.company);
              setSubscription(verifyRes.data.company?.subscription);
              setPaymentStatus('success');
            } else {
              setPaymentStatus('failed');
            }
          } catch {
            setPaymentStatus('failed');
          } finally {
            setPayingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => setPayingPlanId(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('[Razorpay Error]', err);
      setPayingPlanId(null);
    }
  };

  const quotaUsed = subscription?.usedInterviewsThisMonth || 0;
  const quotaTotal = subscription?.monthlyInterviewQuota || 10;
  const quotaPct = Math.min(100, Math.round((quotaUsed / quotaTotal) * 100));
  const currentPlan = subscription?.plan || 'Free';

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Workspace Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Configure company branding, API access, and billing</p>
        </div>

        {/* Payment Status Banner */}
        {paymentStatus === 'success' && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            Plan upgraded successfully! Your new quota is now active.
          </div>
        )}
        {paymentStatus === 'failed' && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            Payment verification failed. Please contact support if your account was debited.
          </div>
        )}

        {/* 1. Company Identity & Branding */}
        <form onSubmit={handleSaveBranding} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4" /> Company Identity & Branding
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-slate-900 border border-slate-800"
                />
                <span className="text-xs font-mono text-slate-300">{brandColor}</span>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {savedBranding ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
          </button>
        </form>

        {/* 2. Interview Access Policy */}
        <form onSubmit={handleSavePolicy} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <TimerReset className="w-4 h-4" /> Interview Access Policy
          </h3>
          <p className="text-xs text-slate-400">
            Control how long a candidate must wait before they can re-apply to the <strong className="text-slate-300">same interview link</strong>. Applies to both public registrations and recruiter invites.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Candidate Re-Application Cooldown
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 3, 6, 12].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setCooldownMonths(months)}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    Number(cooldownMonths) === months
                      ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <span className="text-lg font-extrabold">{months}</span>
                  <span className="text-[10px] font-medium">{months === 1 ? 'Month' : 'Months'}</span>
                  {months === 3 && <span className="text-[9px] text-amber-500/80 font-bold">Default</span>}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Currently set to <span className="font-bold text-amber-400">{cooldownMonths} {Number(cooldownMonths) === 1 ? 'month' : 'months'}</span>.
              {' '}Candidates who try to re-register before the cooldown lifts will see a clear error with the exact unlock date.
            </p>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {savedPolicy ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Access Policy'}
          </button>
        </form>

        {/* 3. Workspace API Key */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4" /> Workspace API Key
          </h3>
          <p className="text-xs text-slate-400">Use this key to integrate SmartyHire into your existing ATS or custom workflows.</p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={apiKey || 'Generate your API key below'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800 truncate"
            />
            <button
              onClick={handleCopyKey}
              title="Copy Key"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRegenerateKey}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
          </div>
        </div>

        {/* 3. Current Quota Usage */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Current Plan & Usage
          </h3>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Active Plan</p>
              <p className="text-lg font-extrabold text-white mt-0.5">{currentPlan}</p>
              {subscription?.subscriptionExpiresAt && (
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Renews / expires: {formatDate(subscription.subscriptionExpiresAt)}
                </p>
              )}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Interviews Used</span>
                <span className="font-bold text-slate-200">{quotaUsed} / {quotaTotal}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${quotaPct > 80 ? 'bg-rose-500' : quotaPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{quotaTotal - quotaUsed} interviews remaining this month</p>
            </div>
          </div>
        </div>

        {/* 4. Subscription Plans (Razorpay) */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Upgrade Plan
          </h3>
          <p className="text-xs text-slate-400">One-time monthly payment via Razorpay. Upgrades take effect immediately.</p>

          {loadingPlans ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No plans available. Please contact support.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isActive = currentPlan === plan.name;
                const Icon = PLAN_ICONS[plan.name] || Sparkles;
                const gradient = PLAN_COLORS[plan.name] || 'from-slate-500 to-slate-600';
                const isPaying = payingPlanId === plan._id;
                return (
                  <div
                    key={plan._id}
                    className={`relative p-5 rounded-2xl border flex flex-col gap-4 transition-all ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/80 text-violet-100 border border-violet-500/40">
                        Popular
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{plan.name}</h4>
                        <p className="text-lg font-extrabold text-white">
                          ₹{plan.price.toLocaleString('en-IN')}
                          <span className="text-xs font-normal text-slate-400">/mo</span>
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {(plan.features || []).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => !isActive && handleUpgradePlan(plan)}
                      disabled={isActive || isPaying}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700/50 text-emerald-300 cursor-default border border-emerald-600/30'
                          : isPaying
                          ? 'bg-indigo-800/50 text-indigo-300 cursor-wait border border-indigo-700/40'
                          : plan.price === 0
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-900/40'
                      }`}
                    >
                      {isActive ? (
                        <><Check className="w-3.5 h-3.5" /> Current Plan</>
                      ) : isPaying ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {plan.price === 0 ? 'Updating Plan...' : 'Opening Razorpay...'}</>
                      ) : plan.price === 0 ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-400" /> Switch to Free Plan</>
                      ) : (
                        <><CreditCard className="w-3.5 h-3.5" /> Pay ₹{plan.price.toLocaleString('en-IN')} via Razorpay</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Payment History */}
        {recentPayments.length > 0 && (
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Payments
            </h3>
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{p.planName} Plan</p>
                    <p className="text-slate-500 font-mono text-[10px]">{p.razorpayPaymentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">₹{((p.amount || 0) / 100).toLocaleString('en-IN')}</p>
                    <p className="text-slate-500">{formatDate(p.paidAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
