const Joi = require("joi");

const chatValidations = {
  deleteGroupSchema: Joi.object({
    group_id: Joi.string().uuid().required().messages({
      "any.required": "The group_id is required",
      "string.uuid": "The group_id must be a valid UUID",
    }),
    user_id: Joi.string().uuid().required().messages({
      "any.required": "The user_id is required",
      "string.uuid": "The user_id must be a valid UUID",
    }),
  }),
};

module.exports = chatValidations;
