import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Radio,
  FileQuestion,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Bot,
  Sparkles,
  Kanban,
  BookOpen,
} from 'lucide-react';

const Sidebar = () => {
  const { user, company } = useAuth();

  const isSuperAdmin = user?.role === 'Super Admin';

  const currentPlan = company?.plan || company?.subscription?.plan || 'Free';
  const isPro = ['Pro', 'Professional', 'Enterprise'].includes(currentPlan);

  const navItems = [
    { section: 'MAIN WORKSPACE' },
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Interviews', path: '/dashboard/interviews', icon: Briefcase },
    { name: 'Candidates', path: '/dashboard/candidates', icon: Users },
    { name: 'Pipeline Kanban', path: '/dashboard/kanban', icon: Kanban },
    { section: 'KNOWLEDGE & COMPLIANCE' },
    {
      name: 'Knowledge Base & RAG',
      path: '/dashboard/knowledge',
      icon: BookOpen,
      ...(!isPro ? { badge: 'PRO', badgeType: 'pro' } : {}),
    },
    { name: 'Audit Logs', path: '/dashboard/audit', icon: ShieldAlert },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
    ...(isSuperAdmin
      ? [
          { section: 'PLATFORM CONTROL' },
          { name: 'Admin Console', path: '/admin', icon: ShieldCheck, badge: 'SUPER ADMIN' },
        ]
      : []),
  ];

  return (
    <aside className="w-64 h-screen bg-white/95 dark:bg-[#070A0F]/90 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0 backdrop-blur-xl transition-colors">
      <div className="space-y-6">
        {/* Brand & Workspace Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-white dark:bg-[#0B0F17] rounded-[10px] flex items-center justify-center font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-300 text-xs">
              SH
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-1">
              SmartyHire <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
              {company?.name || 'Company Workspace'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="pt-4 pb-1.5 px-3">
                  <p className="text-[10px] font-extrabold font-mono text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                    {item.section}
                  </p>
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/25 dark:via-indigo-600/15 dark:to-transparent text-indigo-600 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-400 shadow-sm shadow-indigo-950/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase ${
                      item.badgeType === 'pro'
                        ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Groq AI Infrastructure Footer Pill */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-500/20 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-extrabold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 font-mono">
            <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Groq AI Engine
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">GPT-OSS 120b & Whisper v3 Active</p>
      </div>
    </aside>
  );
};

export default Sidebar;
