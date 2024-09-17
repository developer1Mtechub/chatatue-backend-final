const { Router } = require("express");

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
    
    validateBody(notificationValidations.sendNotificationSchema),
    sendNotifications
  );
router.route("/").get( getNotifications);
router.route("/:id").delete( deleteNotification);

module.exports = router;
