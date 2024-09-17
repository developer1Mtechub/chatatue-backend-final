const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createExperienceLevel = async (req, res, next) => {
  const { level } = req.body;

  if (!level) {
    return responseSender(res, 422, false, "Experience Level is required");
  }

  try {
    const { rowCount: RowsCount } = await pool.query(
      `SELECT * FROM running_experience_levels WHERE LOWER(level) = LOWER($1)`,
      [level]
    );

    if (RowsCount > 0) {
      return responseSender(res, 400, false, "Running Level already exists");
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO running_experience_levels (level) VALUES ($1) RETURNING *`,
      [level]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Experience Level not added");
    }

    return responseSender(res, 200, true, "Experience Level Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getExperienceLevel = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM running_experience_levels WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Experience Level not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Experience Level Retrieved",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getExperienceLevels = async (req, res, next) => {
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
      whereClauses.push(`level ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM running_experience_levels ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, `Experience Levels not found`);
    }

    const countQuery = `SELECT COUNT(*) FROM running_experience_levels ${whereClause}`;

    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, `Experience Levels retrieved`, {
      experienceLevels: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateExperienceLevel = async (req, res, next) => {
  const { id } = req.params;
  const { level } = req.body;

  try {
    const fetchExperienceLevel = await pool.query(
      `SELECT * FROM running_experience_levels WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchExperienceLevel.rowCount === 0) {
      return responseSender(res, 404, false, "Experience Level not found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE running_experience_levels SET level = $1 WHERE id = $2 RETURNING *`,
      [level, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Experience Level not updated");
    }

    return responseSender(res, 200, true, "Experience Level Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteExperienceLevel = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM running_experience_levels WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Experience Level not deleted");
    }

    return responseSender(res, 200, true, "Experience Level Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createExperienceLevel,
  getExperienceLevel,
  getExperienceLevels,
  updateExperienceLevel,
  deleteExperienceLevel,
};
