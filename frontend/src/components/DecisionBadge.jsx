import React from 'react';
import { ShieldCheck, ShieldAlert, Eye, AlertCircle } from 'lucide-react';

export const DecisionBadge = ({ decision, size = 'md' }) => {
  const norm = (decision || 'ALLOWED').toUpperCase();

  const configs = {
    ALLOWED: {
      label: 'ALLOWED',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
    },
    BLOCKED: {
      label: 'BLOCKED',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-glow-danger',
      icon: ShieldAlert,
    },
    REVIEW: {
      label: 'REVIEW',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-glow-warning',
      icon: Eye,
    },
  };

  const current = configs[norm] || configs.ALLOWED;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-wider transition-all ${current.bg} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};

export default DecisionBadge;
