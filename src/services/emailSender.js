const logger = require("../config/logger");
const { transporter } = require("../config/transporter");

const emailSender = async (email, title, body) => {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: `"Chatatue" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: title,
    html: `<p>Hi ${email},</p>
    <p>${body}</p>
    `,
  };

  // Sending mail
  try {
    await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully");
    return true;
  } catch (error) {
    logger.error("Error sending email:", error);
    return false;
  }
};

module.exports = { emailSender };
