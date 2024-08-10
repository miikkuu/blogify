const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validations/authValidation');

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;

const register = async (req, res, next) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json(error.details);

  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json(error.details);

  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) return res.status(400).json('User not found');

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) return res.status(400).json('Wrong credentials');

    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) return next(err);
      res.cookie('token', token).json({
        id: userDoc._id,
        username,
      });
    });
  } catch (e) {
    next(e);
  }
};

const profile = (req, res, next) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) return next(err);
    res.json(info);
  });
};

const logout = (req, res) => {
  res.cookie('token', '').json('ok');
};

module.exports = {
  register,
  login,
  profile,
  logout,
};
