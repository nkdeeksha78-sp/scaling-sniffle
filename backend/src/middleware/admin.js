/**
 * Restrict endpoint to administrators only
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required for this operation.',
    });
  }
  next();
};

export default requireAdmin;
