import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import ProfileModal from '../ui/ProfileModal';
import { Search, Bell, Sun, Moon, Sparkles, LogOut, User, Shield, Inbox } from 'lucide-react';

const Navbar = ({ onOpenCommandPalette }) => {
  const { user, company, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket } = useSocket();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[Notifications Error]', err);
    }
  };

  // Fetch real company notifications from backend API
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Subscribe to real-time notifications via Socket.io
  useEffect(() => {
    if (!socket || !company?._id) return;

    // Join the company notification room
    socket.emit('join_notifications', { companyId: company._id });

    // Handle incoming push notification
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, company?._id]);

  // Re-fetch when tab regains focus (catches missed notifications during socket sleep)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('[Mark Read Error]', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-xl bg-white/90 dark:bg-[#0D131F]/90 text-slate-800 dark:text-slate-100 shadow-sm transition-colors">
      {/* Search & Command Palette Trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-[#182234] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all w-72 cursor-pointer shadow-sm hover:border-indigo-500"
        >
          <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-slate-500 dark:text-slate-300">Search or type command...</span>
          <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 font-bold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Workspace Plan Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-extrabold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>{company?.plan || company?.subscription?.plan || 'Free'} Plan</span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-[#182234] text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Real-time Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-[#182234] text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-200" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131F] shadow-2xl p-4 animate-fade-in z-50 text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Workspace Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:underline font-semibold cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No notifications yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">New applicant alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n, i) => {
                    const dotColor = {
                      'Interview Completed': 'bg-emerald-500',
                      'AI Finished Evaluation': 'bg-purple-500',
                      'Violation Alert': 'bg-rose-500',
                      'New Candidate': 'bg-cyan-500',
                    }[n.type] || 'bg-indigo-500';
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          !n.isRead
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/30'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{n.title}</p>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-indigo-500/50 shadow-md" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-xs shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">
                {user?.name || 'Recruiter'}
              </p>
              <p className="text-[10px] font-mono leading-tight text-slate-500 dark:text-slate-400">
                {user?.role || 'Company Admin'}
              </p>
            </div>
          </button>

          {/* DROPDOWN MENU */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D131F] shadow-2xl p-2 animate-fade-in z-50 text-slate-800 dark:text-slate-100">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl transition-all cursor-pointer font-medium text-left"
                >
                  <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Profile Settings</span>
                </button>

                {user?.role === 'Super Admin' && (
                  <a
                    href="/admin"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-all cursor-pointer font-semibold text-left"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Admin Portal</span>
                  </a>
                )}

                <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 rounded-xl font-mono text-[11px]">
                  <Shield className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                  <span>Role: {user?.role}</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer font-medium text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Settings Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
};

export default Navbar;
