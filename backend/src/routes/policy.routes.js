import express from 'express';
import { z } from 'zod';
import { getActivePolicy, updatePolicy, resetPolicyToDefault } from '../services/policy.service.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const policySchema = z.object({
  name: z.string().optional(),
  blockHighRisk: z.boolean().optional(),
  blockCriticalRisk: z.boolean().optional(),
  detectPromptInjection: z.boolean().optional(),
  scanEmails: z.boolean().optional(),
  scanPhones: z.boolean().optional(),
  scanCreditCards: z.boolean().optional(),
  scanApiKeys: z.boolean().optional(),
  scanPasswords: z.boolean().optional(),
  scanJwts: z.boolean().optional(),
  scanKeywords: z.boolean().optional(),
  riskThreshold: z.number().min(0).max(100).optional(),
  customKeywords: z.array(z.string()).optional(),
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const policy = await getActivePolicy(req.user ? req.user._id : null);
    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/', optionalAuth, async (req, res, next) => {
  try {
    const validated = policySchema.parse(req.body);
    const updated = await updatePolicy(validated, req.user ? req.user._id : null);

    res.status(200).json({
      success: true,
      message: 'Gateway policy updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy configuration',
        errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
});

router.post('/reset', optionalAuth, async (req, res, next) => {
  try {
    const baseline = await resetPolicyToDefault(req.user ? req.user._id : null);
    res.status(200).json({
      success: true,
      message: 'Policy restored to default enterprise security baseline',
      data: baseline,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
