const express = require("express");

const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createRunningTime,
  getRunningTimes,
  getRunningTime,
  updateRunningTime,
  deleteRunningTime,
} = require("../controller/Time/timeController");

// router
const router = express.Router();
router.route("/create").post(isLoggedIn, createRunningTime);
router.route("/").get(isLoggedIn, getRunningTimes);
router.route("/:id").get(isLoggedIn, getRunningTime);
router.route("/:id/update").patch(isLoggedIn, updateRunningTime);
router.route("/:id/delete").delete(isLoggedIn, deleteRunningTime);

module.exports = router;
