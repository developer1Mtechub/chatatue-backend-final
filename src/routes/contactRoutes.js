const { Router } = require("express");
const { isLoggedIn } = require("../middleware/auth/authMiddleware");
const {
  createContactQuery,
  updateContactStatus,
  getAllContacts,
  deleteContact,
} = require("../controller/Contact/contactQueryController");
const {
  validateBody,
} = require("../middleware/validations/validationMiddleware");
const contactValidations = require("../validations/contactQueriesValidation");
const router = Router();

router
  .route("/create")
  .post(
    isLoggedIn,
    validateBody(contactValidations.createContactSchema),
    createContactQuery
  );

router.route("/:id/:status").patch(isLoggedIn, updateContactStatus);
router.route("/").get(isLoggedIn, getAllContacts);
router.route("/:id").delete(isLoggedIn, deleteContact);

module.exports = router;
