const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createFitnessGoal = async (req, res, next) => {
  const { goal } = req.body;

  if (!goal) {
    return responseSender(res, 422, false, "Fitness Goal is required");
  }

  try {
    const { rowCount: RowsCount } = await pool.query(
      `SELECT * FROM fitness_goals WHERE LOWER(goal) = LOWER($1)`,
      [goal]
    );

    if (RowsCount > 0) {
      return responseSender(res, 400, false, "Running Level already exists");
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO fitness_goals (goal) VALUES ($1) RETURNING *`,
      [goal]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Fitness Goal not added");
    }

    return responseSender(res, 200, true, "Fitness Goal Added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getFitnessGoal = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM fitness_goals WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Fitness Goal not found");
    }

    return responseSender(res, 200, true, "Fitness Goal Retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getFitnessGoals = async (req, res, next) => {
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
      whereClauses.push(`goal ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM fitness_goals ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, `Fitness Goals not found`);
    }

    const countQuery = `SELECT COUNT(*) FROM fitness_goals ${whereClause}`;

    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, `Fitness Goals retrieved`, {
      fitnessGoals: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateFitnessGoal = async (req, res, next) => {
  const { id } = req.params;
  const { goal } = req.body;

  try {
    const fetchFitnessGoal = await pool.query(
      `SELECT * FROM fitness_goals WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchFitnessGoal.rowCount === 0) {
      return responseSender(res, 404, false, "Fitness Goal not found");
    }

    const { rows, rowCount } = await pool.query(
      `UPDATE fitness_goals SET goal = $1 WHERE id = $2 RETURNING *`,
      [goal, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Fitness Goal not updated");
    }

    return responseSender(res, 200, true, "Fitness Goal Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteFitnessGoal = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM fitness_goals WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Fitness Goal not deleted");
    }

    return responseSender(res, 200, true, "Fitness Goal Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createFitnessGoal,
  getFitnessGoal,
  getFitnessGoals,
  updateFitnessGoal,
  deleteFitnessGoal,
};
