import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  FileCheck2,
  FileSearch,
  Sliders,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      to: '/scan',
      label: 'Prompt Scanner',
      icon: Terminal,
      badge: 'Gateway',
    },
    {
      to: '/report/latest',
      label: 'Privacy Report',
      icon: FileCheck2,
    },
    {
      to: '/audit-logs',
      label: 'Audit Logs',
      icon: FileSearch,
    },
    {
      to: '/policies',
      label: 'Policy Settings',
      icon: Sliders,
    },
    {
      to: '/trust-center',
      label: 'Trust Center',
      icon: ShieldCheck,
      badge: 'Architecture',
    },
  ];

  return (
    <aside className="w-64 border-r border-guard-border bg-guard-sidebar flex flex-col justify-between shrink-0 hidden md:flex">
      {/* Navigation Links */}
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-mono font-semibold tracking-wider text-guard-muted uppercase mb-2">
            Security Controls
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-glow-primary'
                        : 'text-guard-muted hover:text-guard-text hover:bg-guard-card'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-guard-card text-guard-muted border border-guard-border">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Security Architecture Badge */}
        <div className="bg-guard-card rounded-xl p-3.5 border border-guard-border relative overflow-hidden">
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold">Zero-Data-Leak</span>
          </div>
          <p className="text-[11px] text-guard-muted leading-relaxed">
            Raw prompts never leave boundary unmasked. Only sanitized [REDACTED_...] strings reach Google Gemini.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>SHA-256 Non-Reversible Ledger</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-guard-border">
        <div className="flex items-center justify-between text-[11px] font-mono text-guard-muted">
          <span>TrustGuard AI Gateway</span>
          <span className="text-sky-400">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
