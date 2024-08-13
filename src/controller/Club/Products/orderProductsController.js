const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const purchaseProduct = async (req, res, next) => {
  const { buyer_id, product_id, quantity, price, address } = req.body;

  try {
    const {
      rows: [product],
      rowCount: checkProduct,
    } = await pool.query(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [
      product_id,
    ]);

    if (checkProduct === 0) {
      return responseSender(res, 404, false, "Product Not Found");
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO purchase_items (buyer_id , seller_id, product_id, quantity, price, address) VALUES ($1, $2, $3,$4 , $5, $6) RETURNING *`,
      [buyer_id, product.creator_id, product_id, quantity, price, address]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to purchase product");
    }

    return responseSender(
      res,
      200,
      true,
      "Product Purchased Successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updatePurchaseStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["PENDING", "DELIEVERED", "CONFIRMED"].includes(status)) {
    return responseSender(res, 400, false, "Invalid status");
  }

  try {
    const {
      rows: [updatedPurchase],
      rowCount,
    } = await pool.query(
      `UPDATE purchase_items SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Purchase Not Found");
    }

    return responseSender(
      res,
      200,
      true,
      "Purchase Status Updated Successfully",
      updatedPurchase
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getPurchaseItems = async (req, res, next) => {
  const {
    search,
    buyer_id,
    seller_id,
    product_id,
    status,
    page = 1,
    limit = 10,
    sortOrder = "DESC",
    sortField = "created_at",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereConditions = [];
    let queryParams = [];

    if (buyer_id) {
      whereConditions.push(`buyer_id  = $${queryParams.length + 1}`);
      queryParams.push(buyer_id);
    }

    if (search) {
      whereConditions.push(`p.title ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (seller_id) {
      whereConditions.push(`seller_id  = $${queryParams.length + 1}`);
      queryParams.push(seller_id);
    }

    if (product_id) {
      whereConditions.push(`product_id  = $${queryParams.length + 1}`);
      queryParams.push(product_id);
    }

    if (status) {
      whereConditions.push(`status  = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    let whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const query = `
      SELECT pi.* , 
      json_build_object('details', p.*) AS product
      FROM purchase_items pi 
      LEFT JOIN products p ON pi.product_id = p.id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}

      `;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No Purchase Items Found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM purchase_items pi LEFT JOIN products p 
      ON pi.product_id = p.id
      ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(
      res,
      200,
      true,
      "Purchase Items Retrieved Successfully",
      {
        purchaseItems: rows,
        pagination: pagination(totalRows.rows[0].count, limit, page),
      }
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getPurchaseItem = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT pi.*, json_build_object('details', p.*) AS product
            FROM purchase_items pi 
            LEFT JOIN products p ON pi.product_id = p.id
            WHERE pi.id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Purchase Item Not Found");
    }

    return responseSender(
      res,
      200,
      true,
      "Purchase Item Retrieved Successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  purchaseProduct,
  updatePurchaseStatus,
  getPurchaseItems,
  getPurchaseItem,
};
