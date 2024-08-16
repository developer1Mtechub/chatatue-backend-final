const pool = require("../../config/db");
const logger = require("../../config/logger");
const {
  uploadToCloudinary,
  deleteCloudinaryFile,
  deleteAllCloudinaryFiles,
} = require("../../utilities/cloudinary");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createClub = async (req, res, next) => {
  const { name, description, fee, is_paid, user_id } = req.body;

  if (!req.files) {
    return responseSender(res, 422, false, "Club image is required");
  }

  const clubImagePath = req.files.map((file) => file.path);

  try {
    await pool.query("BEGIN");

    let imagesPath = [];

    for (const path of clubImagePath) {
      const uploadImage = await uploadToCloudinary(path, "Club");
      imagesPath.push(uploadImage);
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO club (name, description, fee, is_paid, user_id , images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, fee, is_paid, user_id, JSON.stringify(imagesPath)]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      for (const path of imagesPath) {
        await deleteCloudinaryFile(path.public_id);
      }
      return responseSender(res, 400, false, "Club not created");
    }

    await pool.query(
      `INSERT INTO club_members (user_id , club_id , member_role) VALUES ($1, $2, $3)`,
      [rows[0].user_id, rows[0].id, "CREATOR"]
    );

    // CREATE GROUP FOR CLUB
    const {
      rows: [group],
    } = await pool.query(
      `INSERT INTO groups (club_id, type, name, image) VALUES (
      $1, $2, $3 , $4) RETURNING *
      `,
      [rows[0].id, "CLUB", rows[0].name, imagesPath[0].secure_url]
    );

    // INSERT INTO GROUP MEMBERS
    await pool.query(
      `
      INSERT INTO group_members (user_id, group_id , role) VALUES ($1, $2, $3)
      `,
      [user_id, group.id, "CREATOR"]
    );

    await pool.query("COMMIT");

    return responseSender(res, 201, true, "Club created successfully", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    if (error.code === "23514") {
      return responseSender(res, 400, false, "Unexpected Error Occured");
    }
    logger.error(error.stack);
    next(error);
  }
};

const getClub = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      ` SELECT 

            c.*,

            json_build_object('id' , u.id , 'username' , u.username , 'profile_image', u.profile_image, 'email', u.email , 'rating' , u.rating ) AS creator,

            (
            SELECT JSON_AGG(ct)
            FROM category ct
            WHERE ct.id = ANY(c.category_ids)
            ) AS categories,
            
            (
            SELECT JSON_AGG(h)
            FROM club_highlights h
            WHERE h.club_id = c.id
            ) AS highlights,
            
            (
            SELECT JSON_AGG(r)
            FROM club_rules r
            WHERE r.club_id = c.id
            ) AS rules,
            
            (
            SELECT JSON_AGG(g)
            FROM club_fitness_goals g
            WHERE g.club_id = c.id
            ) AS goals,

            (
            SELECT JSON_AGG(e)
            FROM events e
            WHERE e.club_id = c.id
            ) AS events,
            
            (
            SELECT JSON_AGG(cm)
            FROM club_members cm
            WHERE cm.club_id = c.id
            ) AS members


          FROM club c
          LEFT JOIN users u ON u.id = c.user_id
          WHERE c.id = $1
          GROUP BY c.id , u.id 
         `,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club not found");
    }

    return responseSender(res, 200, true, "Club Info Retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getClubs = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortField = "created_at",
      sortOrder = "DESC",
      search,
      user_id,
      searcher_id,
    } = req.query;

    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`c.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    } else if (!search && !user_id) {
      if (searcher_id) {
        whereClauses.push(`EXISTS (
          SELECT 1
          FROM sub_category sc
          JOIN users ui ON  sc.id = ANY(ui.interest_ids)
          WHERE sc.category_id = ANY(c.category_ids)
          AND ui.id = $${queryParams.length + 1}
          )`);
        queryParams.push(searcher_id);
      }
    }

    if (user_id) {
      whereClauses.push(`c.user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    let whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
          SELECT 
            c.*,
             json_build_object('id' , u.id , 'username' , u.username , 'profile_image', u.profile_image, 'email', u.email , 'rating', u.rating ) AS creator,

              (
            SELECT JSON_AGG(ct)
            FROM category ct
            WHERE ct.id = ANY(c.category_ids)
            ) AS categories

              FROM club c
              LEFT JOIN users u ON u.id = c.user_id
          ${whereClause}
          GROUP BY c.id ,u.id
          ORDER BY c.${sortField} ${sortOrder} 
          LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
          
        `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Clubs Not Found");
    }

    const countQuery = `
          SELECT COUNT(*)
          FROM club c
          ${whereClause}
        `;
    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Clubs Retrieved", {
      clubs: rows,
      pagination: pagination(totalRowsResult.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateClub = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, fee, is_paid, category_ids } = req.body;

  try {
    const fetchClub = await pool.query(
      `SELECT * FROM club WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchClub.rowCount === 0) {
      return responseSender(res, 404, false, "Club not found");
    }

    let query = `UPDATE club SET `;
    let index = 2;
    let values = [id];

    if (name) {
      query += `name = $${index},`;
      values.push(name);
      index++;
    }

    if (description) {
      query += `description = $${index},`;
      values.push(description);
      index++;
    }

    if (fee) {
      query += `fee = $${index},`;
      values.push(fee);
      index++;
    }

    if (is_paid) {
      query += `is_paid = $${index},`;
      values.push(is_paid);
      index++;
    }

    if (category_ids) {
      query += `category_ids = $${index},`;
      values.push(category_ids);
      index++;
    }

    if (req.file) {
      const uploadImage = await uploadToCloudinary(req.file.path, "Club");
      query += `images = jsonb_set(images, '{${
        fetchClub.rows[0].images.length + 1
      }}', $${index}, true), `;
      values.push(JSON.stringify(uploadImage));
      index++;
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Club not updated");
    }

    return responseSender(res, 200, true, "Club updated successfully", rows[0]);
  } catch (error) {
    if (error.code === "23514") {
      return responseSender(res, 400, false, "Maximum 3 images are allowed");
    }
    logger.error(error.stack);
    next(error);
  }
};

const deleteClub = async (req, res, next) => {
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `DELETE FROM club WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        404,
        false,
        "Club not found or already deleted."
      );
    }

    for (const image of rows[0].images) {
      await deleteCloudinaryFile(image.public_id);
    }

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      "Club deleted successfully.",
      rows[0].id
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const removeClubImages = async (req, res, next) => {
  const { publicIds, id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE club 
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
  createClub,
  getClub,
  getClubs,
  deleteClub,
  updateClub,
  removeClubImages,
};
