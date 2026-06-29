const Joi = require('joi');

const signupSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only alphanumeric characters.',
    'string.min': 'Username must be at least 3 characters long.',
    'string.max': 'Username cannot exceed 30 characters.'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long.'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  signupSchema,
  loginSchema
};
