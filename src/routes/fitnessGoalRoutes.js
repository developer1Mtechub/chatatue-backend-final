const express = require("express");


const {
  createFitnessGoal,
  getFitnessGoals,
  getFitnessGoal,
  updateFitnessGoal,
  deleteFitnessGoal,
} = require("../controller/Fitness-Goal/fitnessGoalController");

// router
const router = express.Router();
router.route("/create").post( createFitnessGoal);
router.route("/").get( getFitnessGoals);
router.route("/:id").get( getFitnessGoal);
router.route("/:id/update").patch( updateFitnessGoal);
router.route("/:id/delete").delete( deleteFitnessGoal);

module.exports = router;
