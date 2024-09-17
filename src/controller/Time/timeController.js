const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createRunningTime = async (req, res, next) => {
  const { time_interval } = req.body;

  if (!time_interval) {
    return responseSender(res, 422, false, "Time interval is required");
  }

  try {
    // check if already exists
    const { rowCount: existCount } = await pool.query(
      `SELECT * FROM running_times WHERE LOWER(time_interval) = LOWER($1) LIMIT 1`,
      [time_interval]
    );
    if (existCount > 0) {
      return responseSender(res, 409, false, "Running Time already exists");
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO running_times (time_interval) VALUES ($1) RETURNING *`,
      [time_interval]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Running Time not added");
    }

    return responseSender(res, 200, true, "Running Time Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getRunningTime = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM running_times WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Running Time not found");
    }

    return responseSender(res, 200, true, "Running Time Retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getRunningTimes = async (req, res, next) => {
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
      whereClauses.push(`time_interval ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM running_times ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, `Running Times not found`);
    }

    const countQuery = `SELECT COUNT(*) FROM running_times ${whereClause}`;

    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, `Runnning Times retrieved`, {
      socialPreferences: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateRunningTime = async (req, res, next) => {
  const { id } = req.params;
  const { time_interval } = req.body;

  if (!time_interval) {
    return responseSender(res, 422, false, "Time interval is required");
  }

  try {
    const fetchSocialPreference = await pool.query(
      `SELECT * FROM running_times WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchSocialPreference.rowCount === 0) {
      return responseSender(res, 404, false, "Running Time not found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE running_times SET time_interval = $1 WHERE id = $2 RETURNING *`,
      [time_interval, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Running Time not updated");
    }

    return responseSender(res, 200, true, "Running Time Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteRunningTime = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM running_times WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Running Time not deleted");
    }

    return responseSender(res, 200, true, "Running Time Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createRunningTime,
  getRunningTime,
  getRunningTimes,
  updateRunningTime,
  deleteRunningTime,
};
