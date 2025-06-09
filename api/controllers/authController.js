const asyncHandler = require('express-async-handler');
const { registerValidation, loginValidation } = require('../validations/authValidation');
const { ValidationError } = require('../utils/errors');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {

  const { username, password } = req.body;
  const userDoc = await authService.registerUser(username, password);
  res.json(userDoc);
});

const login = asyncHandler(async (req, res) => {

  const { username, password } = req.body;
  const { userDoc, token } = await authService.loginUser(username, password);

  res.cookie('token', token).json({
    id: userDoc._id,
    username,
  });
});

const profile = asyncHandler(async (req, res) => {
  const { token } = req.cookies;
  const userInfo = await authService.getProfile(token);
  res.json(userInfo);
});

const logout = (req, res) => {
  res.cookie('token', '').json('logged out successfully!');
};

module.exports = {
  register,
  login,
  profile,
  logout,
};
