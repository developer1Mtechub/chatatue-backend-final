const express = require("express");

const {
  createExperienceLevel,
  getExperienceLevels,
  getExperienceLevel,
  updateExperienceLevel,
  deleteExperienceLevel,
} = require("../controller/Experience-Level/experienceLevelController");

// router
const router = express.Router();
router.route("/create").post(createExperienceLevel);
router.route("/").get(getExperienceLevels);
router.route("/:id").get(getExperienceLevel);
router.route("/:id/update").patch(updateExperienceLevel);
router.route("/:id/delete").delete(deleteExperienceLevel);

module.exports = router;
