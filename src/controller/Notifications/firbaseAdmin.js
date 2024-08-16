const firbase = require("firebase-admin");

const serviceAccount = require("./serviceAccount.json");
const logger = require("../../config/logger");

firbase.initializeApp({
  credential: firbase.credential.cert(serviceAccount),
});

module.exports.sendPushNotif = async (token, title, body) => {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token,
    };

    const response = await firbase.messaging().send(message);
    logger.info(`Successfully sent message: ${response}`);
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
};
