const { Router } = require("express");
const { getChattingGroups } = require("../../controller/Chat/chatController");
const router = Router();

router.route("/:user_id").get(getChattingGroups);

module.exports = router;
