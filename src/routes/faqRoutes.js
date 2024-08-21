const { Router } = require("express");
const {
  createFaq,
  getAllFaqs,
  updateFaq,
  deleteFaq,
} = require("../controller/FAQ/faqController");
const router = Router();

router.route("/create").post( createFaq);
router.route("/").get( getAllFaqs);
router.route("/:id").patch( updateFaq);
router.route("/:id").delete( deleteFaq);

module.exports = router;
