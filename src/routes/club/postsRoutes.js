const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  createPost,
  getPost,
  getPosts,
  deletePost,
  updatePost,
  removePostImages,
} = require("../../controller/Club/Posts/postsController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const clubValidations = require("../../validations/clubValidations");

const upload = require("../../middleware/multer");

const router = Router();

router
  .route("/create")
  .post(
    isLoggedIn,
    upload.array("image"),
    validateBody(clubValidations.postsShema),
    createPost
  );

router.route("/:id").get(isLoggedIn, getPost);
router.route("/").get(isLoggedIn, getPosts);
router.route("/:id").patch(isLoggedIn, upload.single("image"), updatePost);
router.route("/remove-images").delete(isLoggedIn, removePostImages);
router.route("/:id").delete(isLoggedIn, deletePost);

module.exports = router;
