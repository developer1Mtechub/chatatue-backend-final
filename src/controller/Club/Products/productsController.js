const pool = require("../../../config/db");
const logger = require("../../../config/logger");


const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createProduct = async (req, res, next) => {
  const {
    club_id,
    title,
    description,
    sizes,
    materials,
    price,
    userId,
    images,
  } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO products (
        club_id, creator_id, title, description, sizes, materials, price , images
      ) VALUES ($1, $2, $3, $4, $5, $6 , $7, $8) RETURNING *`,
      [
        club_id,
        userId,
        title,
        description,
        sizes,
        materials,
        price,
        JSON.stringify(images),
      ]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to create product");
    }

    return responseSender(
      res,
      201,
      true,
      "Product created successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT p.* , 
      json_build_object('username' , u.username, 'email' , u.email , 'profile_image', u.profile_image, 'rating' , u.rating) AS creator
      FROM
       products p
       
       LEFT JOIN users u ON p.creator_id = u.id

       WHERE p.id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Product not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Product retrieved successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  const {
    search,
    club_id,
    creator_id,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereClause = [];
    let queryParams = [];

    if (search) {
      whereClause.push(`p.title ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (club_id) {
      whereClause.push(`p.club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    if (creator_id) {
      whereClause.push(`p.creator_id = $${queryParams.length + 1}`);
      queryParams.push(creator_id);
    }

    if (whereClause.length > 0) {
      whereClause = ` WHERE ${whereClause.join(" AND ")}`;
    }

    const query = `SELECT p.*, 
    json_build_object('username' , u.username, 'email' , u.email , 'profile_image', u.profile_image , 'rating' , u.rating) AS creator
    FROM
    products p
    LEFT JOIN users u ON p.creator_id = u.id
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 400, false, "No products found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Products retrieved", {
      products: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, sizes, materials, price, club_id, image } =
    req.body;

  try {
    const products = await pool.query(`SELECT * FROM products WHERE id = $1`, [
      id,
    ]);

    if (products.rowCount === 0) {
      return responseSender(res, 404, false, "Product not found");
    }

    let query = `UPDATE products SET `;
    let index = 2;
    let values = [id];

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

    if (sizes) {
      query += `sizes = $${index}, `;
      values.push(sizes);
      index++;
    }

    if (materials) {
      query += `materials = $${index}, `;
      values.push(materials);
      index++;
    }

    if (price) {
      query += `price = $${index}, `;
      values.push(price);
      index++;
    }

    if (club_id) {
      query += `club_id = $${index}, `;
      values.push(club_id);
      index++;
    }

    if (image) {
      query += `images = jsonb_set(images, '{${
        products.rows[0].images.length + 1
      }}', $${index}, true), `;
      values.push(JSON.stringify(image));
      index++;
    }

    query = query.replace(/,\s*$/, "");
    query += ` WHERE id = $1 RETURNING *`;

    logger.info(query);

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Product not found");
    }

    return responseSender(res, 200, true, "Product Updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING id`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Product not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Product deleted successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const removeProductImages = async (req, res, next) => {
  const { publicIds, id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE products 
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
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  removeProductImages,
};
