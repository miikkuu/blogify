const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json('Access denied');

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json('Invalid token');
    req.user = user;
    next();
  });
};

module.exports = authMiddleware;
