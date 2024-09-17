const Joi = require("joi");

const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;

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
    is_paid: Joi.boolean().required().messages({
      "boolean.base": "Paid status should be a boolean.",
      "any.required": "Paid status is a required field.",
    }),
    user_id: Joi.string().uuid().required().messages({
      "string.base": "User ID should be a type of 'text'.",
      "string.empty": "User ID cannot be an empty field.",
      "string.guid": "User ID must be a valid UUID.",
      "any.required": "User ID is a required field.",
    }),
    images: Joi.array().items(Joi.object()).required().messages({
      "array.required": "Event images are required",
      "array.items": "Each event image must be an object",
    }),
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

    userId: Joi.string().uuid().required().messages({
      "string.base": "User ID should be a type of 'text'.",
      "string.empty": "User ID cannot be an empty field.",
      "string.guid": "User ID must be a valid UUID.",
      "any.required": "User ID is a required field.",
    }),

    description: Joi.string().optional(),
    tag: Joi.string().optional(),
    images: Joi.array().items(Joi.object()).required().messages({
      "array.required": "Event images are required",
      "array.items": "Each event image must be an object",
    }),
  }),

  scheduleSchema: Joi.object({
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

    day: Joi.string().required().messages({
      "string.base": "Day should be a type of 'text'.",
      "string.empty": "Day cannot be an empty field.",
      "any.required": "Day is a required field.",
    }),

    time_name: Joi.string().required().messages({
      "string.base": "Time name should be a type of 'text'.",
      "string.empty": "Time name cannot be an empty field.",
      "any.required": "Time name is a required field.",
    }),

    start_time: Joi.string().regex(timeRegex).required().messages({
      "string.pattern.base":
        "Start time should be a valid time in HH:MM or HH:MM:SS format.",
      "any.required": "Start time is a required field.",
    }),

    end_time: Joi.string().regex(timeRegex).required().messages({
      "string.pattern.base":
        "End time should be a valid time in HH:MM or HH:MM:SS format.",
      "any.required": "End time is a required field.",
    }),
  }),
};

module.exports = clubValidations;
