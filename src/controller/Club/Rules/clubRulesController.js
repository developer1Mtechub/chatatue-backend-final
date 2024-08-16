const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { responseSender } = require("../../../utilities/responseHandlers");
const { pagination } = require("../../../utilities/pagination");

// Create Club Rule
const createClubRule = async (req, res, next) => {
  const { club_id, rule } = req.body;

  const missingFields = [club_id, rule].some((field) => !field);

  if (missingFields) {
    return responseSender(res, 400, false, "Missing Required Fields");
  }

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO club_rules (club_id, rule) VALUES ($1, $2) RETURNING *`,
      [club_id, rule]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Rule not added due to an error");
    }

    responseSender(res, 200, true, "Rule added successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Get a Single Club Rule
const getClubRule = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM club_rules WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club Rule not found");
    }

    return responseSender(res, 200, true, "Club Rule Retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Get All Club Rules
const getClubRules = async (req, res, next) => {
  let { page, limit, sortField, sortOrder, search, club_id } = req.query;

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 100;
  sortField = sortField || "created_at";
  sortOrder = sortOrder || "DESC";
  const offset = (page - 1) * limit;

  try {
    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`rule ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (club_id) {
      whereClauses.push(`club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM club_rules ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club Rules not found");
    }

    const countQuery = `SELECT COUNT(*) FROM club_rules ${whereClause}`;
    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, "Club Rules retrieved", {
      clubRules: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Update Club Rule
const updateClubRule = async (req, res, next) => {
  const { id } = req.params;
  const { rule } = req.body;

  try {
    const fetchClubRule = await pool.query(
      `SELECT * FROM club_rules WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchClubRule.rowCount === 0) {
      return responseSender(res, 404, false, "Club Rule not found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE club_rules SET rule = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [rule, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club Rule not updated");
    }

    return responseSender(res, 200, true, "Club Rule Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Delete Club Rule
const deleteClubRule = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM club_rules WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Club Rule not deleted");
    }

    return responseSender(res, 200, true, "Club Rule Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createClubRule,
  getClubRule,
  getClubRules,
  updateClubRule,
  deleteClubRule,
};
