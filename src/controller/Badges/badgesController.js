const pool = require("../../config/db");
const logger = require("../../config/logger");

const { responseSender } = require("../../utilities/responseHandlers");

const createBadge = async (req, res, next) => {
  const { badge_type, badge_title, badge_icon } = req.body;

  try {
    const { rowCount: checkBadge } = await pool.query(
      `SELECT * FROM badges WHERE LOWER(badge_title) = LOWER($1) LIMIT 1`,
      [badge_title]
    );

    if (checkBadge > 0) {
      return responseSender(
        res,
        400,
        false,
        "Badge with the same title already exists"
      );
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO badges (badge_icon , badge_type, badge_title) VALUES ($1, $2, $3) RETURNING *`,
      [badge_icon, badge_type, badge_title]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to add badge");
    }

    return responseSender(
      res,
      201,
      true,
      "Badge created successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getBadges = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM badges`);
    return responseSender(res, 200, true, "Badges retrieved successfully", {
      badges: rows,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getBadgeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM badges WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Badge retrieved successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateBadge = async (req, res, next) => {
  const { badge_type, badge_title, badge_icon } = req.body;
  const { id } = req.params;

  try {
    const { rowCount: badgeCount } = await pool.query(
      `SELECT * FROM badges WHERE id = $1`,
      [id]
    );

    if (badgeCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    let query = `UPDATE badges SET `;
    let index = 2;
    let values = [id];

    if (badge_type) {
      query += `badge_type = $${index}, `;
      values.push(badge_type);
      index++;
    }

    if (badge_title) {
      query += `badge_title = $${index}, `;
      values.push(badge_title);
      index++;
    }

    if (badge_icon) {
      query += `badge_icon = $${index}, `;
      values.push(badge_icon);
      index++;
    }

    query = query.replace(/,\s*$/, "");
    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Badge updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteBadge = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM badges WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    return responseSender(res, 200, true, "Badge deleted successfully", {
      id: rows[0].id,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
};
