const pool = require("../../config/db");
const logger = require("../../config/logger");
const { responseSender } = require("../../utilities/responseHandlers");

const checkRole = (roles) => async (req, res, next) => {
  const { club_id } = req.body;
  const { userId } = req.user;

  try {
    const { rowCount } = await pool.query(
      `SELECT * FROM club_members WHERE club_id = $1 AND user_id = $2 AND member_role = ANY($3::text[]) LIMIT 1`,
      [club_id, userId, roles]
    );

    if (rowCount === 0) {
      return responseSender(res, 403, false, "Cannot access to this route");
    }

    next();
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = { checkRole };