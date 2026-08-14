import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Camera, User, Mail, Lock, Check } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (password) formData.append('password', password);
      if (avatarFile) formData.append('avatar', avatarFile);

      await updateUserProfile(formData);
      setSuccessMsg('Profile picture & settings saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile picture.');
    } finally {
      setLoading(false);
    }
  };

  // Teleport Modal directly to document.body via React Portal
  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/85 backdrop-blur-md font-sans"
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-md w-full bg-[#0D131F] rounded-3xl border border-slate-700/80 shadow-2xl p-6 text-slate-100 animate-fade-in my-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold text-white">Profile Settings</h3>
            <p className="text-xs text-slate-400 mt-1">Manage your account credentials and avatar picture</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Picture Upload Area */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full border-2 border-indigo-500/50 p-1 bg-slate-900 group shadow-xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white text-2xl shadow-inner">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <label className="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5 mb-0.5 text-cyan-400" />
                  <span>Change Photo</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <p className="text-[11px] text-indigo-400 mt-2 font-mono font-semibold">Hover avatar to upload photo</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email (Readonly)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 text-xs font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password (Optional)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer mt-4"
            >
              {loading ? 'Saving Photo & Profile...' : 'Save Profile & Photo'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
