const { Router } = require("express");

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
    
    validateBody(eventValidation.activitiesSchema),
    createEventActivity
  );

router.route("/").get( getEventActivities);
router.route("/:id").get( getEventActivity);
router.route("/:id").put( updateEventActivity);
router.route("/:id").delete( deleteEventActivity);

module.exports = router;
