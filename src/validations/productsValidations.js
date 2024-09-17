const Joi = require("joi");

const productsValidations = {
  createProductSchema: Joi.object({
    club_id: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid club id format",
      "any.required": "Club id is required",
    }),
    images: Joi.array().items(Joi.object()).required().messages({
      "array.required": "Event images are required",
      "array.items": "Each event image must be an object",
    }),
    userId: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid user id format",
      "any.required": "User id is required",
    }),

    title: Joi.string().required().messages({
      "any.required": "Title is required",
    }),
    description: Joi.string().optional(),
    sizes: Joi.array().items(Joi.string()).required().messages({
      "array.items": "Size list should be an array of strings",
      "any.required": "Size list is required",
    }),
    materials: Joi.string().required().messages({
      "any.required": "Material list is required",
    }),
    price: Joi.number().required().messages({
      "number.required": "Price is required",
      "number.min": "Price must be greater than or equal to 0",
    }),
  }),

  addDiscountSchema: Joi.object({
    product_id: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid product id format",
      "any.required": "Product id is required",
    }),
    discount_code: Joi.string().required().messages({
      "any.required": "Discount code is required",
    }),
    discount_value: Joi.number().required().min(0).messages({
      "number.required": "Discount value is required",
      "number.min": "Discount value must be greater than or equal to 0",
    }),
    discount_type: Joi.string()
      .required()
      .valid("PERCENTAGE", "AMOUNT")
      .messages({
        "any.required": "Discount type is required",
        "any.only": "Discount type must be either 'PERCENTAGE' or 'AMOUNT'",
      }),
  }),

  calculateDiscountSchema: Joi.object({
    product_id: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid product id format",
      "any.required": "Product id is required",
    }),
    discount_code: Joi.string().required().messages({
      "any.required": "Discount code is required",
    }),
    quantity: Joi.number().required().min(1).messages({
      "number.required": "Quantity is required",
      "number.min": "Quantity must be greater than or equal to 1",
    }),
  }),

  purchaseSchema: Joi.object({
    buyer_id: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid buyer id format",
      "any.required": "Buyer id is required",
      "string.empty": "Buyer is not allowed to be empty",
    }),
    product_id: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid product id format",
      "any.required": "Product id is required",
      "string.empty": "Product is not allowed to be empty",
    }),
    quantity: Joi.number().required().messages({
      "number.required": "Quantity is required",
      "number.min": "Quantity must be greater than or equal to 1",
    }),
    price: Joi.number().required().min(0).messages({
      "number.required": "Price is required",
      "number.min": "Price must be greater than or equal to 0",
    }),
    address: Joi.string().required().messages({
      "any.required": "Address is required",
    }),
  }),
};

module.exports = productsValidations;
