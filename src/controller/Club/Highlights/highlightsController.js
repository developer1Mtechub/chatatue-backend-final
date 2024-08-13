const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const {
  uploadToCloudinary,
  deleteCloudinaryFile,
  deleteAllCloudinaryFiles,
} = require("../../../utilities/cloudinary");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createHighlight = async (req, res, next) => {
  if (req?.files?.length === 0) {
    return responseSender(res, 400, false, "Please upload atleast one image");
  }
  const { club_id, title, description } = req.body;
  const { userId } = req.user;

  try {
    await pool.query("BEGIN");

    let uploadedImages = [];

    if (req.files) {
      for (const file of req.files) {
        const image = await uploadToCloudinary(file.path, "Highlights");
        uploadedImages.push(image);
      }
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO club_highlights (club_id, user_id, title, images, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [club_id, userId, title, JSON.stringify(uploadedImages), description]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");

      for (const image of uploadedImages) {
        await deleteCloudinaryFile(image.public_id);
      }
      return responseSender(res, 400, false, "Unexpected error occurred");
    }

    await pool.query("COMMIT");

    responseSender(res, 201, true, "Highlight created successfully", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const getHighlight = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT ch.*, 
         json_build_object('username', u.username, 'email', u.email, 'profile_image', u.profile_image , 'rating' , u.rating) AS highlighted_by
         FROM club_highlights ch
         LEFT JOIN users u ON ch.user_id = u.id
         WHERE ch.id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Highlight not found");
    }

    responseSender(res, 200, true, "Highlight retrieved successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getHighlights = async (req, res, next) => {
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
        `title ILIKE $${queryParams.length + 1} OR description ILIKE $${
          queryParams.length + 1
        }`
      );
      queryParams.push(`%${search}%`);
    }

    if (whereClauses.length > 0) {
      whereClauses = `WHERE ${whereClauses.join(" AND ")}`;
    }

    const query = `SELECT ch.*, 
         json_build_object('username', u.username, 'email', u.email, 'profile_image', u.profile_image, 'rating' , u.rating)
          AS highlighted_by
         FROM club_highlights ch
         LEFT JOIN users u ON ch.user_id = u.id
          ${whereClauses} ORDER BY ${sortField} ${sortOrder}
          LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 200, true, "No highlights found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM club_highlights ${whereClauses}`,
      queryParams.slice(0, -2)
    );

    responseSender(res, 200, true, "Highlights retrieved successfully", {
      highlights: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteHighlight = async (req, res, next) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `DELETE FROM club_highlights WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Highlight not found");
    }

    if (rows[0]?.images?.length > 0) {
      for (let image of rows[0].images) {
        await deleteCloudinaryFile(image.public_id);
      }
    }

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "Highlight deleted", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const updateHighlight = async (req, res, next) => {
  const { id } = req.params;
  const { club_id, user_id, title, description } = req.body;

  try {
    const fetchHighlight = await pool.query(
      `SELECT * FROM club_highlights WHERE id = $1`,
      [id]
    );

    if (fetchHighlight.rowCount === 0) {
      return responseSender(res, 404, false, "Highlight not found");
    }

    let query = `UPDATE club_highlights SET `;
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

    if (req.file) {
      const uploadImage = await uploadToCloudinary(req.file.path, "Highlights");
      query += `images = jsonb_set(images, '{${
        fetchHighlight.rows[0].images.length + 1
      }}', $${index}, true), `;
      values.push(JSON.stringify(uploadImage));
      index++;
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Highlight not updated");
    }

    return responseSender(
      res,
      200,
      true,
      "Highlight updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const removeHighlightImages = async (req, res, next) => {
  const { publicIds, id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE club_highlights 
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

    await deleteAllCloudinaryFiles(publicIds);

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
  createHighlight,
  getHighlight,
  getHighlights,
  deleteHighlight,
  updateHighlight,
  removeHighlightImages,
};
