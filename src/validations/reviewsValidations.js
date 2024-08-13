const Joi = require("joi");

const reviewValidations = {
  createReviewSchema: Joi.object({
    user_id: Joi.string()
      .uuid()
      .when("type", {
        is: "PROFILE",
        then: Joi.required().messages({
          "string.guid": "User ID must be a valid UUID.",
          "any.required": "User ID is required when type is PROFILE.",
        }),
        otherwise: Joi.allow(null).messages({
          "string.guid": "User ID must be a valid UUID.",
        }),
      }),
    reviewer_id: Joi.string().uuid().required().messages({
      "string.guid": "Reviewer ID must be a valid UUID.",
      "any.required": "Reviewer ID is required.",
    }),
    event_id: Joi.string()
      .uuid()
      .when("type", {
        is: "EVENT",
        then: Joi.required().messages({
          "string.guid": "Event ID must be a valid UUID.",
          "any.required": "Event ID is required when type is EVENT.",
        }),
        otherwise: Joi.allow(null).messages({
          "string.guid": "Event ID must be a valid UUID.",
        }),
      }),
    type: Joi.string().valid("EVENT", "PROFILE").required().messages({
      "any.only": "Type must be either EVENT or PROFILE.",
      "any.required": "Type is required.",
    }),
    rating: Joi.number().min(1).max(5).precision(2).required().messages({
      "number.min": "Rating must be at least 1.",
      "number.max": "Rating cannot be more than 5.",
      "any.required": "Rating is required.",
    }),
    comment: Joi.string().allow("", null).messages({
      "string.base": "Comment must be a string.",
    }),
    is_anonymous: Joi.boolean().default(false).messages({
      "boolean.base": "Anonymous flag must be a boolean.",
    }),
  }),
};

module.exports = reviewValidations;
