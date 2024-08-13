const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
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
} = require("../../controller/Club/Membership/membershipController");

const router = Router();

router
  .route("/send-request")
  .post(
    isLoggedIn,
    validateBody(clubValidations.membershipRequest),
    sendMembershipRequest
  );

router
  .route("/:id")
  .patch(
    isLoggedIn,
    validateBody(clubValidations.updateMembership),
    updateMembership
  );

router
  .route("/:club_id/members")
  .get(isLoggedIn, validateQuery(clubValidations.getMembers), getClubMembers);

router
  .route("/update-role/:id")
  .patch(
    isLoggedIn,
    validateBody(clubValidations.memberRole),
    updateMemberRole
  );

router.route("/join-clubs/:user_id").get(isLoggedIn, getJoinClubs);
router.route("/requests/:club_id").get(isLoggedIn, getMembershipRequests);
router.route("/:id/remove").delete(isLoggedIn, removeClubMember);

module.exports = router;
