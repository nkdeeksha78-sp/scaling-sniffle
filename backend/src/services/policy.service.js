import mongoose from 'mongoose';
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

let memoryPolicy = { ...DEFAULT_POLICY, updatedAt: new Date() };

const isMongoLive = () => mongoose.connection.readyState === 1;

export const getActivePolicy = async (userId = null) => {
  if (isMongoLive()) {
    try {
      let policy = null;
      if (userId) {
        policy = await Policy.findOne({ userId });
      }
      if (!policy) {
        policy = await Policy.findOne({ isGlobal: true });
      }
      if (policy) return policy;
    } catch (error) {
      logger.warn('Failed querying policy from database, using memory baseline:', error.message);
    }
  }
  return memoryPolicy;
};

export const updatePolicy = async (policyUpdates, userId = null) => {
  if (isMongoLive()) {
    try {
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
      return await policy.save();
    } catch (err) {
      logger.warn('Failed saving policy to database, saving to memory:', err.message);
    }
  }

  memoryPolicy = {
    ...memoryPolicy,
    ...policyUpdates,
    updatedAt: new Date(),
  };
  return memoryPolicy;
};

export const resetPolicyToDefault = async (userId = null) => {
  if (isMongoLive()) {
    try {
      let policy = await Policy.findOne(userId ? { userId } : { isGlobal: true });
      if (policy) {
        Object.assign(policy, DEFAULT_POLICY);
        return await policy.save();
      }
    } catch (err) {
      logger.warn('Failed resetting policy in database, resetting memory policy:', err.message);
    }
  }

  memoryPolicy = { ...DEFAULT_POLICY, updatedAt: new Date() };
  return memoryPolicy;
};

export default { getActivePolicy, updatePolicy, resetPolicyToDefault, DEFAULT_POLICY };
