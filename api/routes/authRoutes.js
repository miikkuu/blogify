const express = require('express');
const { register, login, profile, logout } = require('../controllers/authController');
const asyncHandler = require('express-async-handler');
const authService = require('../services/authService');
const { AuthError } = require('../utils/errors');
const validate = require('../middlewares/validationMiddleware');
const { registerValidation, loginValidation } = require('../validations/authValidation');

const router = express.Router();

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/profile', profile);
router.post('/logout', logout);

// Google OAuth route
router.post('/google', asyncHandler(async (req, res) => {
  const { token: idToken } = req.body;

  if (!idToken) {
    throw new AuthError('ID token not provided.');
  }

  const { user, appJwtToken } = await authService.googleLogin(idToken);

  res.cookie('token', appJwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax'
  }).json({
    id: user._id,
    username: user.username,
    email: user.email,
  });
}));

module.exports = router;
