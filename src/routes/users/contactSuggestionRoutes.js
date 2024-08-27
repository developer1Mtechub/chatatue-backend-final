const { Router } = require("express");
const {
  createContactList,
  getUserContactList,
} = require("../../controller/User/Contact-Suggestions/contactSugesstionController");
const router = Router();

router.route("/create").post(createContactList);
router.route("/:user_id").get(getUserContactList);

module.exports = router;
