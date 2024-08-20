const { Server } = require("socket.io");
const logger = require("../../config/logger");
const pool = require("../../config/db");
const { responseSender } = require("../../utilities/responseHandlers");
const { pagination } = require("../../utilities/pagination");
const { joinChatSchema } = require("../../validations/chatValidations");

//**  Get Room messages */
const getMessagesByRoom = async (roomId, user_id) => {
  try {
    // mark all messages as read
    const updateQuery =
      "UPDATE chat_messages SET is_read = true WHERE group_id = $1 AND is_read = false";
    await pool.query(updateQuery, [roomId]);

    // Get Group messages
    const query = `
      SELECT cm.* , 
      
      json_build_object(
      
       'id', s.id,
       'username', s.username,
       'email', s.email,
       'profile_image', s.profile_image) AS sender,
       
       json_build_object(
       
        'id', r.id,
        'username', r.username,
        'email', r.email,
        'profile_image', r.profile_image) AS receiver


     
      FROM chat_messages cm 

      LEFT JOIN users s ON cm.sender_id = s.id
      LEFT JOIN users r ON cm.recipient_id = r.id
      
      WHERE group_id = $1
      AND NOT ($2 = ANY(cm.deleted_by)) 
      ORDER BY created_at ASC
      
      `;
    const { rows } = await pool.query(query, [roomId, user_id]);

    return rows;
  } catch (error) {
    logger.error(error.stack);
  }
};

