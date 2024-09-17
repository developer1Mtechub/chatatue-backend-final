const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createSocialLink = async (req, res, next) => {
  const { user_id, platform_name, platform_link } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO social_links (user_id, platform_name, platform_link) VALUES ($1, $2, $3) RETURNING *`,
      [user_id, platform_name, platform_link]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Social link not added");
    }

    return responseSender(res, 200, true, "Social link added", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getSocialLink = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM social_links WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Social link not found");
    }

    return responseSender(res, 200, true, "Social link retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getSocialLinks = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1000;
  const sortField = req.query.sortField || "created_at";
  const sortOrder = req.query.sortOrder || "DESC";
  const offset = (page - 1) * limit;
  const { search, user_id } = req.query;

  try {
    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`platform_name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (user_id) {
      whereClauses.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT * FROM social_links ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${
      queryParams.length + 1
    } OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Social links not found");
    }

    const countQuery = `SELECT COUNT(*) FROM social_links ${whereClause}`;

    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const totalRows = parseInt(totalRowsResult.rows[0].count, 10);

    return responseSender(res, 200, true, "Social links retrieved", {
      socialLinks: rows,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateSocialLink = async (req, res, next) => {
  const { id } = req.params;
  const { platform_name, platform_link } = req.body;

  try {
    const fetchSocialLink = await pool.query(
      `SELECT * FROM social_links WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchSocialLink.rowCount === 0) {
      return responseSender(res, 404, false, "Social link not found");
    }

    let query = `UPDATE social_links SET `;
    let index = 1;
    const values = [];

    if (platform_name) {
      query += `platform_name = $${index}, `;
      values.push(platform_name);
      index++;
    }

    if (platform_link) {
      query += `platform_link = $${index}, `;
      values.push(platform_link);
      index++;
    }

    // Remove the trailing comma and space
    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $${index} RETURNING *`;
    values.push(id);

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Social link not updated");
    }

    return responseSender(res, 200, true, "Social link updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteSocialLink = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM social_links WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Social link not deleted");
    }

    return responseSender(res, 200, true, "Social link deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createSocialLink,
  getSocialLink,
  getSocialLinks,
  updateSocialLink,
  deleteSocialLink,
};
