const express = require("express");

const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createSocialLink,
  getSocialLinks,
  getSocialLink,
  updateSocialLink,
  deleteSocialLink,
} = require("../controller/Social-Links/socialLinkController");
const {
  validateBody,
} = require("../middleware/validations/validationMiddleware");
const socialLinkValidation = require("../validations/socialLinkValidations");

// router
const router = express.Router();
router
  .route("/create")
  .post(
    isLoggedIn,
    validateBody(socialLinkValidation.createSocialLink),
    createSocialLink
  );
router.route("/").get(isLoggedIn, getSocialLinks);
router.route("/:id").get(isLoggedIn, getSocialLink);
router.route("/:id/update").patch(isLoggedIn, updateSocialLink);
router.route("/:id/delete").delete(isLoggedIn, deleteSocialLink);

module.exports = router;
