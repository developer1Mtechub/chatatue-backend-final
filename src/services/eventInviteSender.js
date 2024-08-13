const logger = require("../config/logger");
const { transporter } = require("../config/transporter");

const eventInviteSender = async ({ email, subject, link }) => {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: `"Chatatue" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: subject,
    html: `<p>Hi ${email},</p>
    <p>You are invited to an event please click on the below button to visit</p>
    <button><a href="${link}">Click Here</a></button>
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

module.exports = { eventInviteSender };
