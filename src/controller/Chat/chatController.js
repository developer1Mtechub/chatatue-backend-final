const { Server } = require("socket.io");
const logger = require("../../config/logger");
const pool = require("../../config/db");
const { responseSender } = require("../../utilities/responseHandlers");

// Socket initializtion
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("new-message", (data) => {
      console.log("new message");
      io.emit("message-received", data);
    });

    io.on("disconnect", (socket) => {
      console.log("A user disconnected", socket.id);
    });
  });

  return io;
};

const getChattingGroups = async (req, res, next) => {
  const { user_id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `
            
            SELECT g.* FROM groups g

            JOIN group_members gm ON g.id = gm.group_id
            
            WHERE gm.user_id = $1
            
            `,
      [user_id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Groups not joined yet");
    }

    return responseSender(res, 200, true, "Joined Groups Retrieved", rows);
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  initializeSocket,
  getChattingGroups,
};
