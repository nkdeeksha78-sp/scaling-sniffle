import express from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
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

    const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address is already registered.',
      });
    }

    // STRICT SECURITY RULE: Always assign standard 'user' role.
    const user = await User.create({
      name: validated.name.trim(),
      email: validated.email.toLowerCase().trim(),
      password: validated.password,
      role: 'user', // Forced: cannot be overridden by request payload
      organization: validated.organization.trim(),
    });

    const token = signJwt({
      id: user._id,
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
        id: user._id,
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

    const user = await User.findOne({ email: validated.email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await user.comparePassword(validated.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const token = signJwt({
      id: user._id,
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
        id: user._id,
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
    let demoAdmin = await User.findOne({ email: 'admin@trustguard.ai' });
    if (!demoAdmin) {
      demoAdmin = await User.create({
        name: 'SecOps Administrator',
        email: 'admin@trustguard.ai',
        password: 'TrustGuardDemoPassword2026!',
        role: 'admin',
        organization: 'TrustGuard Security Operations',
      });
    }

    const token = signJwt({
      id: demoAdmin._id,
      email: demoAdmin.email,
      role: demoAdmin.role,
      name: demoAdmin.name,
    });

    res.status(200).json({
      success: true,
      message: 'Demo Administrator session established',
      token,
      user: {
        id: demoAdmin._id,
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
