import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const supabaseService = {
  /**
   * Sync an audit event to Supabase audit_logs table
   */
  async syncAuditLog(auditData) {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const record = {
        prompt_hash: auditData.promptHash,
        user_id: auditData.userId ? String(auditData.userId) : null,
        user_email: auditData.userEmail || null,
        risk_score: auditData.riskScore,
        risk_level: auditData.riskLevel,
        threat_type: auditData.threatType,
        decision: auditData.decision,
        policy_violated: auditData.policyViolated || null,
        sensitive_categories: auditData.detectedCategories || [],
        matches_count: auditData.matchesCount || 0,
        masked_prompt_preview: auditData.maskedPromptPreview || '',
        ai_response_status: auditData.aiResponseStatus || 'skipped',
        execution_time_ms: auditData.executionTimeMs || 0,
        created_at: auditData.timestamp ? new Date(auditData.timestamp).toISOString() : new Date().toISOString(),
      };

      const { data, error } = await supabase.from('audit_logs').insert([record]).select();
      if (error) {
        logger.warn(`[Supabase] audit_logs insert warning: ${error.message}`);
        return null;
      }
      return data;
    } catch (err) {
      logger.warn(`[Supabase] audit_logs sync error: ${err.message}`);
      return null;
    }
  },

  /**
   * Fetch audit logs from Supabase
   */
  async getAuditLogs({ limit = 50, page = 1, decision, riskLevel }) {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      let query = supabase.from('audit_logs').select('*', { count: 'exact' });

      if (decision && decision !== 'ALL') {
        query = query.eq('decision', decision);
      }
      if (riskLevel && riskLevel !== 'ALL') {
        query = query.eq('risk_level', riskLevel);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { logs: data, total: count, page, limit };
    } catch (err) {
      logger.warn(`[Supabase] getAuditLogs error: ${err.message}`);
      return null;
    }
  },

  /**
   * Sync or fetch security policies from Supabase
   */
  async getPolicies() {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('policies').select('*').order('name');
      if (error) throw error;
      return data;
    } catch (err) {
      logger.warn(`[Supabase] getPolicies error: ${err.message}`);
      return null;
    }
  },

  /**
   * Upsert security policies to Supabase
   */
  async upsertPolicy(policyData) {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('policies')
        .upsert([
          {
            name: policyData.name,
            description: policyData.description,
            block_threshold: policyData.blockThreshold,
            review_threshold: policyData.reviewThreshold,
            mask_emails: policyData.maskEmails,
            mask_phones: policyData.maskPhones,
            mask_credit_cards: policyData.maskCreditCards,
            mask_api_keys: policyData.maskApiKeys,
            mask_passwords: policyData.maskPasswords,
            mask_jwts: policyData.maskJwts,
            block_injections: policyData.blockInjections,
            require_ai_validation: policyData.requireAiValidation,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'name' })
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.warn(`[Supabase] upsertPolicy error: ${err.message}`);
      return null;
    }
  },
};