//** Save Message to Database */
const saveMessage = async (
  sender_id,
  recipient_id,
  group_id,
  message,
  message_time
) => {
  try {
    await pool.query(
      `INSERT INTO chat_messages (
      sender_id, recipient_id, group_id, message, message_time
    ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sender_id, recipient_id, group_id, message, message_time]
    );
  } catch (error) {
    logger.error(error.stack);
  }
};

//** Active Group For one to one chat */

const updateGroup = async (group_id) => {
  try {
    const resetQuery = `
    UPDATE groups 
    SET deleted_by = '{}' 
    WHERE id = $1
  `;
    await pool.query(resetQuery, [group_id]);
  } catch (error) {
    logger.error(error.stack);
  }
};

//** Getting all Groups */
const getChattingGroups = async (req, res, next) => {
  const { user_id } = req.params;

  const {
    page = 1,
    limit = 10,
    search = "",
    sortField = "updated_at",
    sortOrder = "ASC",
    type,
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    const whereConditions = [];
    const queryParams = [];

    if (search) {
      whereConditions.push(`g.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (user_id) {
      whereConditions.push(
        `gm.user_id = $${
          queryParams.length + 1
        } AND (g.deleted_by IS NULL OR NOT $${
          queryParams.length + 1
        } = ANY(g.deleted_by))`
      );
      queryParams.push(user_id);
    }

    if (type) {
      whereConditions.push(`g.type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
       SELECT g.*,
       
        json_build_object(
      
       'id', s.id,
       'username', s.username,
       'email', s.email,
       'profile_image', s.profile_image) AS sender,
       
       json_build_object(
       
        'id', r.id,
        'username', r.username,
        'email', r.email,
        'profile_image', r.profile_image) AS receiver
      
       
       FROM groups g

          JOIN group_members gm ON g.id = gm.group_id

         LEFT JOIN users s on g.sender_id = s.id

        LEFT JOIN users r on g.recipient_id = r.id

            
         ${whereClause} 
            
            ORDER BY ${sortField} ${sortOrder}

            LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }      `;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Groups not joined yet");
    }

    const {
      rows: [totalRows],
    } = await pool.query(
      `SELECT COUNT(*) FROM groups g 
      
      JOIN group_members gm ON g.id = gm.group_id
       
      ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Joined Groups Retrieved", {
      groups: rows,
      pagination: pagination(totalRows.count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

//** Delete Group */
const deleteGroup = async (req, res, next) => {
  const { group_id, user_id } = req.params;

  try {
    await pool.query("BEGIN");

    const updateGroupQuery = `
      UPDATE groups
      SET deleted_by = CASE
                         WHEN NOT $1 = ANY(deleted_by)
                         THEN deleted_by || $1
                         ELSE deleted_by
                       END
      WHERE id = $2
      RETURNING id;
    `;

    const {
      rows: [group],
      rowCount: groupRowCount,
    } = await pool.query(updateGroupQuery, [user_id, group_id]);

    if (groupRowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "Group not found");
    }

    const updateMessagesQuery = `
      UPDATE chat_messages
      SET deleted_by = CASE
                         WHEN NOT $1 = ANY(deleted_by)
                         THEN deleted_by || $1
                         ELSE deleted_by
                       END
      WHERE group_id = $2;
    `;

    await pool.query(updateMessagesQuery, [user_id, group_id]);

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "Group Deleted Successfully", group);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

// -------------------- Socket Initialization ------------------------

// Socket initializtion
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`User Connected : ${socket.id}`);

    //** Create new Room */
    const createRoomName = (sender_id, recipient_id) => {
      const [sender, recipient] = [sender_id, recipient_id].sort();

      return `room_${sender}_${recipient}`;
    };

    //** Join Group */
    const joinChat = async ({ sender_id, recipient_id, group_id }) => {
      try {
        let roomId;

        if (sender_id && recipient_id) {
          // Single Chatting

          const roomName = createRoomName(sender_id, recipient_id);

          const {
            rows: [room],
            rowCount,
          } = await pool.query(`SELECT * FROM groups WHERE name = $1`, [
            roomName,
          ]);

          if (rowCount === 0) {
            const {
              rows: [newRoom],
            } = await pool.query(
              `INSERT INTO groups (name , type , sender_id, recipient_id) VALUES ($1 , $2, $3, $4) RETURNING *`,
              [roomName, "PRIVATE", sender_id, recipient_id]
            );

            await Promise.all(
              [sender_id, recipient_id].map(async (id) => {
                await pool.query(
                  `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
                  [newRoom.id, id]
                );
              })
            );

            roomId = newRoom.id;
          } else {
            roomId = room.id;
          }
        } else {
          // Group Chatting

          const {
            rows: [room],
          } = await pool.query(`SELECT * FROM groups WHERE id = $1`, [
            group_id,
          ]);

          roomId = room.id;
        }

        socket.join(roomId);

        const messages = await getMessagesByRoom(roomId, sender_id);

        socket.emit("messageHistory", messages);
      } catch (error) {
        socket.emit("error", error.message);
        logger.error(error.stack);
      }
    };

    //** Send Message */
    const sendMessage = async ({
      sender_id,
      recipient_id,
      group_id,
      message,
      message_time,
    }) => {
      try {
        await updateGroup(group_id);

        await saveMessage(
          sender_id,
          recipient_id,
          group_id,
          message,
          message_time
        );

        io.to(group_id).emit("message", {
          message,
          sender_id,
          recipient_id,
          group_id,
          message_time,
        });
      } catch (error) {
        socket.emit("error", error.message);
        logger.error(error.stack);
      }
    };

    //** Delete Messages */
    const deleteMessages = async ({ message_id, group_id, user_id }) => {
      try {
        let whereConditions = [];
        let queryParams = [];

        if (message_id) {
          whereConditions.push(`id = $${queryParams.length + 1}`);
          queryParams.push(message_id);
        }

        if (group_id) {
          whereConditions.push(`group_id = $${queryParams.length + 1}`);
          queryParams.push(group_id);
        }

        let whereClause =
          whereConditions.length > 0
            ? `WHERE ${whereConditions.join(" AND ")}`
            : "";

        const query = `
    UPDATE chat_messages SET 
    deleted_by =  CASE 
                 WHEN NOT $${queryParams.length + 1} = ANY(deleted_by)
                 THEN deleted_by || $${queryParams.length + 1}
                 ELSE deleted_by 
               END

    ${whereClause} RETURNING id
    `;
        queryParams.push(user_id);

        await pool.query(query, queryParams);

        socket.emit("deleteSuccess", "Conversation Deleted");
      } catch (error) {
        socket.emit("error", error.message);
        logger.error(error.stack);
      }
    };

    //** Events */

    socket.on("joinChat", joinChat);

    socket.on("sendMessage", sendMessage);

    socket.on("deleteMessages", deleteMessages);

    socket.on("disconnect", () => {
      logger.info(`User Disconnected : ${socket.id}`);
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
  getChattingGroups,
  deleteGroup,
};
