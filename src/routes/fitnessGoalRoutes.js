const express = require("express");

const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createFitnessGoal,
  getFitnessGoals,
  getFitnessGoal,
  updateFitnessGoal,
  deleteFitnessGoal,
} = require("../controller/Fitness-Goal/fitnessGoalController");

// router
const router = express.Router();
router.route("/create").post(isLoggedIn, createFitnessGoal);
router.route("/").get(isLoggedIn, getFitnessGoals);
router.route("/:id").get(isLoggedIn, getFitnessGoal);
router.route("/:id/update").patch(isLoggedIn, updateFitnessGoal);
router.route("/:id/delete").delete(isLoggedIn, deleteFitnessGoal);

module.exports = router;
