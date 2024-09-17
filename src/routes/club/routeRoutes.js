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

const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const clubValidations = require("../../validations/clubValidations");

const router = Router();

router
  .route("/create")
  .post(validateBody(clubValidations.createRoute), createRoute);

router.route("/:id").get(getRoute);
router.route("/").get(getRoutes);
router.route("/:id").patch(updateRoute);
router.route("/:id").delete(deleteRoute);
router.route("/waypoint/:id").put(updateWayPoint);
router.route("/waypoint/:id").delete(deleteWayPoint);

module.exports = router;
