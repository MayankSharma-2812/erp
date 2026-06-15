const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).required(),
});

module.exports = {
  loginSchema,
};
