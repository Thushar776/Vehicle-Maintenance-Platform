import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Gauge, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState(''); // Exposed in dev

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/auth/forgotpassword', { email });
      setSubmitting(false);
      if (res.data.success) {
        setSuccess(true);
        // Save URL returned by backend for easy simulation
        setResetUrl(res.data.resetUrl || '');
      }
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Failed to send reset link. User may not exist.');
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
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email to receive a password reset link
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

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all"
              >
                {submitting ? 'Generating link...' : 'Request Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Reset Request Generated</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A password reset request has been logged in the backend. 
                In this local development environment, you can use the shortcut button below to proceed.
              </p>
              
              {resetUrl && (
                <div className="p-4 rounded-xl bg-slate-900 border border-darkBg-800 text-left space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dev Shortcut</span>
                  <a
                    href={resetUrl}
                    className="block text-center w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-brand-300 font-semibold rounded-lg text-xs transition-colors border border-brand-500/25"
                  >
                    Go to Password Reset Page
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 border-t border-darkBg-800 pt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
