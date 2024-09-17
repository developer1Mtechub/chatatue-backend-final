const express = require("express");

const {
  createClubRule,
  getClubRules,
  getClubRule,
  updateClubRule,
  deleteClubRule,
} = require("../../controller/Club/Rules/clubRulesController");

// router
const router = express.Router();

router.route("/create").post( createClubRule);
router.route("/").get( getClubRules);
router.route("/:id").get( getClubRule);
router.route("/:id/update").patch( updateClubRule);
router.route("/:id/delete").delete( deleteClubRule);

module.exports = router;
