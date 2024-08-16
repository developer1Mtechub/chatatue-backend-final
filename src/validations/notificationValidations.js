const Joi = require("joi");

const notificationValidations = {
  sendNotificationSchema: Joi.object({
    title: Joi.string().required().messages({
      "string.base": "Title should be a type of string",
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),
    message: Joi.string().required().messages({
      "string.base": "Message should be a type of string",
      "string.empty": "Message is required",
      "any.required": "Message is required",
    }),
    sender_id: Joi.string().required().messages({
      "number.base": "Sender ID should be a type of number",
      "number.integer": "Sender ID must be an integer",
      "any.required": "Sender ID is required",
    }),
    receiver_id: Joi.string().required().messages({
      "number.base": "Receiver ID should be a type of number",
      "number.integer": "Receiver ID must be an integer",
      "any.required": "Receiver ID is required",
    }),
    type: Joi.string().required().messages({
      "string.base": "Type should be a type of string",
      "string.empty": "Type is required",
      "any.required": "Type is required",
    }),
  }),
};

module.exports = notificationValidations;
