const { Router } = require("express");

const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const productsValidations = require("../../validations/productsValidations");
const {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  removeProductImages,
} = require("../../controller/Club/Products/productsController");
const { checkRole } = require("../../middleware/auth/checkRole");
const {
  createProductDiscount,
  calculateDiscount,
} = require("../../controller/Club/Products/discountController");
const {
  purchaseProduct,
  updatePurchaseStatus,
  getPurchaseItems,
  getPurchaseItem,
} = require("../../controller/Club/Products/orderProductsController");
const router = Router();

router
  .route("/create")
  .post(
    checkRole(["CREATOR"]),
    validateBody(productsValidations.createProductSchema),
    createProduct
  );

router.route("/").get(getProducts);
router.route("/:id").get(getProduct);
router.route("/:id").patch(updateProduct);
router.route("/remove-images").delete(removeProductImages);
router.route("/:id").delete(deleteProduct);

router
  .route("/add-discount")
  .post(
    validateBody(productsValidations.addDiscountSchema),
    createProductDiscount
  );

router
  .route("/calculate-discount")
  .post(
    validateBody(productsValidations.calculateDiscountSchema),
    calculateDiscount
  );

router
  .route("/purchase")
  .post(validateBody(productsValidations.purchaseSchema), purchaseProduct);

router.route("/purchase/:id/update").patch(updatePurchaseStatus);
router.route("/get/purchase-items").get(getPurchaseItems);
router.route("/get/:id/item").get(getPurchaseItem);

module.exports = router;
