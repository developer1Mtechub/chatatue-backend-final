const express = require("express");

const {
  createRunningTime,
  getRunningTimes,
  getRunningTime,
  updateRunningTime,
  deleteRunningTime,
} = require("../controller/Time/timeController");

// router
const router = express.Router();
router.route("/create").post( createRunningTime);
router.route("/").get( getRunningTimes);
router.route("/:id").get( getRunningTime);
router.route("/:id/update").patch( updateRunningTime);
router.route("/:id/delete").delete( deleteRunningTime);

module.exports = router;
