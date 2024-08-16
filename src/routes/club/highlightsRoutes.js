const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const clubValidations = require("../../validations/clubValidations");
const {
  createHighlight,
  getHighlight,
  getHighlights,
  updateHighlight,
  deleteHighlight,
  removeHighlightImages,
} = require("../../controller/Club/Highlights/highlightsController");
const upload = require("../../middleware/multer");
const { checkRole } = require("../../middleware/auth/checkRole");

const router = Router();

router
  .route("/create")
  .post(
    isLoggedIn,
    upload.array("images"),
    checkRole(["ADMIN", "CREATOR"]),
    validateBody(clubValidations.postsShema),
    createHighlight
  );

router.route("/:id").get(isLoggedIn, getHighlight);
router.route("/").get(isLoggedIn, getHighlights);
router.route("/:id").patch(isLoggedIn, upload.single("image"), updateHighlight);
router.route("/remove-images").delete(isLoggedIn, removeHighlightImages);
router.route("/:id").delete(isLoggedIn, deleteHighlight);

module.exports = router;
