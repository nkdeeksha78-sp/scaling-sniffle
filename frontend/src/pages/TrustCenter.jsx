import React from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Key,
  Server,
  Zap,
  Layers,
  FileText,
  Clock,
  Shield,
  CheckCircle,
} from 'lucide-react';

export const TrustCenter = () => {
  const sections = [
    {
      title: '1. Data Protection',
      icon: ShieldCheck,
      description:
        'All client prompt transmissions to the gateway occur over TLS 1.3 encrypted tunnels. Prompts are processed strictly in volatile memory during scanning. The gateway enforces a zero-knowledge data policy: original sensitive tokens are scrubbed in-memory, and raw prompts are never written to database logs.',
    },
    {
      title: '2. Prompt Sanitization Engine',
      icon: Layers,
      description:
        'Sensitive elements (RFC email addresses, international phone numbers, Luhn-validated credit card sequences, API keys, database credentials, JWTs, and corporate keywords) are identified using tested pattern matching and substituted with standard placeholders (e.g. [REDACTED_EMAIL], [REDACTED_API_KEY]). The replacement algorithm handles overlapping matches and verifies that no raw secret fragments remain before AI submission.',
    },
    {
      title: '3. AI Provider Integration',
      icon: Cpu,
      description:
        'Integration with Google Gemini is performed strictly on the server side using the backend GEMINI_API_KEY environment variable. Only sanitized prompts containing redacted placeholders are transmitted. Gemini is requested to evaluate semantic intent and return structured JSON. Gemini responses are validated with strict Zod schemas, and model recommendations never override local policy blocks.',
    },
    {
      title: '4. API Security & Rate Limiting',
      icon: Server,
      description:
        'The backend API is hardened with Helmet security headers (Content Security Policy, Cross-Origin Resource Policy, X-Frame-Options) and CORS restrictions. Global rate limiting (300 requests per 15 minutes per IP) protects against automated abuse, while dedicated authentication rate limiters (30 requests per 15 minutes) prevent brute-force attacks.',
    },
    {
      title: '5. Authentication & Identity',
      icon: Key,
      description:
        'User authentication utilizes stateless JSON Web Tokens (JWT) signed with HMAC SHA-256 and 7-day expiration windows. Passwords are encrypted using bcrypt with 12 salt rounds before storage. User registration strictly assigns the standard user role; administrative privileges cannot be self-assigned.',
    },
    {
      title: '6. Data Retention Policy',
      icon: Clock,
      description:
        'Audit logs retain only non-sensitive metadata: the cryptographic SHA-256 prompt hash, timestamp, user identity, calculated risk score, detection categories, and the gateway decision (ALLOWED, BLOCKED, REVIEW). Audit records can be exported to CSV by authorized users for compliance monitoring.',
    },
    {
      title: '7. Privacy Architecture (Fail-Closed)',
      icon: Lock,
      description:
        'TrustGuard AI follows the fail-closed security principle. If prompt sanitization cannot be cryptographically verified, the request is suppressed and blocked immediately. If the external Gemini AI service experiences an error or times out, the prompt is automatically routed to REVIEW status rather than receiving automatic approval.',
    },
    {
      title: '8. Security Recommendations for Teams',
      icon: Zap,
      description:
        'We advise enterprise teams to enforce minimum password lengths of 12 characters with multi-factor authentication, configure corporate custom keywords for confidential projects, set conservative risk thresholds (score <= 60), and periodically review audit logs for recurring prompt-injection attempts.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-br from-guard-card via-guard-sidebar to-sky-950/30 border border-guard-border rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>AI GATEWAY SECURITY ARCHITECTURE & PRIVACY POLICY</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight">
            TrustGuard AI Trust & Privacy Center
          </h1>
          <p className="text-sm text-guard-muted mt-2 leading-relaxed">
            Detailed technical documentation explaining how TrustGuard AI scrubs sensitive prompt data, protects API keys, prevents jailbreak prompt injections, and enforces corporate security policies.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-guard-text">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>In-Memory Sanitization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>SHA-256 Audit Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Fail-Closed AI Fallback</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Technical Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="bg-guard-card border border-guard-border rounded-xl p-5 hover:border-guard-muted/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-sans">{sec.title}</h3>
                </div>
                <p className="text-xs text-guard-muted leading-relaxed mt-2">{sec.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Engineering Architecture Diagram */}
      <div className="bg-guard-card border border-guard-border rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-mono uppercase font-semibold text-sky-400 tracking-wider">
          Gateway Lifecycle Sequence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border">
            <span className="text-[10px] text-sky-400 uppercase font-bold">Step 1</span>
            <h4 className="font-semibold text-guard-text mt-1">Client Ingestion</h4>
            <p className="text-[11px] text-guard-muted mt-1 leading-relaxed">
              Prompt received in request memory. Prompt SHA-256 digest calculated.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border">
            <span className="text-[10px] text-amber-400 uppercase font-bold">Step 2</span>
            <h4 className="font-semibold text-guard-text mt-1">Sensitive Redaction</h4>
            <p className="text-[11px] text-guard-muted mt-1 leading-relaxed">
              Luhn check, API keys, and injection heuristics evaluated. Redacted text created.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border">
            <span className="text-[10px] text-rose-400 uppercase font-bold">Step 3</span>
            <h4 className="font-semibold text-guard-text mt-1">Policy Gate</h4>
            <p className="text-[11px] text-guard-muted mt-1 leading-relaxed">
              If risk score &gt;= threshold, request is BLOCKED. Zero LLM tokens consumed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-guard-bg border border-guard-border">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Step 4</span>
            <h4 className="font-semibold text-guard-text mt-1">Gemini Forwarding</h4>
            <p className="text-[11px] text-guard-muted mt-1 leading-relaxed">
              Only sanitized prompt forwarded. Structured JSON received and validated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustCenter;
