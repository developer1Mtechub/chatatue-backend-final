const express = require("express");
const {
  createClubGoal,
  getClubGoal,
  getClubGoals,
  updateClubGoal,
  deleteClubGoal,
} = require("../../controller/Club/Fitness-Goals/clubFitnessGoalsController");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");

// router
const router = express.Router();

router.route("/create").post(isLoggedIn, createClubGoal);
router.route("/:id").get(isLoggedIn, getClubGoal);
router.route("/").get(isLoggedIn, getClubGoals);
router.route("/:id/update").put(isLoggedIn, updateClubGoal);
router.route("/:id/delete").delete(isLoggedIn, deleteClubGoal);

module.exports = router;
