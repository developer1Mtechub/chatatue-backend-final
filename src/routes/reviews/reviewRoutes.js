const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  createReview,
  getReviews,
} = require("../../controller/Reviews/reviewController");
const router = Router();

router.route("/create").post(isLoggedIn, createReview);
router.route("/").get(isLoggedIn, getReviews);

module.exports = router;
