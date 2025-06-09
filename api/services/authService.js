const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AuthError, ValidationError, NotFoundError } = require('../utils/errors');
const { verifyGoogleToken, findOrCreateUser, generateAppToken } = require('../external/googleAuthService');

const jwtSecret = process.env.JWT_SECRET;

/**
 * Registers a new user.
 * @param {string} username - The username for the new user.
 * @param {string} password - The plain text password for the new user.
 * @returns {Promise<object>} The created user document.
 */
const registerUser = async (username, password) => {
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, 10),
    });
    return userDoc;
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error for unique username
      throw new ValidationError('Username already exists.');
    }
    throw new ValidationError('Failed to register user: ' + error.message);
  }
};

/**
 * Authenticates a user and generates a JWT token.
 * @param {string} username - The username of the user.
 * @param {string} password - The plain text password of the user.
 * @returns {Promise<{userDoc: object, token: string}>} An object containing the user document and JWT token.
 * @throws {AuthError} If credentials are wrong.
 */
const loginUser = async (username, password) => {
  const userDoc = await User.findOne({ username });
  if (!userDoc) {
    throw new AuthError('Wrong credentials');
  }

  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (!passOk) {
    throw new AuthError('Wrong credentials');
  }

  const token = jwt.sign({ username, id: userDoc._id }, jwtSecret, {});
  return { userDoc, token };
};

/**
 * Verifies a JWT token and returns user information.
 * @param {string} token - The JWT token to verify.
 * @returns {Promise<object>} The decoded user information from the token.
 * @throws {AuthError} If no token is provided or the token is invalid.
 */
const getProfile = async (token) => {
  if (!token) {
    throw new AuthError('No token provided');
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, {}, (err, info) => {
      if (err) {
        return reject(new AuthError('Invalid token'));
      }
      resolve(info);
    });
  });
};

/**
 * Handles Google OAuth login, verifies the ID token, finds or creates a user, and generates an application JWT.
 * @param {string} idToken - The Google ID token from the client.
 * @returns {Promise<{user: object, appJwtToken: string}>} An object containing the user document and the application JWT token.
 * @throws {AuthError} If Google token verification fails or JWT secret is not configured.
 */
const googleLogin = async (idToken) => {
  const googlePayload = await verifyGoogleToken(idToken);
  const user = await findOrCreateUser(googlePayload);
  const appJwtToken = generateAppToken(user);
  return { user, appJwtToken };
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  googleLogin,
};