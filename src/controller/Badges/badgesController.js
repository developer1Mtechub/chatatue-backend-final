const pool = require("../../config/db");
const logger = require("../../config/logger");
const {
  uploadToCloudinary,
  deleteCloudinaryFile,
  updateCloudinaryFile,
} = require("../../utilities/cloudinary");
const { responseSender } = require("../../utilities/responseHandlers");

const createBadge = async (req, res, next) => {
  if (!req?.file) {
    return responseSender(res, 400, false, "Please Select an image");
  }

  const { badge_type, amount } = req.body;
  const file = req?.file;

  try {
    const uplaodedImage = await uploadToCloudinary(file.path, "Badges");

    const { rows, rowCount } = await pool.query(
      `INSERT INTO badges (badge_icon , badge_type, amount) VALUES ($1, $2, $3) RETURNING *`,
      [uplaodedImage, badge_type, amount]
    );

    if (rowCount === 0) {
      await deleteCloudinaryFile(uplaodedImage.public_id);
      return responseSender(res, 400, false, "Failed to add badge");
    }

    return responseSender(
      res,
      201,
      true,
      "Badge created successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getBadges = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM badges`);
    return responseSender(res, 200, true, "Badges retrieved successfully", {
      badges: rows,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getBadgeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM badges WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Badge retrieved successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateBadge = async (req, res, next) => {
  const { badge_type, amount } = req.body;
  const { id } = req.params;

  try {
    const { rows: badges, rowCount: badgeCount } = await pool.query(
      `SELECT * FROM badges WHERE id = $1`,
      [id]
    );

    if (badgeCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    let query = `UPDATE badges SET `;
    let index = 2;
    let values = [id];

    if (badge_type) {
      query += `badge_type = $${index}, `;
      values.push(badge_type);
      index++;
    }

    if (amount) {
      query += `amount = $${index}, `;
      values.push(amount);
      index++;
    }

    if (req.file) {
      const updatedFile = await updateCloudinaryFile(
        req.file.path,
        badges[0].badge_icon.public_id
      );

      query += `badge_icon = $${index}, `;
      values.push(updatedFile);
      index++;
    }

    query = query.replace(/,\s*$/, "");
    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Badge updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteBadge = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM badges WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Badge not found");
    }

    // Delete the badge icon from Cloudinary
    await deleteCloudinaryFile(rows[0].badge_icon.public_id);

    return responseSender(res, 200, true, "Badge deleted successfully", {
      id: rows[0].id,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
};
