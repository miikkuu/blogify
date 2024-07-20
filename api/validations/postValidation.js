const Joi = require('joi');

const postValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    summary: Joi.string().required(),
    content: Joi.string().required(),
    file: Joi.any(),
  });
  return schema.validate(data);
};

module.exports= { postValidation };
