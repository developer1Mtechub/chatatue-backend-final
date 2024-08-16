const logger = require("../config/logger");
const { transporter } = require("../config/transporter");

const verifyEmailSender = async ({ email, subject, otp, username }) => {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: `"Chatatue" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: subject,
    html: `<p>Hi ${username},</p>
    <p>This is a one-time password (OTP) for your Chatatue account verification:</p>
    <h2>${otp}</h2>`,
  };

  // Sending mail
  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully");
    return true;
  } catch (error) {
    logger.error("Error sending email:", error.stack);
    return false;
  }
};

module.exports = { verifyEmailSender };
