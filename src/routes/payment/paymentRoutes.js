const { Router } = require("express");
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
    
    validateBody(paymentValidations.paymentIntent),
    createPaymentIntent
  );
router
  .route("/upcoming")
  .patch(
    
    validateBody(paymentValidations.upcomingPayment),
    upcomingPayments
  );
router
  .route("/transfer")
  .post(
    
    validateBody(paymentValidations.paymentIntent),
    transferAndWithdraw
  );

router.route("/update-wallet/:userId").patch( updateWallet);
router.route("/user/wallet/:userId").get( getWallet);
router.route("/history/:userId").get( getPaymentHistory);

module.exports = router;
