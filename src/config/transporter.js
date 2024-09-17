const nodemailer = require("nodemailer");

module.exports.transporter = nodemailer.createTransport({
  service: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER_NAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
