const { Router } = require("express");
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


const router = Router();

router
  .route("/create")
  .post(validateBody(clubValidations.postsShema), createPost);

router.route("/:id").get(getPost);
router.route("/").get(getPosts);
router.route("/:id").patch(updatePost);
router.route("/remove-images").delete(removePostImages);
router.route("/:id").delete(deletePost);

module.exports = router;
