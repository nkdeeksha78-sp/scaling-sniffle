import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Terminal, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="h-16 border-b border-guard-border bg-guard-sidebar/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
      {/* Brand & Gateway Status */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-glow-primary">
            <div className="w-full h-full bg-guard-bg rounded-[7px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-sky-400 group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white font-sans text-base">
                TrustGuard <span className="text-sky-400 font-mono">AI</span>
              </span>
            </div>
            <p className="text-[10px] text-guard-muted tracking-wider font-mono">SECURE AI PROMPT GATEWAY</p>
          </div>
        </Link>

        {/* Live Protection Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium">GATEWAY ACTIVE</span>
          <span className="text-emerald-500/40">|</span>
          <span className="text-[11px] text-slate-300">GEMINI PROMPT FIREWALL</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <Link
          to="/scan"
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-mono font-medium transition-all shadow-glow-primary"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Prompt Scanner</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-guard-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-guard-text">{user.name}</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-guard-card text-sky-400 font-mono uppercase border border-guard-border">
                  {user.role}
                </span>
                <span className="text-[10px] text-guard-muted truncate max-w-[120px]">{user.organization}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg bg-guard-card hover:bg-rose-500/20 hover:text-rose-400 text-guard-muted transition-colors border border-guard-border"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-guard-muted hover:text-white hover:bg-guard-card transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
