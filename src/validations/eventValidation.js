const Joi = require("joi");

const eventValidation = {
  eventSchema: Joi.object({
    club_id: Joi.string().uuid().required().messages({
      "string.guid": "Club ID must be a valid UUID",
      "any.required": "Club ID is required",
    }),
    userId: Joi.string().uuid().required().messages({
      "string.guid": "User ID must be a valid UUID",
      "any.required": "User ID is required",
    }),
    images: Joi.array().items(Joi.object()).required().messages({
      "array.required": "Event images are required",
      "array.items": "Each event image must be an object",
    }),
    name: Joi.string().max(255).required().messages({
      "string.max": "Event name cannot be more than 255 characters",
      "any.required": "Event name is required",
    }),
    description: Joi.string().required().messages({
      "any.required": "Event description is required",
    }),
    event_type: Joi.string().required().messages({
      "any.required": "Event type is required",
    }),
    is_public: Joi.boolean().required().messages({
      "any.required": "Public status is required",
    }),
    is_paid: Joi.boolean().required().messages({
      "any.required": "Paid status is required",
    }),
    amount: Joi.number()
      .when("is_paid", {
        is: true,
        then: Joi.number().positive().required(),
        otherwise: Joi.number().optional(),
      })
      .messages({
        "number.base": "Amount must be a number",
        "number.positive": "Amount must be a positive number",
        "any.required": "Amount is required when the event is paid",
      }),
    start_time: Joi.date().required().messages({
      "date.base": "Start time must be a valid date",
      "any.required": "Start time is required",
    }),
    start_date: Joi.date().required().messages({
      "date.base": "Start date must be a valid date",
      "any.required": "Start date is required",
    }),
    end_date: Joi.date().required().messages({
      "date.base": "End date must be a valid date",
      "any.required": "End date is required",
    }),
    distance: Joi.number().positive().optional().messages({
      "number.base": "Distance must be a number",
      "number.positive": "Distance must be a positive number",
    }),
    location: Joi.string().required().messages({
      "string.base": "Location must be a type of 'text'",
      "any.required": "Location is required",
    }),
    latitude: Joi.number().required().messages({
      "any.required": "Latitude is required",
    }),
    longitude: Joi.number().required().messages({
      "any.required": "Longitude is required",
    }),
    route_ids: Joi.array().items(Joi.string().uuid()).required().messages({
      "array.base": "Routes must be an array of UUIDs",
      "string.guid": "Each route ID must be a valid UUID",
      "any.required": "Route IDs are required",
    }),
    category_ids: Joi.array().items(Joi.string().uuid()).required().messages({
      "array.base": "Categories must be an array of UUIDs",
      "string.guid": "Each category ID must be a valid UUID",
      "any.required": "Category IDs are required",
    }),
    badge_ids: Joi.array().items(Joi.string().uuid()).required().messages({
      "array.base": "Badges must be an array of UUIDs",
      "string.guid": "Each badge ID must be a valid UUID",
      "any.required": "Badge IDs are required",
    }),
    event_link: Joi.string().uri().messages({
      "string.uri": "Event link must be a valid URI",
    }),
  }),

  eventInviteSchema: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
    event_id: Joi.string().uuid().required().messages({
      "string.guid": "Event ID must be a valid UUID",
      "any.required": "Event ID is required",
    }),
    user_id: Joi.string().uuid().optional().allow("").messages({
      "string.guid": "User ID must be a valid UUID",
    }),
  }),

  activitiesSchema: Joi.object({
    event_id: Joi.string().uuid().required().messages({
      "string.base": "Event ID must be a string",
      "string.guid": "Event ID must be a valid UUID",
      "any.required": "Event ID is required",
    }),
    name: Joi.string().min(3).max(255).required().messages({
      "string.base": "Name must be a string",
      "string.min": "Name must be at least 3 characters long",
      "string.max": "Name cannot be longer than 255 characters",
      "any.required": "Name is required",
    }),
    description: Joi.string().optional().allow("").messages({
      "string.base": "Description must be a string",
    }),
    location: Joi.string().max(255).required().messages({
      "string.base": "Location must be a string",
      "string.max": "Location cannot be longer than 255 characters",
      "any.required": "Location is required",
    }),
    lat: Joi.number().required().messages({
      "number.base": "Latitude must be a number",
      "any.required": "Latitude is required",
    }),
    long: Joi.number().required().messages({
      "number.base": "Longitude must be a number",
      "any.required": "Longitude is required",
    }),
  }),

  meetingPointSchema: Joi.object({
    event_id: Joi.string().uuid().required().messages({
      "string.base": "Event ID must be a string",
      "string.guid": "Event ID must be a valid UUID",
      "any.required": "Event ID is required",
    }),
    description: Joi.string().required().messages({
      "string.base": "Description must be a string",
      "any.required": "Description is required",
    }),
  }),

  badgeShema: Joi.object({
    badge_type: Joi.string().valid("DIGITAL", "PRIZE").required().messages({
      "string.base": "Badge type must be a string",
      "string.enum": "Badge type must be one of 'DIGITAL', 'PRIZE'",
      "any.required": "Badge type is required",
    }),
    badge_icon: Joi.object().required().messages({
      "object.base": "Badge icon must be an object",
      "any.required": "Badge icon is required",
    }),
    badge_title: Joi.string().required().messages({
      "string.base": "Badge title must be a string",
      "any.required": "Badge title is required",
    }),
  }),

  achievementSchema: Joi.object({
    event_id: Joi.string().uuid().required().messages({
      "string.base": "Event ID must be a string",
      "string.guid": "Event ID must be a valid UUID",
      "any.required": "Event ID is required",
    }),
    user_id: Joi.string().uuid().required().messages({
      "string.base": "User ID must be a string",
      "string.guid": "User ID must be a valid UUID",
      "any.required": "User ID is required",
    }),
    pace: Joi.number().min(1).required().messages({
      "number.base": "Pace must be a number",
      "number.min": "Pace must be at least 1",
      "any.required": "Pace is required",
    }),

    duration: Joi.string().required().messages({
      "string.base": "Duration must be a string",
      "any.required": "Duration is required",
    }),
    calories_burnt: Joi.number().required().messages({
      "number.base": "Calories burnt must be a number",
      "any.required": "Calories burnt is required",
    }),
  }),
};

module.exports = eventValidation;
