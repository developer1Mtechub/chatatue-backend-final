const pool = require("../../config/db");
const logger = require("../../config/logger");
const { eventInviteSender } = require("../../services/eventInviteSender");
const {
  uploadToCloudinary,
  deleteCloudinaryFile,
  deleteAllCloudinaryFiles,
} = require("../../utilities/cloudinary");
const { pagination } = require("../../utilities/pagination");
const { responseSender } = require("../../utilities/responseHandlers");

const createEvent = async (req, res, next) => {
  if (req?.files?.length === 0) {
    return responseSender(res, 400, false, "Please upload atleast one image");
  }

  const {
    club_id,
    name,
    description,
    event_type,
    is_public,
    is_paid,
    amount,
    start_time,
    start_date,
    end_date,
    distance,
    route_ids,
    category_ids,
    badge_ids,
    event_link,
    location,
    latitude,
    longitude,
  } = req.body;

  const user = req.user;
  const creator_id = user?.userId;

  try {
    await pool.query("BEGIN");

    const clubExists = await pool.query(
      `SELECT id FROM events WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [name]
    );

    if (clubExists.rowCount > 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        400,
        false,
        "Event with the same name already exists"
      );
    }

    let uploadedImages = [];

    if (req.files) {
      for (const file of req.files) {
        const uploadFile = await uploadToCloudinary(file.path, "Events");
        uploadedImages.push(uploadFile);
      }
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO events (
        club_id,
        creator_id,
        name,
        description,
        event_type,
        is_public,
        is_paid,
        amount,
        start_time,
        start_date,
        end_date,
        distance,
        route_ids,
        category_ids,
        badge_ids,
        event_link,
        location,
        latitude,
        longitude,
        images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 , $14, $15, $16 , $17, $18, $19, $20) RETURNING *`,
      [
        club_id,
        creator_id,
        name,
        description,
        event_type,
        is_public,
        is_paid,
        amount,
        start_time,
        start_date,
        end_date,
        distance,
        route_ids,
        category_ids,
        badge_ids,
        event_link,
        location,
        latitude,
        longitude,
        JSON.stringify(uploadedImages),
      ]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      for (const image of uploadedImages) {
        await deleteCloudinaryFile(image.public_id);
      }
      return responseSender(res, 400, false, "Failed to create event");
    }

    await pool.query("COMMIT");

    return responseSender(
      res,
      201,
      true,
      "Event created successfully",
      rows[0]
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const joinEvent = async (req, res, next) => {
  const { event_id } = req.params;
  const { userId } = req.user;

  try {
    const { rowCount: memberExists } = await pool.query(
      `SELECT * FROM event_members WHERE event_id = $1 AND user_id = $2 LIMIT 1`,
      [event_id, userId]
    );

    if (memberExists > 0) {
      return responseSender(
        res,
        400,
        false,
        "User is already a member of this event"
      );
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO event_members (event_id, user_id) VALUES ($1, $2) RETURNING *`,
      [event_id, userId]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Failed to join event");
    }

    return responseSender(
      res,
      200,
      true,
      "Successfully joined the event",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const sendEventInvite = async (req, res, next) => {
  const { event_id, email, user_id } = req.body;

  try {
    await pool.query("BEGIN");

    // Check if user is already invited to the event
    const { rows: event } = await pool.query(
      `SELECT * FROM event_invitations WHERE event_id = $1 AND user_id = $2`,
      [event_id, user_id]
    );

    if (event[0]?.status === "PENDING") {
      return responseSender(
        res,
        400,
        false,
        "User is already invited to this event"
      );
    }

    if (event[0]?.status === "ACCEPTED") {
      return responseSender(
        res,
        400,
        false,
        "User has already accepted the invite for this event"
      );
    }

    const { rows, rowCount } = await pool.query(
      `INSERT INTO event_invitations (event_id, user_id, email) VALUES ($1, $2, $3) RETURNING *`,
      [event_id, user_id, email]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Failed to send event invite");
    }

    await eventInviteSender({
      email,
      subject: "Event Invitaion",
      link: `${process.env.FRONT_URL}?invite_id=${rows[0].id}`,
    });

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      "Successfully sent event invite",
      rows[0]
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const inviteResoponse = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(`BEGIN`);

    const { rows, rowCount } = await pool.query(
      `UPDATE event_invitations SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rowCount === 0) {
      await pool.query(`ROLLBACK`);
      return responseSender(res, 404, false, "Event invite not found");
    }

    if (status === "ACCEPTED") {
      await pool.query(
        `INSERT INTO event_members (event_id, user_id) VALUES ($1, $2)`,
        [rows[0].event_id, rows[0].user_id]
      );
    }

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "Event invite updated", rows[0]);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getEventMembers = async (req, res, next) => {
  const { event_id } = req.params;
  const {
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

    if (search) {
      whereClauses.push(`u.username ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (event_id) {
      whereClauses.push(`em.event_id = $${queryParams.length + 1}`);
      queryParams.push(event_id);
    }

    const whereClauseString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT em.*, 
        json_build_object(
          'id', u.id, 
          'username', u.username, 
          'profile_image', u.profile_image, 
          'email', u.email,
          'rating' , u.rating
        ) AS member_details
      FROM event_members em
      LEFT JOIN users u ON em.user_id = u.id
      ${whereClauseString}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No event members found");
    }

    const totalRowsQuery = `
      SELECT COUNT(*) 
      FROM event_members em
      LEFT JOIN users u ON em.user_id = u.id
      ${whereClauseString}`;

    const totalRows = await pool.query(
      totalRowsQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(
      res,
      200,
      true,
      "Event members retrieved successfully",
      {
        event_members: rows,
        pagination: pagination(totalRows.rows[0].count, limit, page),
      }
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getEventInvitesByStatus = async (req, res, next) => {
  const { event_id } = req.params;
  const {
    search,
    status,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (event_id) {
      whereClauses.push(`ei.event_id = $${queryParams.length + 1}`);
      queryParams.push(event_id);
    }

    if (search) {
      whereClauses.push(`u.username ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (status) {
      whereClauses.push(`ei.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    const whereClauseString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
    SELECT ei.*, 
          json_build_object(
            'id', u.id, 
            'username', u.username, 
            'profile_image', u.profile_image,
            'email', u.email,
            'rating' , u.rating
            ) AS user
             FROM event_invitations ei
             LEFT JOIN users u ON ei.user_id = u.id
             ${whereClauseString}
             ORDER BY ${sortField} ${sortOrder}
             LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No event Invite found");
    }

    const totalRowsQuery = `
             SELECT COUNT(*) 
             FROM event_invitations ei
             LEFT JOIN users u ON ei.user_id = u.id
             ${whereClauseString}`;

    const totalRows = await pool.query(
      totalRowsQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(
      res,
      200,
      true,
      "Event invitation retrieved successfully",
      {
        event_initiations: rows,
        pagination: pagination(totalRows.rows[0].count, limit, page),
      }
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getEvent = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `
      SELECT e.*, 
             json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'profile_image', u.profile_image
                , 'rating' , u.rating
             ) AS host,
              (
                SELECT json_agg(
                  json_build_object(
                    'id', em.id,
                    'user_id', em.user_id,
                    'joined_at', em.created_at,
                    'member_details', json_build_object(
                      'id', u.id,
                      'username', u.username,
                      'profile_image', u.profile_image,
                      'email', u.email,
                      'rating' , u.rating
                    )
                  )
                )
                FROM event_members em
                LEFT JOIN users u ON em.user_id = u.id
                WHERE em.event_id = e.id
              ) AS joinees,

             (
               SELECT json_agg(a)
               FROM activities a
               WHERE a.event_id = e.id
             ) AS activities,
             (
               SELECT json_agg(mp)
               FROM meeting_points mp
               WHERE mp.event_id = e.id
             ) AS meeting_points,
             
             (
               SELECT json_agg(r)
               FROM routes r
               WHERE r.id = ANY(e.route_ids)
             ) AS routes,

             (
               SELECT json_agg(c)
               FROM category c
               WHERE c.id = ANY(e.category_ids)
             ) AS categories,
             (
               SELECT json_agg(b)
               FROM badges b
               WHERE b.id = ANY(e.badge_ids)
             ) AS badges
             
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.id
      WHERE e.id = $1
      `,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Event not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Event retrieved successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  const {
    search,
    distance,
    location,
    creator_id,
    category_id,
    start_date,
    end_date,
    start_time,
    is_public,
    is_paid,
    club_id,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const { userId } = req.user;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    const userResult = await pool.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return responseSender(res, 401, false, "Unauthorized user");
    }

    const user = userResult.rows[0];

    if (search) {
      whereClauses.push(
        `(
          e.name ILIKE $${queryParams.length + 1} OR e.description ILIKE $${
          queryParams.length + 1
        }
        )`
      );
      queryParams.push(`%${search}%`);
    }

    if (distance) {
      whereClauses.push(`
           (
            6371 * acos(
              cos(radians($${queryParams.length + 1})) 
              * cos(radians(e.latitude)) 
              * cos(radians(e.longitude) - radians($${queryParams.length + 2})) 
              + sin(radians($${queryParams.length + 1})) 
              * sin(radians(e.latitude))
            )
          ) < $${queryParams.length + 3}`);
      queryParams.push(user.lat, user.long, distance);
    }

    if (creator_id) {
      whereClauses.push(`e.creator_id = $${queryParams.length + 1}`);
      queryParams.push(creator_id);
    }

    if (category_id) {
      whereClauses.push(`$${queryParams.length + 1} = ANY(e.category_ids)`);
      queryParams.push(category_id);
    }

    if (!category_id && !search) {
      const { rows } = await pool.query(
        `SELECT sc.* FROM sub_category sc LEFT JOIN users u ON sc.id = ANY(u.interest_ids) WHERE u.id = $1`,
        [userId]
      );

      const categoryIds = rows.map((row) => row.category_id);

      if (categoryIds) {
        whereClauses.push(`e.category_ids && $${queryParams.length + 1}`);
        queryParams.push(categoryIds);
      }
    }

    if (start_date) {
      whereClauses.push(`e.start_date >= $${queryParams.length + 1}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClauses.push(`e.end_date <= $${queryParams.length + 1}`);
      queryParams.push(end_date);
    }

    if (start_time) {
      whereClauses.push(`e.start_time >= $${queryParams.length + 1}`);
      queryParams.push(start_time);
    }

    if (club_id) {
      whereClauses.push(`e.club_id = $${queryParams.length + 1}`);
      queryParams.push(club_id);
    }

    if (is_public !== undefined) {
      whereClauses.push(`e.is_public = $${queryParams.length + 1}`);
      queryParams.push(is_public);
    }

    if (is_paid !== undefined) {
      whereClauses.push(`e.is_paid = $${queryParams.length + 1}`);
      queryParams.push(is_paid);
    }

    if (location) {
      whereClauses.push(`e.location ILIKE $${queryParams.length + 1}`);
      queryParams.push(location);
    }

    const whereClauseString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT e.*, 
             json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'profile_image', u.profile_image,
               'rating' , u.rating
             ) AS host
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.id
      ${whereClauseString}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No events found");
    }

    const totalRowsQuery = `
      SELECT COUNT(*) 
      FROM events e
      LEFT JOIN users u ON e.creator_id = u.id
      ${whereClauseString}`;

    const totalRows = await pool.query(
      totalRowsQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Events retrieved successfully", {
      events: rows,
      pagination: pagination(totalRows.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const getJoinedEvents = async (req, res, next) => {
  const { userId } = req.user;

  const {
    search,
    start_date,
    end_date,
    start_time,
    is_public,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (userId) {
      whereClauses.push(`em.user_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    }

    if (search) {
      whereClauses.push(`e.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (start_date) {
      whereClauses.push(`e.start_date >= $${queryParams.length + 1}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClauses.push(`e.end_date <= $${queryParams.length + 1}`);
      queryParams.push(end_date);
    }

    if (start_time) {
      whereClauses.push(`e.start_time >= $${queryParams.length + 1}`);
      queryParams.push(start_time);
    }

    if (is_public) {
      whereClauses.push(`e.is_public = $${queryParams.length + 1}`);
      queryParams.push(is_public);
    }

    const whereClauseString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT em.*, 
             json_build_object(
               'id', e.id,
               'creator_id', e.creator_id,
               'club_id', e.club_id,
               'name', e.name,
               'description', e.description,
               'is_public', e.is_public,
               'start_date', e.start_date,
               'end_date', e.end_date,
               'start_time', e.start_time,
               'is_paid', e.is_paid,
               'amount', e.amount,
               'event_type', e.event_type,
               'images', e.images,
               'location', e.location,
               'distance', e.distance,
               'latitude', e.latitude,
               'longitude', e.longitude,
               'created_at', e.created_at,
               'updated_at', e.updated_at
             ) AS event
      FROM event_members em
      LEFT JOIN events e ON em.event_id = e.id
      ${whereClauseString}
      ORDER BY em.${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No joined events found");
    }

    const totalRowsQuery = `
      SELECT COUNT(*) 
      FROM event_members em
      LEFT JOIN events e ON em.event_id = e.id
      ${whereClauseString}`;

    const totalRows = await pool.query(
      totalRowsQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(
      res,
      200,
      true,
      "Joined events retrieved successfully",
      {
        events: rows,
        pagination: pagination(totalRows.rows[0].count, limit, page),
      }
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const userInvitaions = async (req, res, next) => {
  const { userId } = req.user;
  const {
    status,
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (status) {
      whereClauses.push(`ei.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (userId) {
      whereClauses.push(`ei.user_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    }

    if (whereClauses.length > 0) {
      whereClauses = `WHERE ${whereClauses.join(" AND ")}`;
    }

    const query = `
      SELECT ei.*, 
             u.username, 
             u.email, 
              (
               SELECT json_agg(e)
               FROM events e
               WHERE e.id = ei.event_id
             ) AS event
      FROM event_invitations ei
      LEFT JOIN users u ON ei.user_id = u.id
      ${whereClauses}
      ORDER BY ei.${sortField} ${sortOrder}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);
    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "No invitations found");
    }

    const totalRowsQuery = `
      SELECT COUNT(*)
      FROM event_invitations ei
      ${whereClauses}`;

    const totalRows = await pool.query(
      totalRowsQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(
      res,
      200,
      true,
      "Invitations retrieved successfully",
      {
        invitations: rows,
        pagination: pagination(totalRows.rows[0].count, limit, page),
      }
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  const { id } = req.params;

  const {
    name,
    description,
    event_type,
    is_public,
    is_paid,
    amount,
    start_time,
    start_date,
    end_date,
    distance,
    location,
    latitude,
    longitude,
    route_ids,
    category_ids,
    badge_ids,
    event_link,
  } = req.body;

  try {
    const fetchEvent = await pool.query(
      `SELECT * FROM events WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (fetchEvent.rowCount === 0) {
      return responseSender(res, 404, false, "Event not found");
    }

    let query = `UPDATE events SET `;
    let index = 2;
    let values = [id];

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (description) {
      query += `description = $${index}, `;
      values.push(description);
      index++;
    }

    if (event_type) {
      query += `event_type = $${index}, `;
      values.push(event_type);
      index++;
    }

    if (is_public !== undefined) {
      query += `is_public = $${index}, `;
      values.push(is_public);
      index++;
    }

    if (is_paid !== undefined) {
      query += `is_paid = $${index}, `;
      values.push(is_paid);
      index++;
    }

    if (amount) {
      query += `amount = $${index}, `;
      values.push(amount);
      index++;
    }

    if (start_time) {
      query += `start_time = $${index}, `;
      values.push(start_time);
      index++;
    }

    if (start_date) {
      query += `start_date = $${index}, `;
      values.push(start_date);
      index++;
    }

    if (end_date) {
      query += `end_date = $${index}, `;
      values.push(end_date);
      index++;
    }

    if (distance) {
      query += `distance = $${index}, `;
      values.push(distance);
      index++;
    }

    if (location) {
      query += `location = $${index}, `;
      values.push(location);
      index++;
    }

    if (latitude) {
      query += `latitude = $${index}, `;
      values.push(latitude);
      index++;
    }

    if (longitude) {
      query += `longitude = $${index}, `;
      values.push(longitude);
      index++;
    }

    if (route_ids) {
      query += `route_ids = $${index}, `;
      values.push(route_ids);
      index++;
    }

    if (category_ids) {
      query += `category_ids = $${index}, `;
      values.push(category_ids);
      index++;
    }

    if (badge_ids) {
      query += `badge_ids = $${index}, `;
      values.push(badge_ids);
      index++;
    }

    if (event_link) {
      query += `event_link = $${index}, `;
      values.push(event_link);
      index++;
    }

    if (req.file) {
      const uploadImage = await uploadToCloudinary(req.file.path, "Events");
      query += `images = jsonb_set(images, '{${
        fetchEvent?.rows[0]?.images?.length + 1
      }}', $${index}, true), `;
      values.push(JSON.stringify(uploadImage));
      index++;
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    logger.info(query);

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Event not updated");
    }

    return responseSender(
      res,
      200,
      true,
      "Event updated successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM events WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Event not found");
    }

    return responseSender(
      res,
      200,
      true,
      "Event deleted successfully",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const removeEventImages = async (req, res, next) => {
  const { publicIds, id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE events 
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
  createEvent,
  joinEvent,
  sendEventInvite,
  inviteResoponse,
  getEventMembers,
  getEventInvitesByStatus,
  getEvent,
  getEvents,
  userInvitaions,
  getJoinedEvents,
  updateEvent,
  removeEventImages,
  deleteEvent,
};
