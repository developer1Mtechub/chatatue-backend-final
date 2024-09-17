const { Router } = require("express");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const userValidation = require("../../validations/userValidations");
const {
  reportUser,
  getAllReports,
  deleteReport,
} = require("../../controller/User/Reports/reportsController");
const router = Router();

router
  .route("/create")
  .post(validateBody(userValidation.reportsSchema), reportUser);

router.route("/").get(getAllReports);
router.route("/:id").delete(deleteReport);

module.exports = router;
