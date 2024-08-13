const express = require("express");
const {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  getCategory,
} = require("../controller/Category/categoryController");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");

// router
const router = express.Router();
router.route("/create").post(isLoggedIn, createCategory);
router.route("/").get(isLoggedIn, getCategories);
router.route("/:id").get(isLoggedIn, getCategory);
router.route("/:id/update").patch(isLoggedIn, updateCategory);
router.route("/:id/delete").delete(deleteCategory);

module.exports = router;
