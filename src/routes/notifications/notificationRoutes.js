const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  sendNotifications,
  getNotifications,
  deleteNotification,
} = require("../../controller/Notifications/notificationController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const notificationValidations = require("../../validations/notificationValidations");
const router = Router();

router
  .route("/send")
  .post(
    isLoggedIn,
    validateBody(notificationValidations.sendNotificationSchema),
    sendNotifications
  );
router.route("/").get(isLoggedIn, getNotifications);
router.route("/:id").delete(isLoggedIn, deleteNotification);

module.exports = router;
