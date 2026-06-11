import React, { useState } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [toast, setToast] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setToast({ message: 'Name and email are required', type: 'error' });
      return;
    }

    setProfileLoading(true);
    const res = await updateProfile(name, email);
    setProfileLoading(false);

    if (res.success) {
      setToast({ message: 'Profile details updated successfully!', type: 'success' });
    } else {
      setToast({ message: res.message || 'Profile update failed', type: 'error' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Confirm password does not match.');
      return;
    }

    setPwdError('');
    setPwdLoading(true);

    try {
      const res = await api.put('/auth/changepassword', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setToast({ message: 'Password updated successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Password update failed. Check current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-darkBg-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} title="My Profile" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-slate-100">Account Configurations</h2>
              <p className="text-xs text-slate-400">Edit your profile credentials and password settings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Details Edit Form */}
              <div className="glass-card">
                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-brand-400" />
                  Personal Information
                </h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Role</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-darkBg-950 border border-darkBg-850 rounded-xl text-slate-400 text-xs font-semibold uppercase">
                      <ShieldCheck className="h-4 w-4 text-brand-500" />
                      {user?.role} status active
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full mt-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-brand-500/10"
                  >
                    {profileLoading ? 'Saving Info...' : 'Update Info'}
                  </button>
                </form>
              </div>

              {/* Password Change Form */}
              <div className="glass-card">
                <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand-400" />
                  Security Details
                </h3>

                {pwdError && (
                  <div className="flex items-center gap-2.5 mb-4 p-3 border border-rose-500/20 bg-rose-500/10 text-rose-400 rounded-xl text-xs">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full mt-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-brand-500/10"
                  >
                    {pwdLoading ? 'Updating Security...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Profile;
