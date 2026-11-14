import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      navigate(from, { replace: true });
    } catch (err) {
      setError('Demo session temporarily unavailable. Please register an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-guard-bg guard-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-emerald-400 p-0.5 items-center justify-center shadow-glow-primary mb-4">
            <div className="w-full h-full bg-guard-bg rounded-[10px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-sans text-white">TrustGuard AI</h1>
          <p className="text-xs font-mono text-sky-400 mt-1">SECURE AI PROMPT GATEWAY</p>
          <p className="text-xs text-guard-muted mt-2">Sign in to manage policies, view audits, and scan prompts</p>
        </div>

        {/* Card */}
        <div className="bg-guard-card border border-guard-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400"></div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-guard-text uppercase mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-guard-muted absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@trustguard.ai"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-guard-bg border border-guard-border rounded-lg text-sm text-guard-text placeholder-guard-muted/60 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-medium text-guard-text uppercase">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-guard-muted absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-guard-bg border border-guard-border rounded-lg text-sm text-guard-text placeholder-guard-muted/60 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-guard-muted hover:text-guard-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-semibold text-sm transition-all shadow-glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-5 pt-5 border-t border-guard-border">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-guard-bg hover:bg-guard-cardHover border border-guard-border text-xs font-mono text-sky-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>One-Click Demo Admin Login</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-guard-muted">
              Need gateway access?{' '}
              <Link to="/register" className="text-sky-400 hover:underline font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
