const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createPost = async (req, res, next) => {
  const { club_id, title, description, tag, userId, images } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `INSERT INTO club_posts (club_id, user_id, title, description, tag , images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [club_id, userId, title, description, tag, JSON.stringify(images)]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");

      return responseSender(res, 400, false, "Unexpected error occured");
    }

    await pool.query("COMMIT");

    responseSender(res, 201, true, "Post created successfully", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");

    if (error.code === "23514") {
      return responseSender(
        res,
        400,
        false,
        "Minimum one and Maximum five images are allowed"
      );
    }

    logger.error(error.stack);
    next(error);
  }
};

const getPost = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT cp.*,
       json_build_object('username', u.username, 'email', u.email, 'profile_image', u.profile_image, 'rating' , u.rating)
       AS posted_by 
       FROM club_posts cp
      LEFT JOIN  users u ON cp.user_id = u.id
      WHERE cp.id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Post not found");
    }

    responseSender(res, 200, true, "Post retrieved successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  const {
    club_id,
    user_id,
    search,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  try {
    let whereClauses = [];
    let queryParams = [];

    if (club_id) {
      whereClauses.push(`club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    if (user_id) {
      whereClauses.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    if (search) {
      whereClauses.push(
        `(title ILIKE $${queryParams.length + 1} OR description ILIKE $${
          queryParams.length + 1
        } OR tag ILIKE $${queryParams.length + 1})`
      );
      queryParams.push(`%${search}%`);
    }

    if (whereClauses?.length > 0) {
      whereClauses = `WHERE ${whereClauses.join(" AND ")}`;
    }

    const query = `SELECT cp.*,
       json_build_object('username', u.username, 'email', u.email, 'profile_image', u.profile_image, 'rating' , u.rating)
       AS posted_by 
       FROM club_posts cp
      LEFT JOIN  users u ON cp.user_id = u.id ${whereClauses} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No posts found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM club_posts ${whereClauses}`,
      queryParams.slice(0, -2)
    );

    responseSender(res, 200, true, "Posts retrieved successfully", {
      posts: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `DELETE FROM club_posts WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Post not found");
    }

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "Post Deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  const { id } = req.params;
  const { club_id, user_id, title, description, tag, image } = req.body;

  try {
    const fetchPosts = await pool.query(
      `SELECT * FROM club_posts WHERE id = $1`,
      [id]
    );

    if (fetchPosts.rowCount === 0) {
      return responseSender(res, 404, false, "Post not found");
    }

    let query = `UPDATE club_posts SET `;
    let index = 2;
    let values = [id];

    if (club_id) {
      query += `club_id = $${index}, `;
      values.push(club_id);
      index++;
    }

    if (user_id) {
      query += `user_id = $${index}, `;
      values.push(user_id);
      index++;
    }

    if (title) {
      query += `title = $${index}, `;
      values.push(title);
      index++;
    }

    if (description) {
      query += `description = $${index}, `;
      values.push(description);
      index++;
    }

    if (tag) {
      query += `tag = $${index}, `;
      values.push(tag);
    }

    if (image) {
      query += `images = jsonb_set(images, '{${
        fetchPosts.rows[0].images.length + 1
      }}', $${index}, true), `;
      values.push(JSON.stringify(image));
      index++;
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Post not updated");
    }

    return responseSender(res, 200, true, "Post updated successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const removePostImages = async (req, res, next) => {
  const { publicIds, id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE club_posts 
         SET images = (
           SELECT jsonb_agg(image) AS images
           FROM jsonb_array_elements(images) AS image
           WHERE NOT (image->>'public_id' = ANY($1))
         )
         WHERE id = $2
         RETURNING *`,
      [publicIds, id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        400,
        false,
        `${
          publicIds.length === 1 ? "Image not Deleted" : "Images not deleted"
        }`,
        null,
        req
      );
    }

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      `${publicIds.length === 1 ? "Image  Deleted" : "Images Deleted"}`,
      rows
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createPost,
  getPost,
  getPosts,
  deletePost,
  updatePost,
  removePostImages,
};
