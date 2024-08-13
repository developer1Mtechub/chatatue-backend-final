const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const paymentValidations = require("../../validations/paymentValidations");
const {
  createPaymentIntent,
  transferAndWithdraw,
  upcomingPayments,
  updateWallet,
  getWallet,
  getPaymentHistory,
} = require("../../controller/Payment/paymentsController");

const router = Router();

router
  .route("/create-intent")
  .post(
    isLoggedIn,
    validateBody(paymentValidations.paymentIntent),
    createPaymentIntent
  );
router
  .route("/upcoming")
  .patch(
    isLoggedIn,
    validateBody(paymentValidations.upcomingPayment),
    upcomingPayments
  );
router
  .route("/transfer")
  .post(
    isLoggedIn,
    validateBody(paymentValidations.paymentIntent),
    transferAndWithdraw
  );

router.route("/update-wallet").patch(isLoggedIn, updateWallet);
router.route("/user/wallet").get(isLoggedIn, getWallet);
router.route("/history").get(isLoggedIn, getPaymentHistory);

module.exports = router;
