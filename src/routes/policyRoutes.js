const express = require("express");
const {
  upsertPolicies,
  getPolicy,
} = require("../controller/Policy/policiesController");
const router = express.Router();

router.route("/create").post(upsertPolicies);
router.route("/").get(getPolicy);

module.exports = router;
