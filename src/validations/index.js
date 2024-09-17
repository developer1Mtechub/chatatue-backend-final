const Joi = require("joi");

const global = {
  id: Joi.string().uuid().messages({
    "string.uuid": "Invalid ID format",
  }),
  user_id: Joi.string().uuid().messages({
    "string.uuid": "Invalid ID format",
  }),
};

module.exports = global;
