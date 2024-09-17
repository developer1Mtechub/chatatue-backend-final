const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createMeetingPoint = async (req, res, next) => {
  const { event_id, description } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO meeting_points (event_id, description)
       VALUES ($1, $2) RETURNING *`,
      [event_id, description]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to create meeting point");
    }

    responseSender(
      res,
      201,
      true,
      "Meeting point created successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getMeetingPoint = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM meeting_points WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Meeting point not found");
    }

    responseSender(
      res,
      200,
      true,
      "Meeting point retrieved successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getMeetingPoints = async (req, res, next) => {
  const {
    event_id,
    search,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (event_id) {
      whereClauses.push(`event_id = $${queryParams.length + 1}`);
      queryParams.push(event_id);
    }

    if (search) {
      whereClauses.push(`description ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (whereClauses.length > 0) {
      whereClauses = `WHERE ${whereClauses.join(" AND ")}`;
    }

    const query = `SELECT * FROM meeting_points
            ${whereClauses} ORDER BY ${sortField} ${sortOrder}
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No meeting points found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM meeting_points ${whereClauses}`,
      queryParams.slice(0, -2)
    );

    responseSender(res, 200, true, "Meeting points retrieved successfully", {
      meetingPoints: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateMeetingPoint = async (req, res, next) => {
  const { id } = req.params;
  const { event_id, description } = req.body;

  try {
    let query = `UPDATE meeting_points SET `;
    let index = 2;
    let values = [id];

    if (event_id) {
      query += `event_id = $${index}, `;
      values.push(event_id);
      index++;
    }

    if (description) {
      query += `description = $${index}, `;
      values.push(description);
    }

    query = query.replace(/,\s*$/, "");
    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Meeting point not found");
    }

    responseSender(
      res,
      200,
      true,
      "Meeting point updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteMeetingPoint = async (req, res, next) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `DELETE FROM meeting_points WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "Meeting point not found");
    }

    await pool.query("COMMIT");
    responseSender(
      res,
      200,
      true,
      "Meeting point deleted successfully",
      rows[0]
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createMeetingPoint,
  getMeetingPoint,
  getMeetingPoints,
  updateMeetingPoint,
  deleteMeetingPoint,
};
