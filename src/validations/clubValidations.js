const Joi = require("joi");

const waypointSchema = Joi.object({
  lat: Joi.number().required().messages({
    "number.base": "WayPoint Latitude should be a number.",
    "any.required": "WayPoint Latitude is a required field.",
  }),
  long: Joi.number().required().messages({
    "number.base": "WayPoint Longitude should be a number.",
    "any.required": "WayPoint Longitude is a required field.",
  }),

  elevation: Joi.number().required().messages({
    "number.base": "WayPoint Elevation should be a number.",
    "any.required": "WayPoint Elevation is a required field.",
  }),
});

const clubValidations = {
  createClub: Joi.object({
    name: Joi.string().min(3).required().messages({
      "string.base": "Club name should be a type of 'text'.",
      "string.empty": "Club name cannot be an empty field.",
      "string.min": "Club name must be at least {{#limit}} characters long.",
      "any.required": "Club name is a required field.",
    }),
    description: Joi.string().optional(),
    fee: Joi.number().min(0).optional(),
    is_paid: Joi.boolean().optional(),
    user_id: Joi.string().uuid().required().messages({
      "string.base": "User ID should be a type of 'text'.",
      "string.empty": "User ID cannot be an empty field.",
      "string.guid": "User ID must be a valid UUID.",
      "any.required": "User ID is a required field.",
    }),
    images: Joi.string().optional(),
  }),

  createRoute: Joi.object({
    club_id: Joi.string().uuid().required().messages({
      "string.base": "Club ID should be a type of 'text'.",
      "string.empty": "Club ID cannot be an empty field.",
      "string.guid": "Club ID must be a valid UUID.",
      "any.required": "Club ID is a required field.",
    }),
    user_id: Joi.string().uuid().required().messages({
      "string.base": "User ID should be a type of 'text'.",
      "string.empty": "User ID cannot be an empty field.",
      "string.guid": "User ID must be a valid UUID.",
      "any.required": "User ID is a required field.",
    }),
    start_loc_name: Joi.string().required().messages({
      "string.base": "Start location name should be a type of 'text'.",
      "string.empty": "Start location name cannot be an empty field.",
      "any.required": "Start location name is a required field.",
    }),
    end_loc_name: Joi.string().required().messages({
      "string.base": "End location name should be a type of 'text'.",
      "string.empty": "End location name cannot be an empty field.",
      "any.required": "End location name is a required field.",
    }),
    start_lat: Joi.number().required().messages({
      "number.base": "Start latitude should be a number.",
      "any.required": "Start latitude is a required field.",
    }),
    start_long: Joi.number().required().messages({
      "number.base": "Start longitude should be a number.",
      "any.required": "Start longitude is a required field.",
    }),
    start_elevation: Joi.number().required().messages({
      "number.base": "Start elevation should be a number.",
      "any.required": "Start elevation is a required field.",
    }),
    end_lat: Joi.number().required().messages({
      "number.base": "End latitude should be a number.",
      "any.required": "End latitude is a required field.",
    }),
    end_long: Joi.number().required().messages({
      "number.base": "End longitude should be a number.",
      "any.required": "End longitude is a required field.",
    }),
    end_elevation: Joi.number().required().messages({
      "number.base": "End elevation should be a number.",
      "any.required": "End elevation is a required field.",
    }),
    waypoints: Joi.array().items(waypointSchema),
  }),

  membershipRequest: Joi.object({
    club_id: Joi.string().uuid().required().messages({
      "string.base": "Club ID should be a type of 'text'.",
      "string.empty": "Club ID cannot be an empty field.",
      "string.guid": "Club ID must be a valid UUID.",
      "any.required": "Club ID is a required field.",
    }),
    user_id: Joi.string().uuid().required().messages({
      "string.base": "User ID should be a type of 'text'.",
      "string.empty": "User ID cannot be an empty field.",
      "string.guid": "User ID must be a valid UUID.",
      "any.required": "User ID is a required field.",
    }),
  }),

  updateMembership: Joi.object({
    status: Joi.string()
      .valid("APPROVED", "REJECTED", "PENDING")
      .optional()
      .messages({
        "string.base": "Status should be a type of 'text'.",
        "string.empty": "Status cannot be an empty field.",
        "string.pattern.base":
          "Status must be either 'APPROVED', 'REJECTED' or 'PENDING'.",
      }),
  }),

  getMembers: Joi.object({
    page: Joi.number().optional().messages({
      "number.base": "Page should be a number.",
    }),
    limit: Joi.number().optional().messages({
      "number.base": "Limit should be a number.",
    }),
    sortField: Joi.string().optional().messages({
      "string.base": "Sort field should be a type of 'text'.",
    }),
    sortOrder: Joi.string().optional().messages({
      "string.base": "Order should be a type of 'text'.",
    }),
  }),

  memberRole: Joi.object({
    member_role: Joi.string().valid("ADMIN", "MEMBER").required().messages({
      "string.base": "Member role should be a type of 'text'.",
      "string.empty": "Member role cannot be an empty field.",
      "string.pattern.base": "Member role must be either 'ADMIN' or 'MEMBER'.",
    }),
  }),

  postsShema: Joi.object({
    club_id: Joi.string().uuid().required().messages({
      "string.base": "Club ID should be a type of 'text'.",
      "string.empty": "Club ID cannot be an empty field.",
      "string.guid": "Club ID must be a valid UUID.",
      "any.required": "Club ID is a required field.",
    }),

    title: Joi.string().min(2).required().messages({
      "string.base": "Title should be a type of 'text'.",
      "string.empty": "Title cannot be an empty field.",
      "any.required": "Title is a required field.",
      "string.min": "Title must be at least {{#limit}} characters long.",
    }),

    description: Joi.string().optional(),
    tag: Joi.string().optional(),
  }),
};

module.exports = clubValidations;
