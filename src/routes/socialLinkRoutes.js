const express = require("express");

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
  .post(validateBody(socialLinkValidation.createSocialLink), createSocialLink);
router.route("/").get(getSocialLinks);
router.route("/:id").get(getSocialLink);
router.route("/:id/update").patch(updateSocialLink);
router.route("/:id/delete").delete(deleteSocialLink);

module.exports = router;
