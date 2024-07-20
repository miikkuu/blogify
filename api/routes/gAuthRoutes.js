const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
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