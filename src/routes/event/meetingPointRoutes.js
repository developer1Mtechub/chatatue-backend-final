const { Router } = require("express");

const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const eventValidation = require("../../validations/eventValidation");
const {
  createMeetingPoint,
  getMeetingPoint,
  getMeetingPoints,
  updateMeetingPoint,
  deleteMeetingPoint,
} = require("../../controller/Events/Meeting-Points/meetingPointsController");

const router = Router();

router
  .route("/create")
  .post(validateBody(eventValidation.meetingPointSchema), createMeetingPoint);

router.route("/").get(getMeetingPoints);
router.route("/:id").get(getMeetingPoint);
router.route("/:id").put(updateMeetingPoint);
router.route("/:id").delete(deleteMeetingPoint);

module.exports = router;
