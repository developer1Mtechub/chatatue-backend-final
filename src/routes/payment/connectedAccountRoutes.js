const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  createConnectedAccount,
  createAccountLink,
  checkRequirements,
} = require("../../controller/Payment/connectedAccountsController");

const router = Router();

router.route("/create").post(isLoggedIn, createConnectedAccount);
router.route("/link-account").post(isLoggedIn, createAccountLink);
router.route("/check-requirements").get(isLoggedIn, checkRequirements);

module.exports = router;
