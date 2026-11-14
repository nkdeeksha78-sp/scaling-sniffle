import express from 'express';
import { z } from 'zod';
import { userStore } from '../services/store.service.js';
import { signJwt } from '../utils/crypto.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  organization: z.string().optional().default('Enterprise User'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Enforces: Normal user role ONLY. Never permits self-assignment of administrator role.
 */
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await userStore.findByEmail(validated.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address is already registered.',
      });
    }

    // STRICT SECURITY RULE: Always assign standard 'user' role.
    const user = await userStore.create({
      name: validated.name.trim(),
      email: validated.email.toLowerCase().trim(),
      password: validated.password,
      role: 'user', // Forced: cannot be overridden by request payload
      organization: validated.organization?.trim() || 'Enterprise User',
    });

    const userId = user._id || user.id;

    const token = signJwt({
      id: userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    logger.info(`New user registered: ${user.email} (Role: ${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await userStore.findByEmail(validated.email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await userStore.verifyPassword(validated.password, user);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const userId = user._id || user.id;

    const token = signJwt({
      id: userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    logger.info(`User logged in: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials payload',
        errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/demo-login
 * Instant preview access as administrator
 */
router.post('/demo-login', async (req, res, next) => {
  try {
    let demoAdmin = await userStore.findByEmail('admin@trustguard.ai');
    if (!demoAdmin) {
      demoAdmin = await userStore.create({
        name: 'SecOps Administrator',
        email: 'admin@trustguard.ai',
        password: 'TrustGuardDemoPassword2026!',
        role: 'admin',
        organization: 'TrustGuard Security Operations',
      });
    }

    const adminId = demoAdmin._id || demoAdmin.id;

    const token = signJwt({
      id: adminId,
      email: demoAdmin.email,
      role: demoAdmin.role,
      name: demoAdmin.name,
    });

    res.status(200).json({
      success: true,
      message: 'Demo Administrator session established',
      token,
      user: {
        id: adminId,
        name: demoAdmin.name,
        email: demoAdmin.email,
        role: demoAdmin.role,
        organization: demoAdmin.organization,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
