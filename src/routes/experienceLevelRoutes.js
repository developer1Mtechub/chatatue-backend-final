const express = require("express");

const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createExperienceLevel,
  getExperienceLevels,
  getExperienceLevel,
  updateExperienceLevel,
  deleteExperienceLevel,
} = require("../controller/Experience-Level/experienceLevelController");

// router
const router = express.Router();
router.route("/create").post(isLoggedIn, createExperienceLevel);
router.route("/").get(isLoggedIn, getExperienceLevels);
router.route("/:id").get(isLoggedIn, getExperienceLevel);
router.route("/:id/update").patch(isLoggedIn, updateExperienceLevel);
router.route("/:id/delete").delete(isLoggedIn, deleteExperienceLevel);

module.exports = router;
