const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { responseSender } = require("../../../utilities/responseHandlers");
const { pagination } = require("../../../utilities/pagination");

// Create Club Goal
const createClubGoal = async (req, res, next) => {
  const { club_id, goal } = req.body;

  const missingFields = [club_id, goal].some((field) => !field);

  if (missingFields) {
    return responseSender(res, 400, false, "Missing Required Fields");
  }

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO club_fitness_goals (club_id, goal) VALUES ($1, $2) RETURNING *`,
      [club_id, goal]
    );

    if (rowCount === 0) {
      return responseSender(
        res,
        400,
        false,
        "Fitness goal not added due to an error"
      );
    }

    responseSender(res, 200, true, "Fitness goal added successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Get a Single Club Goal
const getClubGoal = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM club_fitness_goals  WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club Fitness Goal not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Club Fitness Goal Retrieved",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Get All Club Goals
const getClubGoals = async (req, res, next) => {
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
      whereClauses.push(`goal ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (club_id) {
      whereClauses.push(`club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM club_fitness_goals ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club Fitness Goals not found");
    }

    const countQuery = `SELECT COUNT(*) FROM club_fitness_goals ${whereClause}`;
    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, "Club Fitness Goals retrieved", {
      clubFitnessGoals: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Update Club Goal
const updateClubGoal = async (req, res, next) => {
  const { id } = req.params;
  const { goal } = req.body;

  try {
    const fetchClubGoal = await pool.query(
      `SELECT * FROM club_fitness_goals WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchClubGoal.rowCount === 0) {
      return responseSender(res, 404, false, "Club Fitness Goal not found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE club_fitness_goals SET goal = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [goal, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club Fitness Goal not updated");
    }

    return responseSender(res, 200, true, "Club Fitness Goal Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// Delete Club Goal
const deleteClubGoal = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM club_fitness_goals WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Club Fitness Goal not deleted");
    }

    return responseSender(res, 200, true, "Club Fitness Goal Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createClubGoal,
  getClubGoal,
  getClubGoals,
  updateClubGoal,
  deleteClubGoal,
};
