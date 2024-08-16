const winston = require("winston");

const custom = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message }) => {
    if (typeof message === "object") {
      // For objects, log as JSON
      return ` ${level}: ${JSON.stringify(message, null, 2)}`;
    } else {
      // For non-objects, use the default format
      return ` ${level}: ${message}`;
    }
  })
);

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(winston.format.simple(), custom),
    }),
  ],
});

module.exports = logger;
