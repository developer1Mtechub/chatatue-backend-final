const { Router } = require("express");
const {
  createRoute,
  getRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  updateWayPoint,
  deleteWayPoint,
} = require("../../controller/Club/C-Routes/routesController");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const clubValidations = require("../../validations/clubValidations");

const router = Router();

router
  .route("/create")
  .post(isLoggedIn, validateBody(clubValidations.createRoute), createRoute);

router.route("/:id").get(isLoggedIn, getRoute);
router.route("/").get(isLoggedIn, getRoutes);
router.route("/:id").patch(isLoggedIn, updateRoute);
router.route("/:id").delete(isLoggedIn, deleteRoute);
router.route("/waypoint/:id").put(isLoggedIn, updateWayPoint);
router.route("/waypoint/:id").delete(isLoggedIn, deleteWayPoint);

module.exports = router;
