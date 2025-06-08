const { ExistingObjectReplicationStatus } = require('@aws-sdk/client-s3');
const Joi = require('joi'); //for validation of data

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(4).required(),
    password: Joi.string().required(),
  });
  return schema.validate(data); //either true or false
};

const loginValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(4).required(), 
    password: Joi.string().required(),
});
return schema.validate(data);
};

module.exports = {
registerValidation,
loginValidation,
};
