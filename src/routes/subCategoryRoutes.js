const express = require("express");
const {
  createSubCategory,
  getSubCategory,
  getSubCategories,
  deleteSubCategory,
  updateSubCategory,
} = require("../controller/Category/SubCategory/subCategoryController");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const categoryValidation = require("../validations/categoryValidations");
const {
  validateBody,
} = require("../middleware/validations/validationMiddleware");

const router = express.Router();

router
  .route("/create")
  .post(
    isLoggedIn,
    validateBody(categoryValidation.createSubCategory),
    createSubCategory
  );
router.route("/:id").get(isLoggedIn, getSubCategory);
router.route("/").get(isLoggedIn, getSubCategories);
router.route("/:id/update").patch(isLoggedIn, updateSubCategory);
router.route("/:id/delete").delete(deleteSubCategory);

module.exports = router;
