const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");

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
  .post(
    isLoggedIn,
    validateBody(eventValidation.meetingPointSchema),
    createMeetingPoint
  );

router.route("/").get(isLoggedIn, getMeetingPoints);
router.route("/:id").get(isLoggedIn, getMeetingPoint);
router.route("/:id").put(isLoggedIn, updateMeetingPoint);
router.route("/:id").delete(isLoggedIn, deleteMeetingPoint);

module.exports = router;
