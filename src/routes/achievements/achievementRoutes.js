const { Router } = require("express");
const {
  createEventAcheivement,
  getAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement,
} = require("../../controller/Achievements/achievementsController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const eventValidation = require("../../validations/eventValidation");
const router = Router();

router
  .route("/create")
  .post(
    validateBody(eventValidation.achievementSchema),
    createEventAcheivement
  );

router.route("/:id").get(getAchievement);
router.route("/").get(getAchievements);
router.route("/:id").put(updateAchievement);
router.route("/:id").delete(deleteAchievement);

module.exports = router;
