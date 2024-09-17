const logger = require("../config/logger");
const { transporter } = require("../config/transporter");

const suggestionSender = async ({ email, subject, data }) => {
  const year = new Date().getFullYear();

  const mailOptions = {
    from: `"Chatatue" <${process.env.EMAIL_USER_NAME}>`,
    to: email,
    subject: subject,
    html: `<p>Hi ${email},</p>
    <p>Your rating is less than 2.5. The follwing are some tips to improve your rating.</p>
    <p>${data?.title}</p>
    <p>${data?.description}</p>
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

module.exports = { suggestionSender };
