const pool = require("../../../config/db");
const { responseSender } = require("../../../utilities/responseHandlers");

const { pagination } = require("../../../utilities/pagination");
const logger = require("../../../config/logger");

// create subCategory
const createSubCategory = async (req, res, next) => {
  const { name, category_id } = req.body;

  try {
    // check if already subCategory present
    const { rowCount: RowsCount } = await pool.query(
      `SELECT * FROM sub_category WHERE LOWER(name) = LOWER($1) AND category_id = $2`,
      [name, category_id]
    );

    if (RowsCount > 0) {
      return responseSender(res, 400, false, "Subcategory already exists");
    }
    const { rows, rowCount } = await pool.query(
      `INSERT INTO sub_category (name , category_id ) VALUES ($1, $2 ) RETURNING *`,
      [name, category_id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Subcategory not Added");
    }

    return responseSender(res, 200, true, "Subcategory Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// get specific sub category
const getSubCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT sc.*, json_build_object('name', c.name) AS parent_category FROM sub_category sc INNER JOIN category c ON sc.category_id = c.id WHERE sc.id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Sub Category not Found");
    }

    return responseSender(res, 200, true, "Sub Category Retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// get all sub categories
const getSubCategories = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1000;
  const sortField = req.query.sortField || "created_at";
  const sortOrder = req.query.sortOrder || "DESC";
  const offset = (page - 1) * limit;
  const { search, category_id } = req.query;

  try {
    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`sc.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (category_id) {
      whereClauses.push(`sc.category_id = $${queryParams.length + 1}`);
      queryParams.push(category_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT sc.*, json_build_object('name', c.name) AS parent_category 
                   FROM sub_category sc 
                   LEFT JOIN category c ON sc.category_id = c.id 
                   ${whereClause} 
                   ORDER BY ${sortField} ${sortOrder} 
                   LIMIT $${queryParams.length + 1} 
                   OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, `Sub Categories not found`);
    }

    const countQuery = `SELECT COUNT(*) FROM sub_category sc ${whereClause}`;

    const totalRows = await pool.query(countQuery, queryParams.slice(0, -2));

    return responseSender(res, 200, true, `Sub Categories retrieved`, {
      subCategory: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// update sub category
const updateSubCategory = async (req, res, next) => {
  const { name, category_id } = req.body;
  const { id } = req.params;

  try {
    const fetchSubCategory = await pool.query(
      `SELECT * FROM sub_category WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchSubCategory.rowCount === 0) {
      return responseSender(res, 404, false, "Sub Category not Found");
    }

    let query = `UPDATE sub_category SET `;
    let index = 1;
    const values = [];

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (category_id) {
      query += `category_id = $${index}, `;
      values.push(category_id);
      index++;
    }

    // Remove the trailing comma and space
    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $${index} RETURNING *`;
    values.push(id);

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Sub Category not Found");
    }

    return responseSender(res, 200, true, "Sub Category Updated", rows[0]);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

// delete sub category
const deleteSubCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM sub_category  WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Sub Category not Deleted");
    }

    return responseSender(res, 200, true, "Sub Category Deleted", rows[0]);
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  createSubCategory,
  getSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
};
