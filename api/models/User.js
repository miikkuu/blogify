const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, min: 4,unique: true },
  password: { type: String, required: true },
  email:{ type: String, required: false, unique: true, sparse: true }, // Optional field, unique and sparse for Google OAuth.
  googleId: { type: String, required: false, unique: true }, // Optional field, unique for Google OAuth.
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;
