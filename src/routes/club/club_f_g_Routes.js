const express = require("express");
const {
  createClubGoal,
  getClubGoal,
  getClubGoals,
  updateClubGoal,
  deleteClubGoal,
} = require("../../controller/Club/Fitness-Goals/clubFitnessGoalsController");


// router
const router = express.Router();

router.route("/create").post( createClubGoal);
router.route("/:id").get( getClubGoal);
router.route("/").get( getClubGoals);
router.route("/:id/update").put( updateClubGoal);
router.route("/:id/delete").delete( deleteClubGoal);

module.exports = router;
