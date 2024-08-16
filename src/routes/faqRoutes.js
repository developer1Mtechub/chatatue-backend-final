const { Router } = require("express");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createFaq,
  getAllFaqs,
  updateFaq,
  deleteFaq,
} = require("../controller/FAQ/faqController");
const router = Router();

router.route("/create").post(isLoggedIn, createFaq);
router.route("/").get(isLoggedIn, getAllFaqs);
router.route("/:id").patch(isLoggedIn, updateFaq);
router.route("/:id").delete(isLoggedIn, deleteFaq);

module.exports = router;
