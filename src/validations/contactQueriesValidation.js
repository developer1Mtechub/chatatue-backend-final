const Joi = require("joi");

const contactValidations = {
  createContactSchema: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    message: Joi.string().required(),
  }),
};

module.exports = contactValidations;
