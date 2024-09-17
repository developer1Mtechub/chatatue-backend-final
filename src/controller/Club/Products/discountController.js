const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { responseSender } = require("../../../utilities/responseHandlers");

const createProductDiscount = async (req, res, next) => {
  const { product_id, discount_code, discount_value, discount_type } = req.body;

  try {
    const { rowCount: checkCode } = await pool.query(
      `SELECT * FROM discounts WHERE discount_code = $1 LIMIT 1`,
      [discount_code.toUpperCase()]
    );

    if (checkCode > 0) {
      return responseSender(res, 400, false, "Discount code already exists");
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO discounts (product_id, discount_code, discount_value, discount_type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        product_id,
        discount_code.toUpperCase(),
        discount_value,
        discount_type.toUpperCase(),
      ]
    );

    if (rowCount === 0) {
      return responseSender(
        res,
        400,
        false,
        "Failed to add discount on product"
      );
    }

    return responseSender(res, 201, true, "Discount Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const calculateDiscount = async (req, res, next) => {
  const { product_id, discount_code, quantity } = req.body;

  try {
    // Fetch the product details
    const {
      rows: [product],
      rowCount,
    } = await pool.query(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [
      product_id,
    ]);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Product not found");
    }

    // Fetch the discount details
    const {
      rows: [discount],
      rowCount: checkDiscount,
    } = await pool.query(
      `SELECT * FROM discounts WHERE product_id = $1 AND discount_code = $2 LIMIT 1`,
      [product_id, discount_code.toUpperCase()]
    );

    if (checkDiscount === 0) {
      return responseSender(
        res,
        404,
        false,
        "Discount for this product not found"
      );
    }

    let discountValue = discount.discount_value;
    let discountType = discount.discount_type;
    let discountedPrice = 0;

    // Calculate the total discount
    if (discountType === "PERCENTAGE") {
      discountedPrice = product.price * (1 - discountValue / 100) * quantity;
    } else if (discountType === "AMOUNT") {
      discountedPrice = (product.price - discountValue) * quantity;
      if (discountedPrice < 0) discountedPrice = 0;
    }

    const totalDiscount = product.price * quantity - discountedPrice;

    return responseSender(res, 200, true, "Discount calculated successfully", {
      originalPrice: product.price * quantity,
      discountedPrice,
      totalDiscount,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createProductDiscount,
  calculateDiscount,
};
