const { Router } = require("express");

const {
  createConnectedAccount,
  createAccountLink,
  checkRequirements,
} = require("../../controller/Payment/connectedAccountsController");

const router = Router();

router.route("/create/:userId").post( createConnectedAccount);
router.route("/link-account/:userId").post( createAccountLink);
router.route("/check-requirements/:userId").get( checkRequirements);

module.exports = router;
