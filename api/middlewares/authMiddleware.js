const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const { AuthError } = require('../utils/errors');

const authMiddleware = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    throw new AuthError('Access denied: No token provided');
  }

  try {
    const user = await authService.getProfile(token);
    req.user = user;
    next();
  } catch (error) {
    // authService.getProfile already throws AuthError, so we can re-throw it
    throw error;
  }
});

module.exports = authMiddleware;
