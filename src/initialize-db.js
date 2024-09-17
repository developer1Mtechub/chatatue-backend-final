const pool = require("./config/db");
const fs = require("fs");
const path = require("path");
const logger = require("./config/logger");

// Adjust the path to wherever your db.js is located
async function initializeDatabase() {
  // installing extension for random genrated id
  try {
    pool.connect((err, client, release) => {
      if (err) {
        logger.error(err.stack);
      } else {
        logger.info("Connected to Database Successfully");
        client.release();
      }
    });

    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    const initSql = path.join(__dirname, "models", "init.sql");
    const triggersPath = path.join(__dirname, "models", "triggers.sql");

    const init = fs.readFileSync(initSql, "utf-8");
    const trigger = fs.readFileSync(triggersPath, "utf-8");

    await pool.query(init);
    await pool.query(trigger);

    logger.info("Tables Initialized Successfully.");
  } catch (error) {
    logger.error(error.stack);
  }
}

module.exports = initializeDatabase;
