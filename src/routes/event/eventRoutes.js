const { Router } = require("express");

const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const eventValidation = require("../../validations/eventValidation");
const {
  createEvent,
  joinEvent,
  sendEventInvite,
  inviteResoponse,
  getEventMembers,
  getEventInvitesByStatus,
  getEvent,
  getEvents,
  userInvitaions,
  updateEvent,
  removeEventImages,
  deleteEvent,
  getJoinedEvents,
} = require("../../controller/Events/eventsController");
const { checkRole } = require("../../middleware/auth/checkRole");

const router = Router();

router
  .route("/create")
  .post(
    checkRole(["ADMIN", "CREATOR"]),
    validateBody(eventValidation.eventSchema),
    createEvent
  );

router.route("/:event_id/join/:userId").post(joinEvent);
router
  .route("/send-invite")
  .post(validateBody(eventValidation.eventInviteSchema), sendEventInvite);

router.route("/:id/invitation").patch(inviteResoponse);
router.route("/:event_id/members").get(getEventMembers);
router.route("/invites/:event_id").get(getEventInvitesByStatus);
router.route("/").get(getEvents);
router.route("/joined/:userId").get(getJoinedEvents);
router.route("/:userId/invitations").get(userInvitaions);
router.route("/:id").get(getEvent);
router.route("/:id").put(updateEvent);
router.route("/remove-images").delete(removeEventImages);
router.route("/:id").delete(deleteEvent);

module.exports = router;
