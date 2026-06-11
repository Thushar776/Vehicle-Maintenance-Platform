import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Gauge, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await api.put(`/auth/resetpassword/${token}`, { password });
      setSubmitting(false);
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-darkBg-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/20">
            <Gauge className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-100">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your new secure account password below
          </p>
        </div>

        {/* Card */}
        <div className="glass-card mt-8 shadow-2xl bg-darkBg-900 border-darkBg-850">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all"
              >
                {submitting ? 'Resetting password...' : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Password Updated</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account password has been updated successfully. You can now use your new password to sign in.
              </p>
              
              <Link
                to="/login"
                className="block text-center w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-brand-500/10"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {!success && (
            <div className="mt-6 border-t border-darkBg-800 pt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel and sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
