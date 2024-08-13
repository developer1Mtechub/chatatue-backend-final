const jwt = require("jsonwebtoken");

const { responseSender } = require("../../utilities/responseHandlers.js");
const logger = require("../../config/logger.js");

const isLoggedIn = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return responseSender(res, 401, false, "Unauthorized user.");
  }

  try {
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return responseSender(res, 401, false, "Unauthorized user.");
      }
      req.user = user;
      next();
    });
  } catch (error) {
    logger.error("Error:", error.stack);
    next(error);
  }
};

module.exports = { isLoggedIn };
