import { Policy } from '../models/Policy.js';
import { logger } from '../utils/logger.js';

export const DEFAULT_POLICY = {
  name: 'Enterprise Security Baseline',
  isGlobal: true,
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
  customKeywords: [
    'confidential',
    'proprietary',
    'trade secret',
    'internal use only',
    'strictly confidential',
    'restricted',
    'private key',
    'master password',
  ],
};

export const getActivePolicy = async (userId = null) => {
  try {
    let policy = null;
    if (userId) {
      policy = await Policy.findOne({ userId });
    }
    if (!policy) {
      policy = await Policy.findOne({ isGlobal: true });
    }
    if (!policy) {
      policy = await Policy.create(DEFAULT_POLICY);
    }
    return policy;
  } catch (error) {
    logger.warn('Failed querying policy from database, using memory default baseline:', error.message);
    return { ...DEFAULT_POLICY };
  }
};

export const updatePolicy = async (policyUpdates, userId = null) => {
  let policy = await Policy.findOne(userId ? { userId } : { isGlobal: true });
  if (!policy) {
    policy = new Policy({
      ...DEFAULT_POLICY,
      ...policyUpdates,
      userId,
      isGlobal: !userId,
    });
  } else {
    Object.assign(policy, policyUpdates);
  }
  return policy.save();
};

export const resetPolicyToDefault = async (userId = null) => {
  let policy = await Policy.findOne(userId ? { userId } : { isGlobal: true });
  if (policy) {
    Object.assign(policy, DEFAULT_POLICY);
    return policy.save();
  }
  return Policy.create(DEFAULT_POLICY);
};

export default { getActivePolicy, updatePolicy, resetPolicyToDefault, DEFAULT_POLICY };
