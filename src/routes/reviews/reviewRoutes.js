const { Router } = require("express");
const {
  createReview,
  getReviews,
} = require("../../controller/Reviews/reviewController");
const router = Router();

router.route("/create").post( createReview);
router.route("/").get( getReviews);

module.exports = router;
