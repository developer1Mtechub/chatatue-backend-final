const express = require("express");
const {
  createUser,
  loginUser,
  verifyEmail,
  verifyOTP,
  resetPassword,
  getUserById,
  getUsers,
  deleteUserAccount,
  updateUserAccount,
  removeUserImages,
  updatePassword,
} = require("../../controller/User/userController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const userValidation = require("../../validations/userValidations");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const upload = require("../../middleware/multer");
const uploadFields = upload.fields([
  { name: "profile_image", maxCount: 1 },
  { name: "profile_showcase_photos", maxCount: 10 },
]);

// router
const router = express.Router();

router
  .route("/create")
  .post(validateBody(userValidation.createUser), createUser);

router.route("/login").post(validateBody(userValidation.loginUser), loginUser);
router.route("/verify-email").post(verifyEmail);
router.route("/verify-otp").post(verifyOTP);
router.route("/reset-password/:id").patch(resetPassword);
router.route("/:id").get(isLoggedIn, getUserById);
router.route("/").get(isLoggedIn, getUsers);
router.route("/remove-user-images").delete(isLoggedIn, removeUserImages);
router.route("/:id").delete(isLoggedIn, deleteUserAccount);
router.route("/:id/update").put(isLoggedIn, uploadFields, updateUserAccount);
router
  .route("/update-password")
  .patch(
    isLoggedIn,
    validateBody(userValidation.updatePassword),
    updatePassword
  );

module.exports = router;
