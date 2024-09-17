const pool = require("../../config/db");
const logger = require("../../config/logger");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createFaq = async (req, res, next) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return responseSender(res, 400, false, "Question and answer are required");
  }

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO faq (question, answer) VALUES ($1, $2) RETURNING *`,
      [question, answer]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to add FAQ");
    }

    return responseSender(res, 201, true, "FAQ added successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getAllFaqs = async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereCondition = [];
    let queryParams = [];

    if (search) {
      whereCondition.push(`question ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    let whereClause =
      whereCondition.length > 0 ? `WHERE ${whereCondition.join(" AND ")}` : "";

    const query = `
        SELECT * FROM faq 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No FAQs found");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM faq ${whereClause}`
    );

    return responseSender(res, 200, true, "FAQs retrieved successfully", {
      faq: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateFaq = async (req, res, next) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  if (!question || !answer) {
    return responseSender(res, 400, false, "Question and answer are required");
  }

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE faq SET question = $1, answer = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [question, answer, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "FAQ not found");
    }

    return responseSender(res, 200, true, "FAQ updated successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteFaq = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(`DELETE FROM faq WHERE id = $1`, [
      id,
    ]);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "FAQ not found");
    }

    return responseSender(res, 200, true, "FAQ deleted successfully");
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createFaq,
  getAllFaqs,
  updateFaq,
  deleteFaq,
};
