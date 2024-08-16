require("dotenv").config();
const app = require("./src/app");
const logger = require("./src/config/logger");
const { initializeSocket } = require("./src/controller/Chat/chatController");
const initializeDatabase = require("./src/initialize-db");
const { createServer } = require("http");

const PORT = process.env.P_PORT || 9000;
const socketServer = createServer(app);

initializeSocket(socketServer);
// Server listening
let server;
initializeDatabase().then(() => {
  server = socketServer.listen(PORT, () => {
    logger.info(`Server Running at ${PORT}...`);
  });
});

// Server Error handling
const exitHandler = () => {
  if (server) {
    logger.error("Server Closed.");
    process.exit(1);
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error.stack);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
