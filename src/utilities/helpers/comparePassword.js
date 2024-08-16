const bcrypt = require("bcrypt");
const logger = require("../../config/logger");

const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const passwordMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return passwordMatch;
  } catch (error) {
    logger.error("Error comparing passwords:", error.stack);
    return false;
  }
};

module.exports = comparePassword;
