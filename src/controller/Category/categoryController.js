const pool = require("../../config/db");
const logger = require("../../config/logger");

const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

// create category
const createCategory = async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return responseSender(res, 422, false, "Name is required");
  }

  try {
    const { rowCount: categoryCheckCount } = await pool.query(
      `SELECT * FROM category WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [name]
    );

    if (categoryCheckCount > 0) {
      return responseSender(
        res,
        400,
        false,
        "Category already exists",
        null,
        req
      );
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO category (name) VALUES ($1) RETURNING *`,
      [name]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Category not Added");
    }

    return responseSender(res, 200, true, "Category Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// get specific category
const getCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM category WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Category not Found");
    }

    return responseSender(res, 200, true, "Category Retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// get all categories
const getCategories = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1000;
  const sortField = req.query.sortField || "created_at";
  const sortOrder = req.query.sortOrder || "DESC";
  const offset = (page - 1) * limit;
  const { search } = req.query;

  try {
    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM category ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, `Categories not found`);
    }

    const countQuery = `SELECT COUNT(*) FROM category ${whereClause}`;

    const totalRows = await pool.query(countQuery, queryParams.slice(0, -2));

    return responseSender(res, 200, true, `Categories retrieved`, {
      category: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// update category
const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const fetchCategory = await pool.query(
      `SELECT * FROM category WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchCategory.rowCount === 0) {
      return responseSender(res, 404, false, "Category not Found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE category SET name  = $1 WHERE id = $2 RETURNING * `,
      [name, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Category not Found");
    }

    return responseSender(res, 200, true, "Category Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// delete category
const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM category WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Category not Deleted");
    }

    return responseSender(res, 200, true, "Category Deleted", rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getCategory,
};
