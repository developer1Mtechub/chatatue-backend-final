const pool = require("../../config/db");
const logger = require("../../config/logger");
const { suggestionSender } = require("../../services/suggestionSender");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");
const { sendPushNotif } = require("./firbaseAdmin");

// const sendNotifications = async (req, res, next) => {
//   const { title, message, sender_id, receiver_id, type } = req.body;

//   try {
//     await pool.query("BEGIN");

//     const {
//       rows: [recipent],
//     } = await pool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [
//       receiver_id,
//     ]);

//     const { rows, rowCount } = await pool.query(
//       `INSERT INTO notifications (title , message, sender_id, receiver_id, type) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
//       [title, message, sender_id, receiver_id, type]
//     );

//     if (rowCount === 0) {
//       await pool.query("ROLLBACK");
//       return responseSender(res, 400, false, "Failed to send notification");
//     }

//     if (recipent.device_id) {
//       await sendPushNotif(recipent?.device_id, title, message);
//     }

//     await pool.query("COMMIT");

//     return responseSender(
//       res,
//       201,
//       true,
//       "Notification sent successfully",
//       rows[0]
//     );
//   } catch (error) {
//     await pool.query("ROLLBACK");
//     logger.error(error.stack);
//     next(error);
//   }
// };

const sendNotifications = async ({
  title,
  message,
  sender_id,
  receiver_id,
  type,
  email,
  data,
}) => {
  // const { title, message, sender_id, receiver_id, type } = req.body;

  try {
    await pool.query("BEGIN");

    const {
      rows: [recipent],
    } = await pool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [
      receiver_id,
    ]);

    const { rowCount } = await pool.query(
      `INSERT INTO notifications (title , message, sender_id, receiver_id, type) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, message, sender_id, receiver_id, type]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
    }

    if (recipent.device_id) {
      await sendPushNotif(recipent.device_id, title, message);
    }

    await suggestionSender({
      email: email,
      subject: "Profile Rating Degradation",
      data: data,
    });

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
  }
};

const getNotifications = async (req, res, next) => {
  const {
    search,
    sender_id,
    receiver_id,
    type,
    page = 1,
    limit = 10,
    sortOrder = "DESC",
    sortField = "created_at",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereCondition = [];
    let queryParams = [];

    if (search) {
      whereCondition.push(
        `title ILIKE $${queryParams.length + 1} OR message ILIKE $${
          queryParams.length + 1
        }`
      );
      queryParams.push(`%${search}%`);
    }

    if (sender_id) {
      whereCondition.push(`sender_id = $${queryParams.length + 1}`);
      queryParams.push(sender_id);
    }

    if (receiver_id) {
      whereCondition.push(`receiver_id = $${queryParams.length + 1}`);
      queryParams.push(receiver_id);
    }

    if (type) {
      whereCondition.push(`type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }

    let whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
    
    SELECT * FROM notifications ${whereClause} 
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};
    `;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No notifications found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM notifications ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Notification Retreived", {
      notifications: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rowCount, rows } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 RETURNING id`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Notification not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Notification deleted successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  sendNotifications,
  getNotifications,
  deleteNotification,
};
