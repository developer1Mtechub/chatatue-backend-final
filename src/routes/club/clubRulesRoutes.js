const express = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  createClubRule,
  getClubRules,
  getClubRule,
  updateClubRule,
  deleteClubRule,
} = require("../../controller/Club/Rules/clubRulesController");

// router
const router = express.Router();

router.route("/create").post(isLoggedIn, createClubRule);
router.route("/").get(isLoggedIn, getClubRules);
router.route("/:id").get(isLoggedIn, getClubRule);
router.route("/:id/update").patch(isLoggedIn, updateClubRule);
router.route("/:id/delete").delete(isLoggedIn, deleteClubRule);

module.exports = router;
