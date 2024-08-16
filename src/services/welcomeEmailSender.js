const logger = require("../config/logger");
const { transporter } = require("../config/transporter");

const welcomeEmailSender = async ({ email, subject }) => {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: `"Chatatue" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: subject,
    text: "Welcome 🎉 to our plateform 🥰",
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

module.exports = { welcomeEmailSender };
