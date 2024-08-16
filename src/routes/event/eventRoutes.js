const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const upload = require("../../middleware/multer");
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
    isLoggedIn,
    upload.array("images"),
    checkRole(["ADMIN", "CREATOR"]),
    validateBody(eventValidation.eventSchema),
    createEvent
  );

router.route("/:event_id/join").post(isLoggedIn, joinEvent);
router
  .route("/send-invite")
  .post(
    isLoggedIn,
    validateBody(eventValidation.eventInviteSchema),
    sendEventInvite
  );

router.route("/:id/invitation").patch(isLoggedIn, inviteResoponse);
router.route("/:event_id/members").get(isLoggedIn, getEventMembers);
router.route("/invites/:event_id").get(isLoggedIn, getEventInvitesByStatus);
router.route("/").get(isLoggedIn, getEvents);
router.route("/joined").get(isLoggedIn, getJoinedEvents);
router.route("/user-invitations").get(isLoggedIn, userInvitaions);
router.route("/:id").get(isLoggedIn, getEvent);

router.route("/:id").put(isLoggedIn, upload.single("image"), updateEvent);
router.route("/remove-images").delete(isLoggedIn, removeEventImages);
router.route("/:id").delete(isLoggedIn, deleteEvent);

module.exports = router;
