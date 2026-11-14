import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auditApi, dashboardApi } from '../api/client';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';
import { Toast } from '../components/Toast';
import {
  FileCheck2,
  ShieldCheck,
  Lock,
  Cpu,
  Printer,
  Copy,
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  Key,
  ShieldAlert,
  Hash,
  Activity,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const PrivacyReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch aggregate privacy stats
        const statsRes = await dashboardApi.getStats();
        if (statsRes.data?.data) {
          setStats(statsRes.data.data);
        }

        // Fetch individual report if ID is specified or fetch latest
        if (!id || id === 'latest') {
          const res = await auditApi.getLogs({ limit: 1 });
          if (res.data?.data && res.data.data.length > 0) {
            setReport(res.data.data[0]);
          }
        } else {
          const res = await auditApi.getLogById(id);
          if (res.data?.data) {
            setReport(res.data.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load privacy report data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const copyCertificate = () => {
    if (!report) return;
    const cert = `--- TRUSTGUARD AI PRIVACY & VERIFICATION CERTIFICATE ---
Trace ID: ${report.traceId}
SHA-256 Prompt Hash: ${report.promptHash}
Date: ${new Date(report.createdAt).toUTCString()}
Gateway Decision: ${report.decision}
Risk Score: ${report.riskScore}/100 (${report.riskLevel})
Masked Tokens Count: ${report.detectedEntitiesCount}
Prompt Injection Detected: ${report.injectionDetected ? 'TRUE' : 'FALSE'}
Zero-Leak Guarantee: Raw sensitive content never written to persistent disk.
--- TRUSTGUARD SECURE AI GATEWAY ---`;
    navigator.clipboard.writeText(cert);
    setToastMessage('Verification certificate copied to clipboard');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const entityStats = stats?.entityStats || {
    emails: 0,
    phones: 0,
    creditCards: 0,
    apiKeys: 0,
    passwords: 0,
    jwts: 0,
    keywords: 0,
  };

  const privacyCategories = [
    { label: 'Emails', count: entityStats.emails, icon: Mail, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Phone Numbers', count: entityStats.phones, icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Credit Cards', count: entityStats.creditCards, icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'API Keys', count: entityStats.apiKeys, icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Passwords', count: entityStats.passwords, icon: Lock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'JWT Tokens', count: entityStats.jwts, icon: Hash, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Confidential Keywords', count: entityStats.keywords, icon: ShieldAlert, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}

      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-guard-border">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-mono text-guard-muted hover:text-guard-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={copyCertificate}
              className="px-3 py-1.5 rounded-lg bg-guard-card hover:bg-guard-cardHover text-xs font-mono text-guard-text flex items-center gap-1.5 border border-guard-border"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Certificate</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Aggregated Privacy Counters Matrix */}
      <div className="bg-guard-card border border-guard-border rounded-xl p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-sm font-mono font-semibold uppercase text-sky-400 tracking-wider">
            Enterprise Privacy Scrubbing Totals
          </h2>
          <p className="text-xs text-guard-muted mt-0.5">
            Aggregated non-sensitive counts of private tokens sanitized by the gateway
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {privacyCategories.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-guard-bg border border-guard-border flex flex-col justify-between"
              >
                <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-mono text-guard-text">{item.count}</h3>
                  <p className="text-[10px] text-guard-muted uppercase tracking-wider font-mono mt-0.5">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Prompt Verification Certificate */}
      {report ? (
        <div className="bg-guard-card border border-guard-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-guard-border">
            <div>
              <div className="flex items-center gap-2 text-sky-400 mb-1">
                <FileCheck2 className="w-6 h-6" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase">
                  Zero-Knowledge Privacy Audit
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans text-white">
                Transaction Verification Certificate
              </h1>
              <p className="text-xs text-guard-muted mt-0.5">
                Immutable, cryptographically verifiable transaction record
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <DecisionBadge decision={report.decision} size="lg" />
              <RiskBadge level={report.riskLevel} score={report.riskScore} />
            </div>
          </div>

          {/* Cryptographic Metadata Matrix */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 p-4 rounded-xl bg-guard-bg border border-guard-border font-mono text-xs">
            <div>
              <span className="text-[10px] text-guard-muted uppercase">Gateway Trace ID:</span>
              <p className="font-semibold text-guard-text mt-0.5">{report.traceId}</p>
            </div>

            <div>
              <span className="text-[10px] text-guard-muted uppercase">Timestamp (UTC):</span>
              <p className="text-guard-text mt-0.5">{new Date(report.createdAt).toUTCString()}</p>
            </div>

            <div>
              <span className="text-[10px] text-guard-muted uppercase">Submitter Email:</span>
              <p className="text-sky-400 mt-0.5 truncate">{report.userEmail || 'anonymous'}</p>
            </div>

            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-guard-border">
              <span className="text-[10px] text-guard-muted uppercase">SHA-256 Digest:</span>
              <p className="text-xs text-sky-300 font-mono break-all mt-0.5">{report.promptHash}</p>
            </div>
          </div>

          {/* Zero-Leakage Guarantee */}
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-300">Non-Reversible Storage Guarantee</h4>
              <p className="text-guard-text leading-relaxed text-[11px]">
                This gateway confirms that the original raw prompt containing confidential tokens was discarded from memory immediately after tokenization. Only the SHA-256 hash and masked placeholder representation were persisted to database records.
              </p>
            </div>
          </div>

          {/* Sanitized Prompt Representation */}
          <div className="mt-6 space-y-2">
            <label className="text-xs font-mono font-semibold uppercase text-guard-muted flex items-center justify-between">
              <span>Sanitized Prompt Representation:</span>
              <span className="text-[11px] text-amber-400 font-normal">
                {report.detectedEntitiesCount} Sensitive Token(s) Scrubbed
              </span>
            </label>
            <div className="p-4 rounded-xl bg-guard-bg border border-guard-border text-xs font-mono text-guard-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {report.maskedPrompt}
            </div>
          </div>

          {/* AI Assessment Summary */}
          {report.aiResponseSummary && (
            <div className="mt-6 p-4 rounded-xl bg-guard-bg border border-guard-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>Google Gemini Structured Evaluation</span>
                </span>
                <span className="text-[11px] font-mono text-sky-400">
                  Action: {report.aiResponseSummary.recommendedAction || 'ALLOW'}
                </span>
              </div>

              <p className="text-xs text-guard-text leading-relaxed">
                {report.aiResponseSummary.explanation || 'No security anomalies detected.'}
              </p>

              {report.aiResponseSummary.safeRewrittenPrompt && (
                <div className="pt-2 border-t border-guard-border">
                  <span className="text-[10px] font-mono uppercase text-guard-muted">Safe Rewritten Prompt:</span>
                  <p className="mt-1 text-xs font-mono text-sky-300">
                    {report.aiResponseSummary.safeRewrittenPrompt}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-guard-card border border-guard-border rounded-xl">
          <Activity className="w-8 h-8 text-sky-400 mx-auto mb-2 animate-pulse" />
          <p className="text-xs font-mono text-guard-muted">No individual prompt record selected.</p>
          <Link to="/scan" className="mt-3 inline-block px-4 py-2 bg-sky-500 text-slate-950 font-semibold rounded-lg text-xs font-mono">
            Scan a Prompt
          </Link>
        </div>
      )}
    </div>
  );
};

export default PrivacyReport;
