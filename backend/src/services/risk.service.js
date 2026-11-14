/**
 * Risk Scoring Engine:
 * Implements configurable risk weights, threshold evaluation, and security decisions.
 * Weights:
 * Email: 10, Phone: 10, Credit card: 30, API key: 35, Password: 35, JWT: 30, Confidential keyword: 20, Prompt injection: 30
 * Maximum score: 100
 * Risk classification: 0-29: LOW, 30-59: MEDIUM, 60-79: HIGH, 80-100: CRITICAL
 * Security decisions: ALLOWED, BLOCKED, REVIEW
 */

const WEIGHTS = {
  EMAIL: 10,
  PHONE: 10,
  CREDIT_CARD: 30,
  API_KEY: 35,
  PASSWORD: 35,
  JWT: 30,
  CONFIDENTIAL_KEYWORD: 20,
  PROMPT_INJECTION: 30,
};

export const calculateRisk = ({ detectedEntities = [], injectionResult = {}, policy = {} }) => {
  let score = 0;
  const categoriesDetected = new Set();

  for (const entity of detectedEntities) {
    categoriesDetected.add(entity.category);
    const weight = WEIGHTS[entity.type] || 15;
    score += weight;
  }

  if (injectionResult.detected) {
    categoriesDetected.add('INJECTION');
    score += WEIGHTS.PROMPT_INJECTION;
  }

  score = Math.min(Math.max(score, 0), 100);

  let riskLevel = 'LOW';
  if (score >= 80) {
    riskLevel = 'CRITICAL';
  } else if (score >= 60) {
    riskLevel = 'HIGH';
  } else if (score >= 30) {
    riskLevel = 'MEDIUM';
  }

  let decision = 'ALLOWED';
  let policyTriggered = null;

  const threshold = typeof policy.riskThreshold === 'number' ? policy.riskThreshold : 60;

  if (policy.blockCriticalRisk !== false && riskLevel === 'CRITICAL') {
    decision = 'BLOCKED';
    policyTriggered = `Blocked by policy: CRITICAL risk score (${score}/100) exceeded safety boundary.`;
  } else if (policy.blockHighRisk !== false && riskLevel === 'HIGH') {
    decision = 'BLOCKED';
    policyTriggered = `Blocked by policy: HIGH risk score (${score}/100) exceeded safety boundary.`;
  } else if (score >= threshold) {
    decision = 'BLOCKED';
    policyTriggered = `Blocked by policy: Score (${score}) exceeded configured risk threshold (${threshold}).`;
  } else if (injectionResult.detected) {
    decision = 'REVIEW';
    policyTriggered = 'Routed to REVIEW: Suspicious prompt injection signature detected.';
  } else if (detectedEntities.length > 0) {
    decision = detectedEntities.length >= 3 ? 'REVIEW' : 'ALLOWED';
    policyTriggered = detectedEntities.length >= 3
      ? 'Routed to REVIEW: Multiple sensitive entities detected and scrubbed.'
      : 'Allowed with sanitization: PII/credentials masked before transmission.';
  }

  return {
    riskScore: score,
    riskLevel,
    decision,
    policyTriggered,
    categories: Array.from(categoriesDetected),
  };
};

export default { calculateRisk, WEIGHTS };
