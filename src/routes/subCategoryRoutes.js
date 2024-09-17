const express = require("express");
const {
  createSubCategory,
  getSubCategory,
  getSubCategories,
  deleteSubCategory,
  updateSubCategory,
} = require("../controller/Category/SubCategory/subCategoryController");

const categoryValidation = require("../validations/categoryValidations");
const {
  validateBody,
} = require("../middleware/validations/validationMiddleware");

const router = express.Router();

router
  .route("/create")
  .post(
    
    validateBody(categoryValidation.createSubCategory),
    createSubCategory
  );
router.route("/").get( getSubCategories);
router.route("/:id").get( getSubCategory);
router.route("/:id/update").patch( updateSubCategory);
router.route("/:id/delete").delete(deleteSubCategory);

module.exports = router;
