const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createContactQuery = async (req, res, next) => {
  const { name, email, message } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO contact_queries (name, email, message) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, message]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to contact");
    }

    return responseSender(res, 200, true, "Contacted successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateContactStatus = async (req, res, next) => {
  const { id, status } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE contact_queries SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (rowCount === 0) {
      return responseSender(res, 404, false, "Contact not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Contact status updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getAllContacts = async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
    search,
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereCondition = [];
    let queryParams = [];

    if (search) {
      whereCondition.push(
        `name ILIKE $${queryParams.length + 1} OR email ILIKE $${
          queryParams.length + 1
        } OR message ILIKE $${queryParams.length + 1}`
      );
      queryParams.push(`%${search}%`);
    }

    let whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
    SELECT * FROM contact_queries 
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};

    `;

    queryParams.push(limit, offset);

    const { rows } = await pool.query(query, queryParams);

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM contact_queries ${whereClause}`
    );

    return responseSender(res, 200, true, "Contacts fetched successfully", {
      contacts: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM contact_queries WHERE id = $1 RETURNING id`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Contact not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Contact deleted successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createContactQuery,
  updateContactStatus,
  getAllContacts,
  deleteContact,
};
