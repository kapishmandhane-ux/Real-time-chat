const Joi = require('joi');

const friendRequestSchema = Joi.object({
  receiverId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid receiver ID format',
    'any.required': 'Receiver ID is required'
  })
});

const handleRequestSchema = Joi.object({
  requestId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid request ID format',
    'any.required': 'Request ID is required'
  })
});

module.exports = { friendRequestSchema, handleRequestSchema };
