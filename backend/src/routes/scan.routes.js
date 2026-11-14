import express from 'express';
import { z } from 'zod';
import { detectSensitiveData } from '../services/detection.service.js';
import { detectPromptInjection } from '../services/injection.service.js';
import { sanitizePrompt } from '../services/masking.service.js';
import { calculateRisk } from '../services/risk.service.js';
import { analyzeWithGemini } from '../services/gemini.service.js';
import { getActivePolicy } from '../services/policy.service.js';
import { hashPrompt, generateTraceId } from '../utils/crypto.js';
import { AuditLog } from '../models/AuditLog.js';
import { optionalAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const scanInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(30000, 'Prompt exceeds 30,000 character limit'),
  model: z.string().optional().default('gemini-1.5-flash'),
});

/**
 * POST /api/scan
 * Main Secure AI Prompt Gateway Pipeline
 */
router.post('/', optionalAuth, async (req, res, next) => {
  const startTime = Date.now();
  // Strictly avoid logging req.body to prevent sensitive leaks in server stdout

  try {
    const { prompt, model } = scanInputSchema.parse(req.body);
    const user = req.user || null;
    const traceId = generateTraceId();

    // 1. In-memory SHA-256 hash
    const promptHash = hashPrompt(prompt);
    const promptLength = prompt.length;

    // 2. Fetch active policy
    const activePolicy = await getActivePolicy(user ? user._id : null);

    // 3. Detect sensitive entities
    const detectionResult = detectSensitiveData(prompt, activePolicy);

    // 4. Detect prompt injection
    const injectionResult = detectPromptInjection(prompt, activePolicy);

    // 5. Calculate risk & initial decision
    const riskAnalysis = calculateRisk({
      detectedEntities: detectionResult.entities,
      injectionResult,
      policy: activePolicy,
    });

    // 6. Data Masking Engine: Replace sensitive tokens with [REDACTED_...]
    const maskingResult = sanitizePrompt(prompt, detectionResult.entities);

    // Fail-closed enforcement
    if (!maskingResult.verified) {
      logger.warn(`Sanitization verification failed for trace ${traceId}: ${maskingResult.error}`);
      return res.status(200).json({
        success: true,
        data: {
          traceId,
          riskScore: 100,
          riskLevel: 'CRITICAL',
          detectedCategories: ['CRITICAL_FAILURE'],
          promptInjectionStatus: false,
          maskedDataCounts: detectionResult.totalCount,
          securityDecision: 'BLOCKED',
          aiAnalysisStatus: 'FAILED',
          aiExplanation: 'Sanitization verification failed. Request blocked to prevent data exposure.',
          safeRewrittenPrompt: '[BLOCKED_BY_SAFETY_GATEWAY]',
          recommendedAction: 'BLOCK',
          maskedPrompt: '[PROMPT_SUPPRESSED]',
          promptHash: promptHash.substring(0, 16) + '...',
          latencyMs: Date.now() - startTime,
        },
      });
    }

    const sanitizedPromptText = maskingResult.sanitizedText;

    // 7. AI Security Analysis with Google Gemini
    // Send ONLY sanitized prompt. Never send raw prompt.
    // If BLOCKED, skip calling Gemini.
    let aiResult = {
      riskLevel: riskAnalysis.riskLevel,
      threatType: riskAnalysis.categories,
      explanation: riskAnalysis.policyTriggered || 'Prompt processed by gateway rules.',
      safeRewrittenPrompt: sanitizedPromptText,
      recommendedAction: riskAnalysis.decision,
    };
    let aiStatus = 'SUCCESS';
    let finalDecision = riskAnalysis.decision;

    if (riskAnalysis.decision === 'BLOCKED') {
      aiStatus = 'SKIPPED_BLOCKED';
      aiResult.explanation = `Gateway blocked prompt transmission. Reason: ${riskAnalysis.policyTriggered}`;
      aiResult.recommendedAction = 'BLOCK';
    } else {
      const geminiEvaluation = await analyzeWithGemini(sanitizedPromptText, {
        injectionResult,
        entitiesCount: detectionResult.totalCount,
        localDecision: riskAnalysis.decision,
      });

      aiResult = {
        ...aiResult,
        ...geminiEvaluation.data,
      };

      aiStatus = geminiEvaluation.status;

      // Rule: "If Gemini fails, return a REVIEW decision."
      if (geminiEvaluation.decisionOverrideRequired) {
        finalDecision = 'REVIEW';
      }

      // Rule: "Local security decisions must take priority over Gemini recommendations."
      if (riskAnalysis.decision === 'BLOCKED') {
        finalDecision = 'BLOCKED';
      }
    }

    // 8. Persist Zero-Knowledge Audit Log
    try {
      await AuditLog.create({
        userId: user ? user._id : null,
        userEmail: user ? user.email : 'anonymous@trustguard.internal',
        traceId,
        promptHash,
        promptLength,
        maskedPrompt: sanitizedPromptText,
        riskScore: riskAnalysis.riskScore,
        riskLevel: riskAnalysis.riskLevel,
        detectedCategories: riskAnalysis.categories,
        detectedEntitiesCount: detectionResult.totalCount,
        entityBreakdown: detectionResult.breakdown,
        injectionDetected: injectionResult.detected,
        decision: finalDecision,
        policyTriggered: riskAnalysis.policyTriggered,
        aiAnalysisStatus: aiStatus,
        aiResponseSummary: {
          riskLevel: aiResult.riskLevel,
          threatType: Array.isArray(aiResult.threatType) ? aiResult.threatType : [aiResult.threatType].filter(Boolean),
          explanation: aiResult.explanation,
          safeRewrittenPrompt: aiResult.safeRewrittenPrompt,
          recommendedAction: aiResult.recommendedAction,
          latencyMs: Date.now() - startTime,
        },
      });
    } catch (dbErr) {
      logger.warn('Failed writing audit log to database (proceeding without crash):', dbErr.message);
    }

    const responsePayload = {
      traceId,
      timestamp: new Date().toISOString(),
      promptHash,
      promptLength,
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      detectedCategories: riskAnalysis.categories,
      promptInjectionStatus: injectionResult.detected,
      injectionConfidence: injectionResult.confidence,
      injectionPatterns: injectionResult.patterns,
      maskedDataCounts: detectionResult.totalCount,
      entityBreakdown: detectionResult.breakdown,
      securityDecision: finalDecision,
      policyTriggered: riskAnalysis.policyTriggered,
      aiAnalysisStatus: aiStatus,
      aiExplanation: aiResult.explanation,
      safeRewrittenPrompt: aiResult.safeRewrittenPrompt,
      recommendedAction: aiResult.recommendedAction,
      maskedPrompt: sanitizedPromptText,
      latencyMs: Date.now() - startTime,
    };

    return res.status(200).json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scan request payload',
        errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
});

export default router;
