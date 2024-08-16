const { Router } = require("express");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const clubValidations = require("../../validations/clubValidations");
const {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
} = require("../../controller/Club/Schedules/schedulesController");
const router = Router();

router
  .route("/create")
  .post(validateBody(clubValidations.scheduleSchema), createSchedule);

router.route("/").get(getSchedules);

router.route("/:id").patch(updateSchedule);

router.route("/:id").delete(deleteSchedule);

module.exports = router;
