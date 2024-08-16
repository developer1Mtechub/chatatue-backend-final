const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  createEventActivity,
  getEventActivities,
  getEventActivity,
  updateEventActivity,
  deleteEventActivity,
} = require("../../controller/Events/Activities/activitiesController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const eventValidation = require("../../validations/eventValidation");

const router = Router();

router
  .route("/create")
  .post(
    isLoggedIn,
    validateBody(eventValidation.activitiesSchema),
    createEventActivity
  );

router.route("/").get(isLoggedIn, getEventActivities);
router.route("/:id").get(isLoggedIn, getEventActivity);
router.route("/:id").put(isLoggedIn, updateEventActivity);
router.route("/:id").delete(isLoggedIn, deleteEventActivity);

module.exports = router;
