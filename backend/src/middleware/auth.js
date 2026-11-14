import { verifyJwt } from '../utils/crypto.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Authenticate JWT middleware
 */
export const authenticate = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Missing Bearer token.',
    });
  }

  const decoded = verifyJwt(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session.',
    });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user account associated with this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication verification error:', error);
    // Dev fallback if DB connection is intermittent
    req.user = {
      _id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      name: decoded.name || 'User',
    };
    next();
  }
};

/**
 * Optional Authentication: identifies user if present, proceeds as anonymous if absent
 */
export const optionalAuth = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  const decoded = verifyJwt(token);
  if (decoded && decoded.id) {
    try {
      const user = await User.findById(decoded.id).select('-password');
      req.user = user || {
        _id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
      };
    } catch (e) {
      req.user = { _id: decoded.id, email: decoded.email, role: decoded.role || 'user' };
    }
  }

  next();
};

export default authenticate;
