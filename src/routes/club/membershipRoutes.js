const { Router } = require("express");

const {
  validateBody,
  validateQuery,
} = require("../../middleware/validations/validationMiddleware");
const clubValidations = require("../../validations/clubValidations");
const {
  sendMembershipRequest,
  updateMembership,
  getClubMembers,
  updateMemberRole,
  getJoinClubs,
  getMembershipRequests,
  removeClubMember,
  checkClubMembership,
} = require("../../controller/Club/Membership/membershipController");

const router = Router();

router
  .route("/send-request")
  .post(validateBody(clubValidations.membershipRequest), sendMembershipRequest);

router
  .route("/:id")
  .patch(validateBody(clubValidations.updateMembership), updateMembership);

router
  .route("/:club_id/members")
  .get(validateQuery(clubValidations.getMembers), getClubMembers);

router
  .route("/update-role/:id")
  .patch(validateBody(clubValidations.memberRole), updateMemberRole);

router.route("/join-clubs/:user_id").get(getJoinClubs);
router.route("/requests/:club_id").get(getMembershipRequests);
router.route("/:id/remove").delete(removeClubMember);
router.route("/:club_id/:user_id/check").get(checkClubMembership);

module.exports = router;
