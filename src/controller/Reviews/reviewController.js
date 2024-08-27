const pool = require("../../config/db");
const logger = require("../../config/logger");
const { suggestionSender } = require("../../services/suggestionSender");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");
const { sendPushNotif } = require("../Notifications/firbaseAdmin");
const {
  sendNotifications,
} = require("../Notifications/notificationController");

const createReview = async (req, res, next) => {
  const { user_id, reviewer_id, event_id, type, rating, comment, is_anonymus } =
    req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `INSERT INTO reviews (user_id, reviewer_id, event_id, type, rating, comment, is_anonymus) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [user_id, reviewer_id, event_id, type, rating, comment, is_anonymus]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Failed to add review");
    }

    if (type === "PROFILE" && user_id) {
      const {
        rows: [profileRating],
      } = await pool.query(
        `SELECT AVG(rating) AS average_rating 
         FROM reviews 
         WHERE user_id = $1 AND type = 'PROFILE'`,
        [user_id]
      );

      const {
        rowCount: updateCount,
        rows: [userReview],
      } = await pool.query(
        `UPDATE users 
         SET rating = $1 
         WHERE id = $2 RETURNING *`,
        [profileRating.average_rating, user_id]
      );

      if (updateCount === 0) {
        await pool.query("ROLLBACK");
        return responseSender(
          res,
          400,
          false,
          "Failed to update user's profile rating"
        );
      }

      if (parseFloat(userReview.rating) < 2.5) {
        const tips = await pool.query(`SELECT * FROM rating_suggestions`);

        await sendNotifications({
          title: "Profile Rating Degradation",
          message: "Test message",
          sender_id: reviewer_id,
          receiver_id: user_id,
          type,
          email: userReview.email,
          data: tips.rows[0],
        });
      }
    } else if (type === "EVENT" && event_id) {
      const {
        rows: [eventRating],
      } = await pool.query(
        `SELECT AVG(rating) AS average_rating 
         FROM reviews 
         WHERE event_id = $1 AND type = 'EVENT'`,
        [event_id]
      );

      const { rowCount: updateCount } = await pool.query(
        `UPDATE events 
         SET rating = $1 
         WHERE id = $2`,
        [eventRating.average_rating, event_id]
      );

      if (updateCount === 0) {
        await pool.query("ROLLBACK");
        return responseSender(
          res,
          400,
          false,
          "Failed to update event's average rating"
        );
      }
    }

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "Review added successfully", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  const {
    search,
    event_id,
    user_id,
    reviewer_id,
    type,
    page = 1,
    limit = 10,
    sortOrder = "DESC",
    sortField = "rating",
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereCondition = [];
    let queryParams = [];

    if (search) {
      whereCondition.push(`(r.comment ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    if (event_id) {
      whereCondition.push(`r.event_id = $${queryParams.length + 1}`);
      queryParams.push(event_id);
    }

    if (user_id) {
      whereCondition.push(`r.user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    if (reviewer_id) {
      whereCondition.push(`r.reviewer_id = $${queryParams.length + 1}`);
      queryParams.push(reviewer_id);
    }

    if (type) {
      whereCondition.push(`r.type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }

    let whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
    SELECT r.* , 
    json_build_object(
    'username', u.username,
    'email', u.email,
    'profile_image', u.profile_image,
    'rating', u.rating
    )
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No reviews found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM reviews r ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Reviews fetched successfully", {
      reviews: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createReview,
  getReviews,
};
