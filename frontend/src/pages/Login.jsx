import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gauge, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);
    
    const result = await login(email, password);
    setSubmitting(false);

    if (result && !result.success) {
      setError(result.message || 'Invalid email or password.');
    } else {
      navigate('/dashboard');
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
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your vehicles & health predictions
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card mt-8 shadow-2xl bg-darkBg-900 border-darkBg-850">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-darkBg-950 border border-darkBg-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:transform active:scale-[0.98] transition-all"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Seeding credentials helpful banner */}
          <div className="mt-6 border-t border-darkBg-800 pt-6 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
              Create an account
            </Link>
            
            <div className="mt-4 rounded-lg bg-darkBg-850 p-3 text-left space-y-1 text-slate-400 border border-darkBg-800">
              <p className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Demo Access Credentials</p>
              <p>User Account: <code className="text-brand-300">user@fleet.com</code> / <code className="text-brand-300">password123</code></p>
              <p>Admin Account: <code className="text-brand-300">admin@fleet.com</code> / <code className="text-brand-300">password123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
