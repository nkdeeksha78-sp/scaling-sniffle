import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auditApi } from '../api/client';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';
import { Toast } from '../components/Toast';
import {
  FileSearch,
  Search,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
} from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    decision: 'ALL',
    riskLevel: 'ALL',
    search: '',
    from: '',
    to: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [toastMessage, setToastMessage] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({
        page,
        limit: 12,
        decision: filters.decision,
        riskLevel: filters.riskLevel,
        search: filters.search,
        from: filters.from,
        to: filters.to,
        sortBy: filters.sortBy,
        order: filters.order,
      });

      if (res.data?.data) {
        setLogs(res.data.data);
        setPagination(res.data.pagination || { total: res.data.data.length, totalPages: 1 });
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters.decision, filters.riskLevel, filters.sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`Copied ${label} to clipboard`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-guard-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white flex items-center gap-2.5">
            <FileSearch className="w-6 h-6 text-sky-400" />
            <span>Audit Ledger & Event Log</span>
          </h1>
          <p className="text-xs text-guard-muted mt-1">
            Immutable, zero-knowledge audit trail of evaluated prompt transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={auditApi.getExportUrl()}
            download
            className="px-3.5 py-1.5 rounded-lg bg-guard-card border border-guard-border hover:bg-guard-cardHover text-xs font-mono text-guard-text flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-guard-card border border-guard-border rounded-xl p-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-guard-muted absolute left-3 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search by Trace ID, SHA-256 Digest, or Email..."
              className="w-full pl-9 pr-3 py-2 bg-guard-bg border border-guard-border rounded-lg text-xs font-mono text-guard-text placeholder-guard-muted/60 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Decision Filter */}
          <div className="lg:col-span-2">
            <select
              value={filters.decision}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, decision: e.target.value }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-guard-bg border border-guard-border rounded-lg text-xs font-mono text-guard-text focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOWED">ALLOWED</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="REVIEW">REVIEW</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="lg:col-span-2">
            <select
              value={filters.riskLevel}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, riskLevel: e.target.value }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-guard-bg border border-guard-border rounded-lg text-xs font-mono text-guard-text focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Date From */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              className="w-full px-2.5 py-2 bg-guard-bg border border-guard-border rounded-lg text-xs font-mono text-guard-text focus:outline-none focus:border-sky-400"
              title="From Date"
            />
          </div>

          {/* Date To */}
          <div className="lg:col-span-1">
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              className="w-full px-2 py-2 bg-guard-bg border border-guard-border rounded-lg text-xs font-mono text-guard-text focus:outline-none focus:border-sky-400"
              title="To Date"
            />
          </div>

          {/* Filter Trigger */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all shadow-glow-primary"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-guard-card border border-guard-border rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-guard-sidebar text-guard-muted uppercase text-[10px] border-b border-guard-border">
              <tr>
                <th className="py-3 px-4">Trace ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User Email</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Categories</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-guard-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-guard-muted">
                    <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Querying Audit Records...</span>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id || log.traceId} className="hover:bg-guard-cardHover transition-colors">
                    <td className="py-3 px-4 font-semibold text-guard-text">{log.traceId}</td>
                    <td className="py-3 px-4 text-guard-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-guard-muted truncate max-w-[140px]">
                      {log.userEmail || 'anonymous'}
                    </td>
                    <td className="py-3 px-4 text-sky-400">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[90px]">{log.promptHash}</span>
                        <button
                          onClick={() => copyToClipboard(log.promptHash, 'SHA-256 Digest')}
                          title="Copy Digest"
                          className="hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={log.riskLevel} score={log.riskScore} />
                    </td>
                    <td className="py-3 px-4 text-guard-muted">
                      {log.detectedCategories?.length > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-guard-bg text-amber-400 border border-guard-border">
                          {log.detectedCategories.join(', ')}
                        </span>
                      ) : (
                        <span className="text-guard-muted opacity-60">Clean</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={log.decision} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/report/${log._id || log.traceId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-guard-bg hover:bg-guard-cardHover text-sky-300 text-[11px] font-mono border border-guard-border transition-colors"
                      >
                        <span>Audit</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-guard-muted">
                    No matching audit logs found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-guard-sidebar border-t border-guard-border flex items-center justify-between text-xs font-mono text-guard-muted">
          <span>
            Showing Page {page} of {pagination.totalPages || 1} ({pagination.total || logs.length} records)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-guard-bg border border-guard-border hover:bg-guard-cardHover disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages || 1))}
              disabled={page >= (pagination.totalPages || 1)}
              className="p-1.5 rounded bg-guard-bg border border-guard-border hover:bg-guard-cardHover disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
