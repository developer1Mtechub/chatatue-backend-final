const { Router } = require("express");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createSuggestion,
  getSuggestions,
  deleteSuggestion,
} = require("../controller/Suggestions/suggestionController");
const router = Router();

router.route("/create").post(isLoggedIn, createSuggestion);
router.route("/").get(isLoggedIn, getSuggestions);
router.route("/:id").delete(isLoggedIn, deleteSuggestion);

module.exports = router;
