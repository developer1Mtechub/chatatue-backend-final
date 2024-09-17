const { Router } = require("express");

const {
  createSuggestion,
  getSuggestions,
  deleteSuggestion,
} = require("../controller/Suggestions/suggestionController");
const router = Router();

router.route("/create").post(createSuggestion);
router.route("/").get(getSuggestions);
router.route("/:id").delete(deleteSuggestion);

module.exports = router;
