const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const followUser = async (req, res, next) => {
  const { follower_id, followed_id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rowCount: followerCount } = await pool.query(
      `SELECT * FROM followers WHERE follower_id = $1 AND followed_id = $2 LIMIT 1`,
      [follower_id, followed_id]
    );

    if (followerCount > 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        409,
        false,
        "You are already following this user."
      );
    }

    const {
      rows: [follower],
      rowCount,
    } = await pool.query(
      `INSERT INTO followers (follower_id, followed_id) VALUES ($1, $2) RETURNING *`,
      [follower_id, followed_id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 500, false, "Failed to follow user.");
    }

    await pool.query(
      `UPDATE users SET total_followers = total_followers + 1 WHERE id = $1`,
      [followed_id]
    );

    await pool.query(
      `UPDATE users SET total_following = total_following + 1 WHERE id = $1`,
      [follower_id]
    );

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      "User followed successfully.",
      follower
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  const { follower_id, followed_id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rowCount: followerCount } = await pool.query(
      `SELECT * FROM followers WHERE follower_id = $1 AND followed_id = $2 LIMIT 1`,
      [follower_id, followed_id]
    );

    if (followerCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        404,
        false,
        "You are not following this user."
      );
    }

    const {
      rows: [follower],
      rowCount,
    } = await pool.query(
      `DELETE FROM followers WHERE follower_id = $1 AND followed_id = $2 RETURNING *`,
      [follower_id, followed_id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 500, false, "Failed to unfollow user.");
    }

    await pool.query(
      `UPDATE users SET total_followers = total_followers - 1 WHERE id = $1`,
      [followed_id]
    );

    await pool.query(
      `UPDATE users SET total_following = total_following - 1 WHERE id = $1`,
      [follower_id]
    );

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      "User unfollowed successfully.",
      follower
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const getFollowersList = async (req, res, next) => {
  const {
    userId,
    type,
    search,
    sortField = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;

  if ([userId, type].some((param) => !param)) {
    return responseSender(
      res,
      422,
      false,
      "userId and type are required query parameters."
    );
  }

  try {
    let whereCondition = [];
    let queryParams = [];

    if (type === "followers") {
      whereCondition.push(`f.followed_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    } else if (type === "following") {
      whereCondition.push(`f.follower_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    } else {
      return responseSender(
        res,
        400,
        false,
        "Invalid type parameter. Use 'followers' or 'following'"
      );
    }

    if (search) {
      whereCondition.push(`u.username ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    let whereClause =
      whereCondition.length > 0 ? ` WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
          SELECT
              f.*,
              json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'profile_image', u.profile_image,
                  'email', u.email
              ) AS user
          FROM
              followers f
          JOIN
              users u ON ${
                type === "followers"
                  ? "f.follower_id = u.id"
                  : "f.followed_id = u.id"
              }
         ${whereClause}
          ORDER BY
              ${sortField} ${sortOrder}
          LIMIT
              $${queryParams.length + 1}
          OFFSET
              $${queryParams.length + 2}
      `;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(
        res,
        404,
        false,
        `${type.charAt(0).toUpperCase() + type.slice(1)} list is empty.`
      );
    }

    const {
      rows: [totalRows],
    } = await pool.query(
      `SELECT COUNT(*) FROM followers f
        
        JOIN 
            users u ON 
         ${
           type === "followers"
             ? "f.follower_id = u.id"
             : "f.followed_id = u.id"
         }
         ${whereClause}
        `,
      queryParams.slice(0, -2)
    );

    const followType = type.charAt(0).toUpperCase() + type.slice(1);

    return responseSender(
      res,
      200,
      true,
      `${followType} list fetched successfully.`,
      {
        followType: rows,
        pagination: pagination(totalRows.count, limit, page),
      }
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = { followUser, unfollowUser, getFollowersList };
