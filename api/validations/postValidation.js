const Joi = require('joi');

const postValidation = Joi.object({
  title: Joi.string().required(),
  summary: Joi.string().required(),
  content: Joi.string().allow('').required(),
  file: Joi.any(),
  id: Joi.string().optional(), // Allow id for update operations if sent in body
});

module.exports= { postValidation };
