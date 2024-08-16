const { Router } = require("express");
const {
  createClub,
  getClubs,
  getClub,
  deleteClub,
  updateClub,
  removeClubImages,
} = require("../../controller/Club/clubController");

const router = Router();

const upload = require("../../middleware/multer");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const clubValidations = require("../../validations/clubValidations");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");

router
  .route("/create")
  .post(
    isLoggedIn,
    upload.array("images"),
    validateBody(clubValidations.createClub),
    createClub
  );

router.route("/").get(isLoggedIn, getClubs);

router.route("/:id").get(isLoggedIn, getClub);

router.route("/:id").put(isLoggedIn, upload.single("image"), updateClub);

router.route("/remove-images").delete(isLoggedIn, removeClubImages);

router.route("/:id").delete(isLoggedIn, deleteClub);

module.exports = router;
