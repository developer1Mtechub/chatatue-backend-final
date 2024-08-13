const { Router } = require("express");
const { isLoggedIn } = require("../../middleware/auth/authMiddleware");
const upload = require("../../middleware/multer");
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
    isLoggedIn,
    upload.array("images"),
    checkRole(["CREATOR"]),
    validateBody(productsValidations.createProductSchema),
    createProduct
  );

router.route("/").get(isLoggedIn, getProducts);
router.route("/:id").get(isLoggedIn, getProduct);
router.route("/:id").patch(isLoggedIn, upload.single("image"), updateProduct);
router.route("/remove-images").delete(isLoggedIn, removeProductImages);
router.route("/:id").delete(isLoggedIn, deleteProduct);

router
  .route("/add-discount")
  .post(
    isLoggedIn,
    validateBody(productsValidations.addDiscountSchema),
    createProductDiscount
  );

router
  .route("/calculate-discount")
  .post(
    isLoggedIn,
    validateBody(productsValidations.calculateDiscountSchema),
    calculateDiscount
  );

router
  .route("/purchase")
  .post(
    isLoggedIn,
    validateBody(productsValidations.purchaseSchema),
    purchaseProduct
  );

router.route("/purchase/:id/update").patch(isLoggedIn, updatePurchaseStatus);
router.route("/get/purchase-items").get(isLoggedIn, getPurchaseItems);
router.route("/get/:id/item").get(isLoggedIn, getPurchaseItem);

module.exports = router;
