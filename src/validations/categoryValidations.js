const Joi = require("joi");

const categoryValidation = {
  createSubCategory: Joi.object({
    name: Joi.string().min(3).max(255).required(),
    category_id: Joi.string().uuid().required().messages({
      "any.required": "The {{#label}} is required",
      "string.min": "The {{#label}} must be at least {{limit}} characters long",
      "string.max":
        "The {{#label}} must be less than or equal to {{limit}} characters long",
      "string.uuid": "The {{#label}} must be a valid UUID",
    }),
  }),
};

module.exports = categoryValidation;
