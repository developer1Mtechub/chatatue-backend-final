const { Router } = require("express");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
} = require("../controller/Badges/badgesController");
const upload = require("../middleware/multer");
const {
  validateBody,
} = require("../middleware/validations/validationMiddleware");
const eventValidation = require("../validations/eventValidation");

const router = Router();

router
  .route("/create")
  .post(
    isLoggedIn,
    upload.single("icon"),
    validateBody(eventValidation.badgeShema),
    createBadge
  );

router.route("/").get(isLoggedIn, getBadges);
router.route("/:id").get(isLoggedIn, getBadgeById);
router.route("/:id").patch(isLoggedIn, upload.single("icon"), updateBadge);
router.route("/:id").delete(isLoggedIn, deleteBadge);

module.exports = router;
