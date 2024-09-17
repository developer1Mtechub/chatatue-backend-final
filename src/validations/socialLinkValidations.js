const Joi = require("joi");

const socialLinkValidation = {
  createSocialLink: Joi.object({
    user_id: Joi.string().uuid().required().messages({
      "string.base": "User ID should be a type of 'text'",
      "string.empty": "User ID cannot be an empty field",
      "string.uuid": "User ID must be a valid UUID",
      "any.required": "User ID is a required field",
    }),
    platform_name: Joi.string().max(255).required().messages({
      "string.base": "Platform name should be a type of 'text'",
      "string.empty": "Platform name cannot be an empty field",
      "string.max": "Platform name should have a maximum length of {#limit}",
      "any.required": "Platform name is a required field",
    }),
    platform_link: Joi.string().uri().required().messages({
      "string.base": "Platform link should be a type of 'text'",
      "string.empty": "Platform link cannot be an empty field",
      "string.uri": "Platform link must be a valid URI",
      "any.required": "Platform link is a required field",
    }),
  }),
};

module.exports = socialLinkValidation;
