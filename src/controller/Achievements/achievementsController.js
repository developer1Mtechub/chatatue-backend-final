const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createEventAcheivement = async (req, res, next) => {
  const { user_id, event_id, pace, duration, calories_burnt } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO achievements 
        (user_id, event_id, pace, duration, calories_burnt) 

        VALUES

        ($1, $2, $3, $4, $5)
        
        RETURNING *`,
      [user_id, event_id, pace, duration, calories_burnt]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to add achievements");
    }

    return responseSender(
      res,
      201,
      true,
      "Achievements added successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getAchievement = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT a.*,

     json_build_object('details'  , e.*) AS event,
     json_build_object('badge_title' ,  b.badge_title , 'badge_type' , b.badge_type, 'badge_icon' , b.badge_icon) AS badge,
     json_build_object('username', u.username ,'email', u.email, 'profile_image' , u.profile_image , 'phone_no' , u.phone_no ) AS user
      
      FROM achievements a

      JOIN events e ON a.event_id = e.id 
      
      JOIN users u ON a.user_id = u.id

      LEFT JOIN badges b ON a.badge_id = b.id

      
      WHERE a.id = $1 LIMIT 1 `,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Achievement not found");
    }

    return responseSender(res, 200, true, "Achievement retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getAchievements = async (req, res, next) => {
  const {
    user_id,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "desc",
    event_id,
    search,
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereCondition = [];
    let queryParams = [];

    if (user_id) {
      whereCondition.push(`a.user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    if (event_id) {
      whereCondition.push(`a.event_id = $${queryParams.length + 1}`);
      queryParams.push(event_id);
    }

    if (search) {
      whereCondition.push(
        `e.name ILIKE $${queryParams.length + 1} OR u.username ILIKE $${
          queryParams.length + 2
        }`
      );
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `SELECT a.*,
      
      json_build_object('details'  , e.*) AS event,
      json_build_object('badge_title' ,  b.badge_title , 'badge_type' , b.badge_type, 'badge_icon' , b.badge_icon) AS badge,
      json_build_object('username', u.username ,'email', u.email, 'profile_image' , u.profile_image , 'phone_no' , u.phone_no ) AS user
      
      FROM achievements a
      
      JOIN events e ON a.event_id = e.id 
      
      JOIN users u ON a.user_id = u.id
      
      LEFT JOIN badges b ON a.badge_id = b.id
      
      ${whereClause}
      
      ORDER BY ${sortField} ${sortOrder}
      
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No achievements found", rows);
    }

    const {
      rows: [totalRows],
    } = await pool.query(
      `SELECT COUNT(*) FROM achievements a 

       JOIN events e ON a.event_id = e.id 
      
      JOIN users u ON a.user_id = u.id
      
      LEFT JOIN badges b ON a.badge_id = b.id
      
      ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Achievements retrieved", {
      achievements: rows,
      pagination: pagination(totalRows.count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateAchievement = async (req, res, next) => {
  const { id } = req.params;
  const { badge_id, event_id, user_id, pace, duration, calories_burnt } =
    req.body;

  try {
    let query = `UPDATE achievements SET `;
    let index = 2;
    let values = [id];

    if (badge_id) {
      query += `badge_id = $${index}, `;
      values.push(badge_id);
      index++;
    }

    if (event_id) {
      query += `event_id = $${index}, `;
      values.push(event_id);
      index++;
    }

    if (user_id) {
      query += `user_id = $${index}, `;
      values.push(user_id);
      index++;
    }

    if (pace) {
      query += `pace = $${index}, `;
      values.push(pace);
      index++;
    }

    if (duration) {
      query += `duration = $${index}, `;
      values.push(duration);
      index++;
    }

    if (calories_burnt) {
      query += `calories_burnt = $${index}, `;
      values.push(calories_burnt);
      index++;
    }

    query = query.replace(/,\s*$/, "");
    query += ` WHERE id = $1 RETURNING *`;

    console.log(query);

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Achievement not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Achievement updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteAchievement = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM achievements WHERE id = $1 RETURNING id `,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Achievement not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Achievement deleted successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createEventAcheivement,
  getAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement,
};
