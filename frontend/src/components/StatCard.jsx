import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'sky', change }) => {
  const colorMap = {
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      hover: 'hover:border-sky-500/40 hover:shadow-glow-primary',
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      hover: 'hover:border-emerald-500/40 hover:shadow-glow-success',
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      hover: 'hover:border-rose-500/40 hover:shadow-glow-danger',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      hover: 'hover:border-amber-500/40 hover:shadow-glow-warning',
    },
  };

  const scheme = colorMap[color] || colorMap.sky;

  return (
    <div
      className={`bg-guard-card rounded-xl p-5 border ${scheme.border} ${scheme.hover} transition-all duration-300 relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-mono font-medium text-guard-muted uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl lg:text-3xl font-bold font-mono text-guard-text">{value}</h3>
            {change && (
              <span className={`text-xs font-mono ${change.startsWith('+') ? 'text-emerald-400' : 'text-guard-muted'}`}>
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-guard-muted mt-1">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg ${scheme.bg} ${scheme.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
    </div>
  );
};

export default StatCard;
