const Joi = require('joi'); //for validation of data

const registerValidation = Joi.object({
  username: Joi.string().min(4).required(),
  password: Joi.string().required(),
});

const loginValidation = Joi.object({
  username: Joi.string().min(4).required(),
  password: Joi.string().required(),
});

module.exports = {
registerValidation,
loginValidation,
};
