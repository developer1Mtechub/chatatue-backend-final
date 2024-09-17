const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createEventActivity = async (req, res, next) => {
  const { event_id, name, description, location, lat, long } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO activities (event_id, name, description, location, lat, long)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_id, name, description, location, lat, long]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to create activity ");
    }

    responseSender(res, 201, true, "Activity created successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getEventActivity = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM activities WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Activity not found");
    }

    responseSender(res, 200, true, "Activity retrieved successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getEventActivities = async (req, res, next) => {
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
      whereClauses.push(
        `name ILIKE $${queryParams.length + 1} OR description ILIKE $${
          queryParams.length + 1
        }`
      );
      queryParams.push(`%${search}%`);
    }

    if (whereClauses.length > 0) {
      whereClauses = `WHERE ${whereClauses.join(" AND ")}`;
    }

    const query = `SELECT * FROM activities
            ${whereClauses} ORDER BY ${sortField} ${sortOrder}
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No activities found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM activities ${whereClauses}`,
      queryParams.slice(0, -2)
    );

    responseSender(res, 200, true, "Activities retrieved successfully", {
      activities: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateEventActivity = async (req, res, next) => {
  const { id } = req.params;
  const { event_id, name, description, location, lat, long } = req.body;
  try {
    let query = `UPDATE activities SET `;
    let index = 2;
    let values = [id];

    if (event_id) {
      query += `event_id = $${index}, `;
      values.push(event_id);
      index++;
    }

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (description) {
      query += `description = $${index}, `;
      values.push(description);
      index++;
    }

    if (location) {
      query += `location = $${index}, `;
      values.push(location);
      index++;
    }

    if (lat) {
      query += `lat = $${index}, `;
      values.push(lat);
      index++;
    }

    if (long) {
      query += `long = $${index}`;
      values.push(long);
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Activity not found");
    }

    responseSender(res, 200, true, "Activity updated successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteEventActivity = async (req, res, next) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `DELETE FROM activities WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "Activity not found");
    }

    await pool.query("COMMIT");
    responseSender(res, 200, true, "Activity deleted successfully", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createEventActivity,
  getEventActivity,
  getEventActivities,
  updateEventActivity,
  deleteEventActivity,
};
