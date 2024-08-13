const jwt = require("jsonwebtoken");
const logger = require("../../config/logger");

const generateToken = async (payload, secret) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      secret,

      (error, token) => {
        if (error) {
          logger.error(error.stack);
          reject(error);
        } else {
          resolve(token);
        }
      }
    );
  });
};

module.exports = generateToken;
