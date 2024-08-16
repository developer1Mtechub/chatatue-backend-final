const Joi = require("joi");

const userValidation = {
  createUser: Joi.object({
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid email address",
    }),

    password: Joi.string().when("signup_type", {
      is: Joi.string().valid("EMAIL"),
      then: Joi.string().required().messages({
        "any.required": "Password is required",
        "string.empty": "Password cannot be empty",
      }),
      otherwise: Joi.string().allow("").optional(),
    }),
    signup_type: Joi.string().valid("EMAIL", "GOOGLE", "APPLE").required(),
    device_id: Joi.string().required().messages({
      "any.required": "Device Id is required",
      "string.empty": "Device Id cannot be empty ",
    }),
    google_access_token: Joi.string().when("signup_type", {
      is: Joi.string().valid("GOOGLE"),
      then: Joi.string().required().messages({
        "any.required": "Google Access Token is required",
        "string.empty": "Google Access Token cannot be empty",
      }),
      otherwise: Joi.string().allow("").optional(),
    }),
    apple_access_token: Joi.string().when("signup_type", {
      is: Joi.string().valid("APPLE"),
      then: Joi.string().required().messages({
        "any.required": "Apple Access Token is required",
        "string.empty": "Apple Access Token cannot be empty",
      }),
      otherwise: Joi.string().allow("").optional(),
    }),
  }),

  loginUser: Joi.object({
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid email address",
    }),
    password: Joi.string()
      .required()
      .when("signup_type", {
        is: Joi.string().valid("EMAIL"),
        then: Joi.string().required().messages({
          "any.required": "Password is required",
          "string.empty": "Password cannot be empty",
        }),
        otherwise: Joi.string().allow("").optional(),
      }),
    signup_type: Joi.string()
      .valid("EMAIL", "GOOGLE", "APPLE")
      .required()
      .messages({
        "any.required": "Signup Type is required",
        "string.empty": "Signup Type cannot be empty",
        "string.valid": "Invalid signup type",
      }),
    google_access_token: Joi.string().when("signup_type", {
      is: Joi.string().valid("GOOGLE"),
      then: Joi.string().required().messages({
        "any.required": "Google Access Token is required",
        "string.empty": "Google Access Token cannot be empty",
      }),
      otherwise: Joi.string().allow("").optional(),
    }),
    apple_access_token: Joi.string().when("signup_type", {
      is: Joi.string().valid("APPLE"),
      then: Joi.string().required().messages({
        "any.required": "Apple Access Token is required",
        "string.empty": "Apple Access Token cannot be empty",
      }),
      otherwise: Joi.string().allow("").optional(),
    }),
    device_id: Joi.string().required().messages({
      "any.required": "Device Id is required",
      "string.empty": "Device Id cannot be empty ",
    }),
  }),

  updatePassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is Required",
      "string.pattern.base": "Invalid email format",
    }),
    oldPassword: Joi.string().min(5).required().messages({
      "string.base": "Old password must be a string",
      "string.empty": "Old password is required",
      "string.min": "Old password should have a minimum length of {#limit}",
    }),
    newPassword: Joi.string().min(5).required().messages({
      "string.base": "New password must be a string",
      "string.empty": "New password is required",
      "string.min": "New password should have a minimum length of {#limit}",
    }),
    confirmNewPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Confirm new password is required",
      }),
  }),

  reportsSchema: Joi.object({
    reporter_id: Joi.string().uuid().required().messages({
      "string.empty": "Reporter ID is required",
      "string.pattern.base": "Invalid Reporter ID format",
      "string.uuid": "Invalid Reporter ID format",
    }),
    reported_id: Joi.string().uuid().required().messages({
      "string.empty": "Reported ID is required",
      "string.pattern.base": "Invalid Reported ID format",
      "string.uuid": "Invalid Reported ID format",
    }),
    reason: Joi.string().required().messages({
      "any.required": "Reason is required",
      "string.empty": "Reason cannot be empty",
    }),
  }),
};

module.exports = userValidation;
