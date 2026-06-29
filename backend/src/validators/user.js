const Joi = require('joi');

const searchSchema = Joi.object({
  query: Joi.string().min(1).required().messages({
    'string.empty': 'Search query cannot be empty',
    'any.required': 'Search query is required'
  })
});

module.exports = { searchSchema };
