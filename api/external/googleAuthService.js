const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { AuthError } = require('../utils/errors');

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwtSecret = process.env.JWT_SECRET;

/**
 * Verifies a Google ID token and returns the payload.
 * @param {string} idToken - The Google ID token.
 * @returns {Promise<object>} The decoded payload from the Google ID token.
 * @throws {AuthError} If Google token verification fails.
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error('Error verifying Google ID token:', error);
    throw new AuthError('Google token verification failed');
  }
};

/**
 * Finds an existing user by Google ID or email, or creates a new user if not found.
 * Links Google ID to existing email-based accounts if applicable.
 * @param {object} googlePayload - The payload from the Google ID token.
 * @returns {Promise<object>} The found or created user document.
 */
const findOrCreateUser = async (googlePayload) => {
  const { sub, name, email, picture } = googlePayload;

  // 1. Always try to find user by Google ID first. This is the primary identifier for Google users.
  let user = await User.findOne({ googleId: sub });

  if (user) {
    // If a user with this Google ID exists, return them.
    // This ensures that the same Google account always maps to the same user in our DB.
    return user;
  }

  // 2. If no user found with this Google ID, it means this is a new Google login.
  // Create a new user for this Google account.
  // We will NOT attempt to find by email to link to existing non-Google accounts,
  // as per the user's strict requirement "don't mix them".

  // Ensure username is unique. Prioritize email if available, otherwise generate.
  let uniqueUsername = email;
  if (!uniqueUsername) {
    // Fallback if email is not provided by Google (highly unlikely for Google accounts)
    const uniqueSuffix = sub.substring(0, 8); // Use first 8 chars of sub for uniqueness
    uniqueUsername = `${name || 'google_user'}_${uniqueSuffix}`;
  }

  // Additional safeguard for username uniqueness, in case the derived username clashes
  // with an existing password-based username.
  let usernameExists = await User.findOne({ username: uniqueUsername });
  if (usernameExists) {
    // If the generated username clashes, append a part of the Google ID to ensure uniqueness
    uniqueUsername = `${uniqueUsername}_${sub.substring(0, 8)}`;
  }

  // Create the new user for this Google account
  user = new User({
    googleId: sub,
    username: uniqueUsername,
    email, // Email should always be present for Google users
    profilePicture: picture,
    password: `google_auth_placeholder_${sub}`, // Unique placeholder password for required field
  });

  await user.save();
  return user;
};

/**
 * Generates an application-specific JWT token for a given user.
 * @param {object} user - The user document.
 * @returns {string} The generated application JWT token.
 * @throws {AuthError} If JWT secret is not configured.
 */
const generateAppToken = (user) => {
  if (!jwtSecret) {
    throw new AuthError('JWT secret is not configured');
  }
  return jwt.sign({ username: user.username, id: user._id }, jwtSecret, {});
};

module.exports = {
  verifyGoogleToken,
  findOrCreateUser,
  generateAppToken,
};