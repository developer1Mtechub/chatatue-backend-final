const pool = require("../../config/db");
const logger = require("../../config/logger");
const { responseSender } = require("../../utilities/responseHandlers");

const createSuggestion = async (req, res, next) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return responseSender(
      res,
      400,
      false,
      "Title and description are required"
    );
  }

  try {
    let result;

    const {
      rows: [suggestion],
      rowCount: suggestionCount,
    } = await pool.query(`SELECT * FROM rating_suggestions`);

    console.log(suggestion);
    console.log(suggestionCount);

    if (suggestionCount > 0) {
      const { rows } = await pool.query(
        `UPDATE rating_suggestions SET title = $1, description = $2 WHERE id = $3 RETURNING *`,
        [title, description, suggestion.id]
      );
      result = rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO rating_suggestions (title, description) VALUES ($1, $2) RETURNING *`,
        [title, description]
      );

      result = rows[0];
    }

    responseSender(res, 201, true, "Suggestion added successfully", result);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM rating_suggestions`
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No suggestions found");
    }

    responseSender(
      res,
      200,
      true,
      "Suggestions retrieved successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteSuggestion = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM rating_suggestions WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Suggestion not found");
    }

    responseSender(res, 200, true, "Suggestion deleted successfully");
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createSuggestion,
  getSuggestions,
  deleteSuggestion,
};
