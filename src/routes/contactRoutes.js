const { Router } = require("express");
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
    
    validateBody(contactValidations.createContactSchema),
    createContactQuery
  );

router.route("/:id/:status").patch( updateContactStatus);
router.route("/").get( getAllContacts);
router.route("/:id").delete( deleteContact);

module.exports = router;
