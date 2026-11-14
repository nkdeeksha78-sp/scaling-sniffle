import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate HMAC / SHA-256 deterministic hash of prompt
 * Stored for audit verification without saving raw text
 */
export const hashPrompt = (promptText) => {
  if (!promptText || typeof promptText !== 'string') return '';
  return crypto.createHash('sha256').update(promptText.trim()).digest('hex');
};

/**
 * Generate random trace ID for gateway requests
 */
export const generateTraceId = () => {
  return 'tg_' + crypto.randomBytes(8).toString('hex');
};

/**
 * Sign JWT token for user authentication
 */
export const signJwt = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify JWT token
 */
export const verifyJwt = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};
