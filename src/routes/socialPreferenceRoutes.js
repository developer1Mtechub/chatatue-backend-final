const express = require("express");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createSocialPreference,
  getSocialPreferences,
  getSocialPreference,
  updateSocialPreference,
  deleteSocialPreference,
} = require("../controller/Social-Preference/socialPreferenceController");

// router
const router = express.Router();
router.route("/create").post(isLoggedIn, createSocialPreference);
router.route("/").get(isLoggedIn, getSocialPreferences);
router.route("/:id").get(isLoggedIn, getSocialPreference);
router.route("/:id/update").patch(isLoggedIn, updateSocialPreference);
router.route("/:id/delete").delete(isLoggedIn, deleteSocialPreference);

module.exports = router;
