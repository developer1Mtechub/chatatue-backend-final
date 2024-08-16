const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createSchedule = async (req, res, next) => {
  const { day, time_name, start_time, end_time, club_id, user_id } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO schedules (day, time_name, start_time, end_time, club_id, user_id)  
        VALUES (
        $1, $2, $3, $4, $5, $6) RETURNING *
        `,
      [day, time_name, start_time, end_time, club_id, user_id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to create Schedule");
    }

    return responseSender(
      res,
      200,
      true,
      "Schedule created successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getSchedules = async (req, res, next) => {
  const {
    club_id,
    user_id,
    start_time,
    end_time,
    page = 1,
    limit = 10,
    search,
    sortField = "created_at",
    sortOrder = "desc",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    const whereCondition = [];
    const queryParams = [];

    if (club_id) {
      whereCondition.push(`club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    if (user_id) {
      whereCondition.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    if (start_time && end_time) {
      whereCondition.push(
        `start_time BETWEEN $${queryParams.length + 1} AND $${
          queryParams.length + 2
        }`
      );
      queryParams.push(start_time, end_time);
    }

    if (search) {
      whereCondition.push(
        `(day ILIKE $${queryParams.length + 1} OR time_name ILIKE $${
          queryParams.length + 1
        })`
      );
      queryParams.push(`%${search}%`);
    }

    let whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
    SELECT * FROM schedules
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No Schedule found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM schedules ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Schedules fetched successfully", {
      schedules: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  const { id } = req.params;
  const { day, time_name, start_time, end_time, club_id } = req.body;

  try {
    let query = `UPDATE schedules SET `;
    let index = 2;
    let values = [id];

    if (day) {
      query += `day = $${index}, `;
      values.push(day);
      index++;
    }

    if (time_name) {
      query += `time_name = $${index}, `;
      values.push(time_name);
      index++;
    }

    if (start_time) {
      query += `start_time = $${index}, `;
      values.push(start_time);
      index++;
    }

    if (end_time) {
      query += `end_time = $${index}, `;
      values.push(end_time);
      index++;
    }

    if (club_id) {
      query += `club_id = $${index} `;
      values.push(club_id);
    }

    query = query.replace(/,\s*$/, "");
    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Schedule not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Schedule updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rowCount, rows } = await pool.query(
      `DELETE FROM schedules WHERE id = $1 RETURNING id`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Schedule not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Schedule deleted successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
};
