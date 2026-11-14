import React, { useState, useEffect } from 'react';
import { policyApi } from '../api/client';
import { Toast } from '../components/Toast';
import {
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  CreditCard,
  Key,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Policies = () => {
  const [policy, setPolicy] = useState({
    name: 'Enterprise Security Baseline',
    blockHighRisk: true,
    blockCriticalRisk: true,
    detectPromptInjection: true,
    scanEmails: true,
    scanPhones: true,
    scanCreditCards: true,
    scanApiKeys: true,
    scanPasswords: true,
    scanJwts: true,
    scanKeywords: true,
    riskThreshold: 60,
    customKeywords: ['confidential', 'proprietary', 'trade secret', 'internal use only', 'private key', 'master password'],
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await policyApi.getPolicy();
        if (res.data?.data) {
          setPolicy(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load policy settings:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const handleToggle = (key) => {
    setPolicy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSliderChange = (e) => {
    setPolicy((prev) => ({ ...prev, riskThreshold: parseInt(e.target.value, 10) }));
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const clean = newKeyword.trim().toLowerCase();
    if (!policy.customKeywords.includes(clean)) {
      setPolicy((prev) => ({
        ...prev,
        customKeywords: [...prev.customKeywords, clean],
      }));
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw) => {
    setPolicy((prev) => ({
      ...prev,
      customKeywords: prev.customKeywords.filter((k) => k !== kw),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await policyApi.updatePolicy(policy);
      if (res.data?.success) {
        setToastType('success');
        setToastMessage('Policy settings saved & deployed to active gateway');
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(err.response?.data?.message || 'Failed to update policy settings');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset policy configuration to factory enterprise baseline?')) return;
    setSaving(true);
    try {
      const res = await policyApi.resetPolicy();
      if (res.data?.data) {
        setPolicy(res.data.data);
        setToastType('success');
        setToastMessage('Policy restored to default enterprise baseline recommendations');
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to reset policy');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {toastMessage && <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-guard-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-sky-400" />
            <span>Policy Settings & Governance</span>
          </h1>
          <p className="text-xs text-guard-muted mt-1">
            Configure automated sanitization rules, threshold limits, and prompt-injection defense triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-lg bg-guard-card border border-guard-border hover:bg-guard-cardHover text-xs font-mono text-guard-muted transition-colors"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-semibold text-xs font-mono flex items-center gap-1.5 shadow-glow-primary transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Policies</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="space-y-4">
        {/* Policy Name Card */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl">
          <label className="block text-xs font-mono font-medium text-guard-muted uppercase mb-1.5">
            Security Policy Profile Name
          </label>
          <input
            type="text"
            value={policy.name}
            onChange={(e) => setPolicy((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full max-w-md px-3.5 py-2 bg-guard-bg border border-guard-border rounded-lg text-sm text-guard-text focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Section 1: Blocking & Defense Rules */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-mono uppercase font-semibold text-sky-400 tracking-wider">
            Critical Defense & Blocking Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Block Critical Risk */}
            <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-guard-text font-sans block">
                  Block Critical Risk
                </span>
                <p className="text-[11px] text-guard-muted mt-1">
                  Reject prompts categorized with CRITICAL risk level (80-100).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('blockCriticalRisk')}
                className={`w-10 h-5 shrink-0 rounded-full transition-colors relative p-0.5 ${
                  policy.blockCriticalRisk ? 'bg-rose-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    policy.blockCriticalRisk ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>

            {/* Block High Risk */}
            <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-guard-text font-sans block">
                  Block High Risk
                </span>
                <p className="text-[11px] text-guard-muted mt-1">
                  Reject prompts categorized with HIGH risk level (60-79).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('blockHighRisk')}
                className={`w-10 h-5 shrink-0 rounded-full transition-colors relative p-0.5 ${
                  policy.blockHighRisk ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    policy.blockHighRisk ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>

            {/* Detect Prompt Injection */}
            <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-guard-text font-sans block">
                  Detect Prompt Injection
                </span>
                <p className="text-[11px] text-guard-muted mt-1">
                  Detect instruction overrides, DAN roleplay, and prompt leaks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('detectPromptInjection')}
                className={`w-10 h-5 shrink-0 rounded-full transition-colors relative p-0.5 ${
                  policy.detectPromptInjection ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    policy.detectPromptInjection ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Entity Scanning Toggles */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-mono uppercase font-semibold text-sky-400 tracking-wider">
            Sensitive Entity Scanning Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'scanEmails', label: 'Scan Emails', icon: Mail, desc: 'Detect & mask RFC email addresses' },
              { key: 'scanPhones', label: 'Scan Phone Numbers', icon: Phone, desc: 'Detect & mask international phone formats' },
              { key: 'scanCreditCards', label: 'Scan Credit Cards', icon: CreditCard, desc: 'Luhn-verified Visa, Mastercard, Amex' },
              { key: 'scanApiKeys', label: 'Scan API Keys', icon: Key, desc: 'AWS, OpenAI, Google, GitHub, Slack tokens' },
              { key: 'scanPasswords', label: 'Scan Passwords', icon: Lock, desc: 'Password pairs and database connection strings' },
              { key: 'scanKeywords', label: 'Scan Confidential Keywords', icon: ShieldAlert, desc: 'Enforce enterprise governance tags' },
            ].map((toggle) => {
              const Icon = toggle.icon;
              return (
                <div
                  key={toggle.key}
                  className="p-3.5 rounded-xl bg-guard-bg border border-guard-border flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-xs font-semibold text-guard-text">{toggle.label}</span>
                    </div>
                    <p className="text-[10px] text-guard-muted mt-1 leading-relaxed">{toggle.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(toggle.key)}
                    className={`w-9 h-5 shrink-0 rounded-full transition-colors relative p-0.5 ${
                      policy[toggle.key] ? 'bg-sky-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                        policy[toggle.key] ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Risk Threshold Slider */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase font-semibold text-white">
                Configured Risk Score Threshold
              </h3>
              <p className="text-[11px] text-guard-muted">
                Prompts equal to or exceeding this score will be blocked automatically by the backend gateway.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-guard-bg border border-guard-border text-sm font-mono font-bold text-sky-400">
              {policy.riskThreshold} / 100
            </span>
          </div>

          <div className="pt-2">
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={policy.riskThreshold}
              onChange={handleSliderChange}
              className="w-full h-2 bg-guard-bg rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-guard-muted mt-1.5">
              <span>Strict Defense (10)</span>
              <span>Balanced Enterprise (60)</span>
              <span>Permissive (90)</span>
            </div>
          </div>
        </div>

        {/* Section 4: Custom Governance Keywords */}
        <div className="bg-guard-card border border-guard-border rounded-xl p-5 shadow-xl space-y-3">
          <div>
            <h3 className="text-xs font-mono uppercase font-semibold text-white">
              Custom Confidential Keywords
            </h3>
            <p className="text-[11px] text-guard-muted">
              Specify confidential terms that automatically add 20 risk score points and trigger [REDACTED_CONFIDENTIAL] masking.
            </p>
          </div>

          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. project-apollo, merger-terms, internal-payroll..."
              className="flex-1 px-3 py-2 bg-guard-bg border border-guard-border rounded-lg text-xs font-mono text-guard-text placeholder-guard-muted/60 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-guard-bg hover:bg-guard-cardHover text-sky-300 text-xs font-mono flex items-center gap-1 border border-guard-border transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Keyword</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {policy.customKeywords.map((kw, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-guard-bg border border-guard-border text-xs font-mono text-guard-text"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="hover:text-rose-400 text-guard-muted transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
