const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createSocialPreference = async (req, res, next) => {
  const { preference } = req.body;

  if (!preference) {
    return responseSender(res, 422, false, "Preference is required");
  }

  try {
    const { rowCount: RowsCount } = await pool.query(
      `SELECT * FROM social_preferences  WHERE LOWER(preference) = LOWER($1)`,
      [preference]
    );

    if (RowsCount > 0) {
      return responseSender(
        res,
        400,
        false,
        "Social Preference already exists"
      );
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO social_preferences (preference) VALUES ($1) RETURNING *`,
      [preference]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Social Preference not added");
    }

    return responseSender(res, 200, true, "Social Preference Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getSocialPreference = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM social_preferences WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Social Preference not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Social Preference Retrieved",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getSocialPreferences = async (req, res, next) => {
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
      whereClauses.push(`preference ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM social_preferences ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, `Social Preferences not found`);
    }

    const countQuery = `SELECT COUNT(*) FROM social_preferences ${whereClause}`;

    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, `Social Preferences retrieved`, {
      socialPreferences: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateSocialPreference = async (req, res, next) => {
  const { id } = req.params;
  const { preference } = req.body;

  try {
    const fetchSocialPreference = await pool.query(
      `SELECT * FROM social_preferences WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchSocialPreference.rowCount === 0) {
      return responseSender(res, 404, false, "Social Preference not found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE social_preferences SET preference = $1 WHERE id = $2 RETURNING *`,
      [preference, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Social Preference not updated");
    }

    return responseSender(res, 200, true, "Social Preference Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteSocialPreference = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM social_preferences WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Social Preference not deleted");
    }

    return responseSender(res, 200, true, "Social Preference Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createSocialPreference,
  getSocialPreference,
  getSocialPreferences,
  updateSocialPreference,
  deleteSocialPreference,
};
