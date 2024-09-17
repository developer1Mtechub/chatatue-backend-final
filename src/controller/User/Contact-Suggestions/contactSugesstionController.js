const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createContactList = async (req, res, next) => {
  const { user_id, contact_list } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO contact_suggestions (user_id, contact_list) 
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE 
         SET contact_list = EXCLUDED.contact_list, 
             updated_at = NOW()
         RETURNING *;`,
      [user_id, contact_list]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "User Contacts not Added");
    }

    return responseSender(res, 201, true, "User Contacts Added", rows);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getUserContactList = async (req, res, next) => {
  const {
    limit = 10,
    page = 1,
    sortField = "updated_at",
    sortOrder = "desc",
  } = req.query;
  const offset = (page - 1) * limit;

  const { user_id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `
            SELECT u.id, u.username, u.email , u.phone_no , u.profile_image FROM users u 
            JOIN contact_suggestions cs ON u.phone_no = ANY(cs.contact_list)
            WHERE cs.user_id = $1
            
            ORDER BY cs.${sortField} ${sortOrder}
            
            LIMIT $2 OFFSET $3
            
            `,
      [user_id, limit, offset]
    );

    if (rowCount === 0) {
      return responseSender(res, 200, false, "No Contacts found for this user");
    }

    const {
      rows: [totalRows],
    } = await pool.query(
      `SELECT COUNT(*) FROM users u 
            JOIN contact_suggestions cs ON u.phone_no = ANY(cs.contact_list)
            WHERE cs.user_id = $1`,
      [user_id]
    );

    return responseSender(res, 200, true, "Contacts list retrieved", {
      contacts: rows,
      pagination: pagination(totalRows.count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createContactList,
  getUserContactList,
};
