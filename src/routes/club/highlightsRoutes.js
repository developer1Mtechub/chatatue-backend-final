const { Router } = require("express");
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
const { checkRole } = require("../../middleware/auth/checkRole");

const router = Router();

router
  .route("/create")
  .post(
    checkRole(["ADMIN", "CREATOR"]),
    validateBody(clubValidations.postsShema),
    createHighlight
  );

router.route("/:id").get(getHighlight);
router.route("/").get(getHighlights);
router.route("/:id").patch(updateHighlight);
router.route("/remove-images").delete(removeHighlightImages);
router.route("/:id").delete(deleteHighlight);

module.exports = router;
