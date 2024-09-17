const pool = require("../../config/db");
const { responseSender } = require("../../utilities/responseHandlers");

const upsertPolicies = async (req, res, next) => {
  const { type, description } = req.body;
  try {
    const TYPE = type.toUpperCase();

    const { rows } = await pool.query(
      `INSERT INTO policies (type, description) VALUES ($1, $2) ON CONFLICT (type) DO UPDATE SET description = EXCLUDED.description , updated_at = NOW() RETURNING *`,
      [TYPE, description]
    );

    return responseSender(res, 200, true, "Policy Updated Successfully", rows);
  } catch (error) {
    if (error.code == "23514") {
      return responseSender(
        res,
        400,
        false,
        "The provided type does not match the required constraints."
      );
    }
    next(error);
  }
};

// get policies
const getPolicy = async (req, res, next) => {
  const { type } = req.query;

  try {
    const TYPE = type.toUpperCase();

    const { rows, rowCount } = await pool.query(
      `SELECT * FROM policies WHERE type = $1 LIMIT 1`,
      [TYPE]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Policy Not Found");
    }

    return responseSender(res, 200, true, "Policy Found", rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertPolicies,
  getPolicy,
};
