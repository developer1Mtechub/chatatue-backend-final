const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { responseSender } = require("../../../utilities/responseHandlers");
const { pagination } = require("../../../utilities/pagination");

const sendMembershipRequest = async (req, res, next) => {
  const { user_id, club_id } = req.body;

  try {
    // Check if user already has a pending request to the same club
    const existingRequest = await pool.query(
      `SELECT * FROM club_requests WHERE user_id = $1 AND club_id = $2 AND status = $3`,
      [user_id, club_id, "PENDING"]
    );

    if (existingRequest.rowCount > 0) {
      return responseSender(res, 400, false, "Request already sent");
    }

    const alreadyMember = await pool.query(
      `SELECT * FROM club_requests WHERE user_id = $1 AND club_id = $2 AND status = $3`,
      [user_id, club_id, "APPROVED"]
    );

    if (alreadyMember.rowCount > 0) {
      return responseSender(res, 400, false, "Already a member of this club");
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO club_requests (user_id, club_id) VALUES ($1, $2) RETURNING *`,
      [user_id, club_id]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Unexpected Error Occurred");
    }

    responseSender(
      res,
      200,
      true,
      "Membership Request Sent Successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getMembershipRequests = async (req, res, next) => {
  const { club_id } = req.params;
  const {
    status = "PENDING",
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    const query = `SELECT cr.*, 
                      json_build_object(
                        'id', u.id, 
                        'username', u.username, 
                        'profile_image', u.profile_image, 
                        'email', u.email,
                        'rating', u.rating
                      ) AS user_details 
               FROM club_requests cr 
               LEFT JOIN users u ON cr.user_id = u.id 
              WHERE cr.club_id = $1 AND status = $2 ORDER BY cr.${sortField} ${sortOrder} LIMIT $3 OFFSET $4`;

    const { rows, rowCount } = await pool.query(query, [
      club_id,
      status,
      limit,
      offset,
    ]);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No request found for this club");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM club_requests cm WHERE cm.club_id = $1 AND status = $2`,
      [club_id, status]
    );

    responseSender(res, 200, true, "Club requests", {
      requests: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateMembership = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE club_requests SET status = $1  WHERE id  = $2 RETURNING *`,
      [status, id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "Membership not found");
    }

    if (rowCount > 0 && status === "APPROVED") {
      await pool.query(
        `INSERT INTO club_members (user_id , club_id) VALUES ($1, $2)`,
        [rows[0].user_id, rows[0].club_id]
      );
    }

    await pool.query("COMMIT");

    responseSender(res, 200, true, "Membership Updated Successfully", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const getClubMembers = async (req, res, next) => {
  const { club_id } = req.params;
  const {
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    const query = `SELECT cm.*, 
                json_build_object(
                  'id', u.id, 
                  'username', u.username, 
                  'profile_image', u.profile_image, 
                  'email', u.email,
                  'rating', u.rating
                ) AS user_details 
         FROM club_members cm 
         LEFT JOIN users u ON cm.user_id = u.id 
        WHERE cm.club_id = $1 ORDER BY cm.${sortField} ${sortOrder} LIMIT $2 OFFSET $3`;

    const { rows, rowCount } = await pool.query(query, [
      club_id,
      limit,
      offset,
    ]);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No members found for this club");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = $1`,
      [club_id]
    );

    responseSender(res, 200, true, "Club Members", {
      members: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  const { id } = req.params;
  const { member_role } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE club_members SET member_role = $1 WHERE id = $2 RETURNING *`,
      [member_role, id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Member not found");
    }

    responseSender(res, 200, true, "Member Role Updated Successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getJoinClubs = async (req, res, next) => {
  const { user_id } = req.params;
  const {
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    const query = `
    SELECT cm.*, 
           (
             SELECT row_to_json(c)
             FROM club c
             WHERE c.id = cm.club_id
           ) as details
    FROM club_members cm
    WHERE cm.user_id = $1 
    ORDER BY cm.${sortField} ${sortOrder} 
    LIMIT $2 OFFSET $3`;

    const { rows, rowCount } = await pool.query(query, [
      user_id,
      limit,
      offset,
    ]);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No clubs found for this user");
    }

    const totalRows = await pool.query(
      `SELECT COUNT(*) FROM club_members cm WHERE cm.user_id = $1`,
      [user_id]
    );

    responseSender(res, 200, true, "Clubs Joined", {
      clubs: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const removeClubMember = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM club_members WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club member not found");
    }

    responseSender(res, 200, true, "Club member removed successfully", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  sendMembershipRequest,
  updateMembership,
  getClubMembers,
  updateMemberRole,
  getJoinClubs,
  getMembershipRequests,
  removeClubMember,
};
