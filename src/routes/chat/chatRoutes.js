const { Router } = require("express");
const {
  getChattingGroups,
  deleteGroup,
} = require("../../controller/Chat/chatController");
const {
  ValidateParams,
} = require("../../middleware/validations/validationMiddleware");
const chatValidations = require("../../validations/chatValidations");
const router = Router();

router.route("/:user_id").get(getChattingGroups);
router
  .route("/delete/:group_id/user/:user_id")
  .delete(ValidateParams(chatValidations.deleteGroupSchema), deleteGroup);

module.exports = router;
