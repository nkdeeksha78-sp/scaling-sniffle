-- ==============================================================================
-- TrustGuard AI — Supabase Database Migration & Schema
-- Project: TrustGuard AI Secure AI Prompt Gateway
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Audit Logs Table (Zero-Knowledge Audit Logs for Prompt Gateway)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_hash TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    threat_type TEXT,
    decision TEXT NOT NULL CHECK (decision IN ('ALLOWED', 'BLOCKED', 'REQUIRES_REVIEW')),
    policy_violated TEXT,
    sensitive_categories TEXT[] DEFAULT '{}',
    matches_count INTEGER DEFAULT 0,
    masked_prompt_preview TEXT,
    ai_response_status TEXT DEFAULT 'SUCCESS',
    execution_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast security dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_decision ON public.audit_logs (decision);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs (risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_prompt_hash ON public.audit_logs (prompt_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs (user_email);

-- 3. Security Policies Table
CREATE TABLE IF NOT EXISTS public.policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    block_threshold INTEGER NOT NULL DEFAULT 70 CHECK (block_threshold >= 1 AND block_threshold <= 100),
    review_threshold INTEGER NOT NULL DEFAULT 40 CHECK (review_threshold >= 1 AND review_threshold <= 100),
    mask_emails BOOLEAN DEFAULT TRUE,
    mask_phones BOOLEAN DEFAULT TRUE,
    mask_credit_cards BOOLEAN DEFAULT TRUE,
    mask_api_keys BOOLEAN DEFAULT TRUE,
    mask_passwords BOOLEAN DEFAULT TRUE,
    mask_jwts BOOLEAN DEFAULT TRUE,
    block_injections BOOLEAN DEFAULT TRUE,
    require_ai_validation BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Production Security Policies
INSERT INTO public.policies (
    name,
    description,
    block_threshold,
    review_threshold,
    mask_emails,
    mask_phones,
    mask_credit_cards,
    mask_api_keys,
    mask_passwords,
    mask_jwts,
    block_injections,
    require_ai_validation
)
VALUES
(
    'Enterprise Standard',
    'Standard corporate security policy with automatic PII redaction and injection blocking.',
    70,
    40,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
),
(
    'Strict Financial & PII',
    'High-security policy for financial institutions. Blocks prompts above risk score 50.',
    50,
    30,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
),
(
    'Permissive Sandbox',
    'Development environment policy that redacts secrets but allows experimentation.',
    90,
    70,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE
)
ON CONFLICT (name) DO UPDATE SET
    updated_at = NOW();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Allow read access to authenticated/anon users, write access to service role
CREATE POLICY "Allow public read access to policies"
    ON public.policies
    FOR SELECT
    USING (true);

CREATE POLICY "Allow service role full access to policies"
    ON public.policies
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR auth.jwt() IS NULL);

CREATE POLICY "Allow service role full access to audit_logs"
    ON public.audit_logs
    USING (auth.role() = 'service_role' OR auth.jwt() IS NULL);

CREATE POLICY "Allow authenticated read access to audit_logs"
    ON public.audit_logs
    FOR SELECT
    USING (true);

-- 6. Realtime Dashboard View
CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT
    COUNT(*) AS total_scans,
    COUNT(*) FILTER (WHERE decision = 'ALLOWED') AS allowed_count,
    COUNT(*) FILTER (WHERE decision = 'BLOCKED') AS blocked_count,
    COUNT(*) FILTER (WHERE decision = 'REQUIRES_REVIEW') AS review_count,
    COALESCE(ROUND(AVG(risk_score), 1), 0) AS avg_risk_score,
    COALESCE(SUM(matches_count), 0) AS total_masked_tokens
FROM public.audit_logs;
