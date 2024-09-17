const { Pool } = require("pg");
const logger = require("./logger");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err.stack);
  process.exit(-1);
});

module.exports = pool;
