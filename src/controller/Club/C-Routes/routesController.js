const pool = require("../../../config/db");
const logger = require("../../../config/logger");
const { pagination } = require("../../../utilities/pagination");
const { responseSender } = require("../../../utilities/responseHandlers");

const createRoute = async (req, res, next) => {
  const {
    user_id,
    club_id,
    start_loc_name,
    end_loc_name,
    start_lat,
    start_long,
    start_elevation,
    end_lat,
    end_long,
    end_elevation,
    waypoints,
  } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `INSERT INTO routes(user_id, club_id, start_loc_name, end_loc_name, start_lat,
    start_long,
    start_elevation,
    end_lat,
    end_long,
    end_elevation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        user_id,
        club_id,
        start_loc_name,
        end_loc_name,
        start_lat,
        start_long,
        start_elevation,
        end_lat,
        end_long,
        end_elevation,
      ]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        400,
        false,
        "Cannot add route due to an error"
      );
    }

    if (waypoints?.length > 0) {
      for (const waypoint of waypoints) {
        const { lat, long, elevation } = waypoint;

        await pool.query(
          `INSERT INTO waypoints (route_id, lat, long , elevation) VALUES ($1, $2, $3, $4)`,
          [rows[0].id, lat, long, elevation]
        );
      }
    }
    await pool.query("COMMIT");

    return responseSender(res, 201, true, "Route Added", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const getRoute = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT r.*, ARRAY_AGG(json_build_object('id' , w.id , 'lat' , w.lat, 'long', w.long, 'elevation', w.elevation)) AS waypoints FROM routes r LEFT JOIN waypoints w ON r.id = w.route_id WHERE r.id = $1 GROUP BY r.id`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Club route not found");
    }

    return responseSender(res, 200, true, "Club route retrieved", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getRoutes = async (req, res, next) => {
  try {
    let { page, limit, sortField, sortOrder, club_id, user_id } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 100;
    sortField = sortField || "created_at";
    sortOrder = sortOrder || "DESC";
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClauses = [];

    if (club_id) {
      whereClauses.push(`r.club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    if (user_id) {
      whereClauses.push(`r.user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    let whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT r.*, ARRAY_AGG(json_build_object('id' , w.id , 'lat' , w.lat, 'long', w.long, 'elevation', w.elevation)) AS waypoints FROM routes r LEFT JOIN waypoints w ON r.id = w.route_id  ${whereClause}  GROUP BY r.id
      ORDER BY r.${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Routes Not Found");
    }

    const countQuery = `
      SELECT COUNT(*)
      FROM routes r
      ${whereClause}
    `;
    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Routes Retrieved", {
      routes: rows,
      pagination: pagination(totalRowsResult.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  const { id } = req.params;
  const {
    club_id,
    start_loc_name,
    end_loc_name,
    start_lat,
    start_long,
    start_elevation,
    end_lat,
    end_long,
    end_elevation,
  } = req.body;

  try {
    let query = `UPDATE routes SET `;
    let index = 2;
    let values = [id];

    if (club_id) {
      query += `club_id = $${index}, `;
      values.push(club_id);
      index++;
    }

    if (start_loc_name) {
      query += `start_loc_name = $${index}, `;
      values.push(start_loc_name);
      index++;
    }

    if (end_loc_name) {
      query += `end_loc_name = $${index}, `;
      values.push(end_loc_name);
      index++;
    }

    if (start_lat) {
      query += `start_lat = $${index}, `;
      values.push(start_lat);
      index++;
    }

    if (start_long) {
      query += `start_long = $${index}, `;
      values.push(start_long);
      index++;
    }

    if (start_elevation) {
      query += `start_elevation = $${index}, `;
      values.push(start_elevation);
      index++;
    }

    if (end_lat) {
      query += `end_lat = $${index}, `;
      values.push(end_lat);
      index++;
    }

    if (end_long) {
      query += `end_long = $${index}, `;
      values.push(end_long);
      index++;
    }

    if (end_elevation) {
      query += `end_elevation = $${index} `;
      values.push(end_elevation);
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Route not found");
    }

    return responseSender(res, 200, true, "Route updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM routes WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Route not found");
    }

    return responseSender(res, 200, true, "Route deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateWayPoint = async (req, res, next) => {
  const { id } = req.params;
  const { lat, long, elevation } = req.body;

  try {
    let query = `UPDATE waypoints SET `;
    let index = 2;
    let values = [id];

    if (lat) {
      query += `lat = $${index}, `;
      values.push(lat);
      index++;
    }

    if (long) {
      query += `long = $${index}, `;
      values.push(long);
      index++;
    }

    if (elevation) {
      query += `elevation = $${index}, `;
      values.push(elevation);
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Waypoint not found");
    }

    return responseSender(res, 200, true, "Waypoint updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteWayPoint = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM waypoints WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Waypoint not found");
    }

    return responseSender(res, 200, true, "Waypoint deleted", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createRoute,
  getRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  updateWayPoint,
  deleteWayPoint,
};
