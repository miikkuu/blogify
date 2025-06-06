const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Check if Google Client ID is provided and valid
const hasValidGoogleClientId = process.env.GOOGLE_CLIENT_ID &&
                              process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                              process.env.GOOGLE_CLIENT_ID.length > 10;

// Initialize Google OAuth client only if valid credentials are provided
let googleOAuthClient;
if (hasValidGoogleClientId) {
  try {
    const { OAuth2Client } = require('google-auth-library');
    googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log('Google OAuth client initialized successfully');
  } catch (error) {
    console.error('Error initializing Google OAuth client:', error.message);
    googleOAuthClient = null;
  }
} else {
  console.log('Google OAuth disabled: No valid Google Client ID provided');
}

router.post('/google', async (req, res) => {
  // If Google OAuth is not configured, return an error
  if (!googleOAuthClient) {
    return res.status(501).json({
      error: 'Google OAuth is not configured or failed to initialize on this server.',
      message: 'The server administrator needs to configure Google OAuth or check server logs.'
    });
  }

  const { token: idToken } = req.body; // Client sends ID token as 'token'

  if (!idToken) {
    return res.status(400).json({ error: 'ID token not provided.' });
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload; // 'sub' is the unique Google ID

    if (!email) {
        return res.status(400).json({ error: 'Email not found in Google token payload.' });
    }

    let user = await User.findOne({ email:email });

    if (!user) {
      // Create a new user
      let baseUsername = name ? name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : '';
      if (baseUsername.length < 4) {
          baseUsername = `user_${googleId.substring(0,8)}`;
      }
      baseUsername = baseUsername.substring(0, 20); // Limit base username length

      let newUsername = baseUsername;
      let usernameExists = await User.findOne({ username: newUsername });
      let attempt = 0;
      const MAX_USERNAME_GEN_ATTEMPTS = 5;

      while (usernameExists && attempt < MAX_USERNAME_GEN_ATTEMPTS) {
        newUsername = `${baseUsername}_${crypto.randomBytes(2).toString('hex')}`;
        usernameExists = await User.findOne({ username: newUsername });
        attempt++;
      }

      if (usernameExists) {
        // Fallback if attempts fail (highly unlikely for a well-chosen base)
        newUsername = `google_${googleId}`; // googleId is unique
        usernameExists = await User.findOne({ username: newUsername });
        if (usernameExists) {
            // This case should be virtually impossible if googleId is truly unique
            return res.status(500).json({ error: 'Critical error: Could not generate a unique username even with Google ID.' });
        }
      }
      
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(randomPassword, salt);

      user = new User({
        username: newUsername,
        email: email,
        password: hashedPassword,
      });
      await user.save();
    }

    const appJwtToken = jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // Optional: add token expiration
    );

    res.cookie('token', appJwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // 'lax' is a good default
    }).json({
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    if (error.message.includes("Token used too late") || error.message.includes("Invalid token signature") || error.message.includes("Invalid Value")) {
        return res.status(401).json({ error: 'Invalid or expired Google token.' });
    }
    res.status(500).json({ error: 'Internal server error during Google authentication.' });
  }
});

module.exports = router;