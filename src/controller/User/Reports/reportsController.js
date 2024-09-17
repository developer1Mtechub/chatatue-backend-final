const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const reportUser = async (req, res, next) => {
  const { reporter_id, reported_id, reason } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO reports (reporter_id , reported_id, reason) VALUES ($1, $2, $3) RETURNING * `,
      [reporter_id, reported_id, reason]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to Add Report");
    }

    return responseSender(res, 200, true, "User Reported", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getAllReports = async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    reporter_id,
    reported_id,
    search,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereCondition = [];
    let queryParams = [];

    if (reporter_id) {
      whereCondition.push(`reporter_id = $${queryParams.length + 1}`);
      queryParams.push(reporter_id);
    }

    if (reported_id) {
      whereCondition.push(`reported_id = $${queryParams.length + 1}`);
      queryParams.push(reported_id);
    }

    if (search) {
      whereCondition.push(`reason ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    let whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
     SELECT * FROM reports
     ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, false, "No Reports Found");
    }

    const {
      rows: [totalRows],
    } = await pool.query(
      `SELECT COUNT(*) FROM reports ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Reports", {
      reports: rows,
      pagination: pagination(totalRows.count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      "DELETE FROM reports WHERE id = $1 RETURNING id",
      [id]
    );
    if (rowCount === 0) {
      return responseSender(res, 404, false, "Report not found");
    }
    return responseSender(res, 200, true, "Report deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  reportUser,
  getAllReports,
  deleteReport,
};
