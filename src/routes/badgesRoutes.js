const { Router } = require("express");
const {
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
} = require("../controller/Badges/badgesController");

const {
  validateBody,
} = require("../middleware/validations/validationMiddleware");
const eventValidation = require("../validations/eventValidation");

const router = Router();

router
  .route("/create")
  .post(validateBody(eventValidation.badgeShema), createBadge);

router.route("/").get(getBadges);
router.route("/:id").get(getBadgeById);
router.route("/:id").patch(updateBadge);
router.route("/:id").delete(deleteBadge);

module.exports = router;
