const express = require("express");
const {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  getCategory,
} = require("../controller/Category/categoryController");


// router
const router = express.Router();
router.route("/create").post( createCategory);
router.route("/").get( getCategories);
router.route("/:id").get( getCategory);
router.route("/:id/update").patch( updateCategory);
router.route("/:id/delete").delete(deleteCategory);

module.exports = router;
