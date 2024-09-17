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

const clubValidations = require("../../validations/clubValidations");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");

router
  .route("/create")
  .post(validateBody(clubValidations.createClub), createClub);

router.route("/").get(getClubs);

router.route("/:id").get(getClub);

router.route("/:id").put(updateClub);

router.route("/remove-images").delete(removeClubImages);

router.route("/:id").delete(deleteClub);

module.exports = router;
