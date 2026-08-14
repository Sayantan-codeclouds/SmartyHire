import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Briefcase, Users, Radio, Settings, FileText, X } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const commands = [
    { label: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Manage Interviews', path: '/dashboard/interviews', icon: Briefcase, category: 'Recruitment' },
    { label: 'Candidate Pipeline', path: '/dashboard/candidates', icon: Users, category: 'Recruitment' },
    { label: 'Knowledge Base & PDF RAG', path: '/dashboard/knowledge', icon: FileText, category: 'AI Knowledge' },
    { label: 'Company & Billing Settings', path: '/dashboard/settings', icon: Settings, category: 'Admin' },
  ];

  const filtered = commands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()));

  // Keyboard shortcut listener for Cmd+K and Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 p-4 bg-slate-950/80 backdrop-blur-md transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-xl w-full bg-[#0D131F] rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden animate-fade-in text-white font-sans"
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#080C14]">
          <Search className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search workspace... (e.g. Candidates, Live Monitoring)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 bg-[#0D131F]">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">No matching commands found.</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-indigo-600/30 text-slate-100 hover:text-white transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
                    <span className="text-sm font-semibold text-slate-100 group-hover:text-white">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#080C14] text-indigo-300 px-2 py-0.5 rounded border border-slate-700/80 font-bold">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#080C14] border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
          <span>Navigate with click</span>
          <span className="text-indigo-400 font-bold">ESC to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
