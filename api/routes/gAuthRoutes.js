const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Check if Google Client ID is provided and valid
const hasValidGoogleClientId = process.env.GOOGLE_CLIENT_ID &&
                              process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' &&
                              process.env.GOOGLE_CLIENT_ID.length > 10;

// Initialize Google OAuth client only if valid credentials are provided
let client;
if (hasValidGoogleClientId) {
  try {
    const { OAuth2Client } = require('google-auth-library');
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log('Google OAuth client initialized successfully');
  } catch (error) {
    console.log('Google OAuth library not available or client ID not valid');
  }
} else {
  console.log('Google OAuth disabled: No valid Google Client ID provided');
}

router.post('/google', async (req, res) => {
  // If Google OAuth is not configured, return an error
  if (!hasValidGoogleClientId || !client) {
    return res.status(501).json({
      error: 'Google OAuth is not configured on this server',
      message: 'The server administrator has not configured Google OAuth'
    });
  }

  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email:email });

    if (!user) {
      user = new User({
        username: `${name} ${email}`,
        email: email,
        password: Math.random().toString(36).slice(-8),
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const usernameonly = user.username.split(' ').slice(0, -1).join(' ');
    res.cookie('token', jwtToken, { httpOnly: true }).json({
      id: user._id,
      username: usernameonly,
      email: user.email,
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
});

module.exports = router;