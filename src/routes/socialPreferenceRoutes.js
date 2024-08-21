const express = require("express");

const {
  createSocialPreference,
  getSocialPreferences,
  getSocialPreference,
  updateSocialPreference,
  deleteSocialPreference,
} = require("../controller/Social-Preference/socialPreferenceController");

// router
const router = express.Router();
router.route("/create").post(createSocialPreference);
router.route("/").get(getSocialPreferences);
router.route("/:id").get(getSocialPreference);
router.route("/:id/update").patch(updateSocialPreference);
router.route("/:id/delete").delete(deleteSocialPreference);

module.exports = router;
