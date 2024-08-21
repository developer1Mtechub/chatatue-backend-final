const Joi = require("joi");

const paymentValidations = {
  paymentIntent: Joi.object({
    amount: Joi.number().required().messages({
      "number.empty": "Amount cannot be empty",
      "number.base": "Amount must be a number",
      "number.required": "Amount is required",
    }),
    userId: Joi.string().uuid().required().messages({
      "string.empty": "User ID cannot be empty",
      "string.base": "User ID must be a string",
      "string.uuid": "User ID must be a valid UUID",
      "any.required": "User ID is required",
    }),
  }),

  upcomingPayment: Joi.object({
    amount: Joi.number().required().messages({
      "number.empty": "Amount cannot be empty",
      "number.base": "Amount must be a number",
      "number.required": "Amount is required",
    }),
    userId: Joi.string().uuid().required().messages({
      "string.empty": "User ID cannot be empty",
      "string.base": "User ID must be a string",
      "string.uuid": "User ID must be a valid UUID",
      "any.required": "User ID is required",
    }),
    recipient_id: Joi.string().required().messages({
      "string.empty": "Recipient ID cannot be empty",
      "string.base": "Recipient ID must be a string",
      "any.required": "Recipient ID is required",
    }),
    transaction_type: Joi.string()
      .valid("EVENT", "MERCHANDISE", "WITHDRAWAL")
      .required()
      .messages({
        "string.empty": "Transaction type cannot be empty",
        "string.pattern.base":
          "Transaction type must be either 'EVENT', 'MERCHANDISE', or 'WITHDRAWAL'",
        "any.required": "Transaction type is required",
      }),
    details: Joi.object().optional(),
  }),
};

module.exports = paymentValidations;
