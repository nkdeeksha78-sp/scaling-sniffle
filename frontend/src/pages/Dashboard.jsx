import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { StatCard } from '../components/StatCard';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Eye,
  Activity,
  Terminal,
  ExternalLink,
  RefreshCw,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ dailyActivity: [], riskDistribution: [], threatCategories: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daysFilter, setDaysFilter] = useState(7);
  const [riskFilter, setRiskFilter] = useState('ALL');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, recentRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCharts({ days: daysFilter }),
        dashboardApi.getRecentActivity(),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (chartsRes.data?.data) setCharts(chartsRes.data.data);
      if (recentRes.data?.data) setRecentActivity(recentRes.data.data);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [daysFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Filter recent activity based on selected risk filter
  const filteredActivity = recentActivity.filter((item) => {
    if (riskFilter === 'ALL') return true;
    return item.riskLevel === riskFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-guard-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-sky-400" />
            <span>AI Gateway Security Dashboard</span>
          </h1>
          <p className="text-xs text-guard-muted mt-1">
            Real-time prompt sanitization, policy guardrails, and LLM telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-guard-card px-2.5 py-1.5 rounded-lg border border-guard-border text-xs font-mono text-guard-muted">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value, 10))}
              className="bg-transparent text-guard-text focus:outline-none cursor-pointer"
            >
              <option value={7} className="bg-guard-card text-guard-text">Last 7 Days</option>
              <option value={14} className="bg-guard-card text-guard-text">Last 14 Days</option>
              <option value={30} className="bg-guard-card text-guard-text">Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-guard-card border border-guard-border hover:bg-guard-cardHover text-xs font-mono text-guard-text flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/scan"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-semibold text-xs font-mono flex items-center gap-1.5 shadow-glow-primary transition-all"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open Scanner</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Prompts Scanned"
          value={stats?.totalScans ?? (loading ? '...' : 0)}
          subtitle="Processed through gateway"
          icon={Activity}
          color="sky"
        />
        <StatCard
          title="Prompts Allowed"
          value={stats?.allowedCount ?? (loading ? '...' : 0)}
          subtitle="Verified benign & safe"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Prompts Blocked"
          value={stats?.blockedCount ?? (loading ? '...' : 0)}
          subtitle="Critical breaches stopped"
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Requiring Review"
          value={stats?.reviewCount ?? (loading ? '...' : 0)}
          subtitle="PII scrubbed & flagged"
          icon={Eye}
          color="amber"
        />
      </div>

      {/* Secondary Performance & Threat Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-guard-card border border-guard-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-guard-muted uppercase">Protection Rate</span>
            <h4 className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {stats?.protectionRate ?? 100}%
            </h4>
            <p className="text-[11px] text-guard-muted mt-0.5">Threats contained or neutralized</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-guard-card border border-guard-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-guard-muted uppercase">Average Risk Score</span>
            <h4 className="text-xl font-bold font-mono text-sky-400 mt-1">
              {stats?.averageRiskScore ?? 0} / 100
            </h4>
            <p className="text-[11px] text-guard-muted mt-0.5">Normalized gateway severity</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-guard-card border border-guard-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-guard-muted uppercase">Prompt Injections Defended</span>
            <h4 className="text-xl font-bold font-mono text-amber-400 mt-1">
              {stats?.promptInjectionCount ?? 0}
            </h4>
            <p className="text-[11px] text-guard-muted mt-0.5">Adversarial jailbreaks intercepted</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts Row 1: Daily Scanning Activity & Risk Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity AreaChart (2 Cols) */}
        <div className="lg:col-span-2 bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white font-sans">
                Scanning Volume & Decision Trends
              </h3>
              <p className="text-xs text-guard-muted">Allowed, Blocked, and Review prompt volume over time</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-guard-bg text-sky-400 border border-guard-border">
              {daysFilter}-Day Trend
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111C2E',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  name="Allowed"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAllowed)"
                />
                <Area
                  type="monotone"
                  dataKey="review"
                  name="Review (Sanitized)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReview)"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBlocked)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut (1 Col) */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white font-sans">Risk Level Distribution</h3>
            <p className="text-xs text-guard-muted">Proportion of scanned prompts by threat tier</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#38BDF8'} stroke="#111C2E" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111C2E',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-guard-border text-xs font-mono">
            {charts.riskDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }}></span>
                <span className="text-guard-text truncate">{item.name.split(' ')[0]}</span>
                <span className="text-guard-muted ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Threat Categories & Recent Activity Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Categories (1 Col) */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white font-sans">Threat Category Breakdown</h3>
            <p className="text-xs text-guard-muted">Total occurrences detected across categories</p>
          </div>

          <div className="h-64 w-full">
            {charts.threatCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.threatCategories} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111C2E',
                      borderColor: '#1E2D4A',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {charts.threatCategories.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill || '#38BDF8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-guard-muted">
                No threat categories recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white font-sans">Latest Security Incidents & Activity</h3>
              <p className="text-xs text-guard-muted">Recent prompt inspections and gateway decisions</p>
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-guard-muted uppercase">Risk Filter:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-guard-bg text-guard-text text-xs font-mono px-2 py-1 rounded border border-guard-border focus:outline-none"
              >
                <option value="ALL">ALL</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-72">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((log) => (
                <div
                  key={log._id || log.traceId}
                  className="p-2.5 rounded-lg bg-guard-bg border border-guard-border hover:border-guard-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <DecisionBadge decision={log.decision} size="sm" />
                    <span className="text-sky-400 font-semibold">{log.traceId}</span>
                    <span className="text-guard-muted hidden md:inline truncate max-w-[200px]">
                      {log.maskedPrompt}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    <RiskBadge level={log.riskLevel} score={log.riskScore} />
                    <Link
                      to={`/report/${log._id || log.traceId}`}
                      className="px-2 py-0.5 rounded bg-guard-card hover:bg-guard-cardHover text-sky-400 text-[10px] border border-guard-border transition-colors"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs font-mono text-guard-muted">
                No events matching selected risk filter.
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-guard-border flex items-center justify-between text-[11px] font-mono text-guard-muted">
            <Link to="/audit-logs" className="text-sky-400 hover:underline flex items-center gap-1">
              <span>View Full Audit Ledger</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="text-emerald-400">Database Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
