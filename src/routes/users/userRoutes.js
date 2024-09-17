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
  loginAdmin,
} = require("../../controller/User/userController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const userValidation = require("../../validations/userValidations");

const {
  followUser,
  unfollowUser,
  getFollowersList,
} = require("../../controller/User/Followers/followerController");

// router
const router = express.Router();

router
  .route("/create")
  .post(validateBody(userValidation.createUser), createUser);

router.route("/login").post(validateBody(userValidation.loginUser), loginUser);
router.route("/admin/login").post(loginAdmin);
router.route("/verify-email").post(verifyEmail);
router.route("/verify-otp").post(verifyOTP);
router.route("/reset-password/:id").patch(resetPassword);
router.route("/:id").get(getUserById);
router.route("/").get(getUsers);
router.route("/remove-user-images").delete(removeUserImages);
router.route("/:id").delete(deleteUserAccount);
router.route("/:id/update").put(updateUserAccount);
router
  .route("/update-password")
  .patch(validateBody(userValidation.updatePassword), updatePassword);

router
  .route("/follow")
  .post(validateBody(userValidation.followersSchema), followUser);
router
  .route("/unfollow")
  .post(validateBody(userValidation.followersSchema), unfollowUser);

router.route("/followers/list").get(getFollowersList);

module.exports = router;
