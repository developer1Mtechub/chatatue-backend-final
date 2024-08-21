const pool = require("../../config/db");
const logger = require("../../config/logger");
const { responseSender } = require("../../utilities/responseHandlers");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createConnectedAccount = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM USERS WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "User not found.");
    }

    const result = await stripe.accounts.create({
      type: "standard",
      country: "US",
      email: rows[0].email,
    });

    if (result) {
      await pool.query(
        "UPDATE users SET connected_account_id = $1 WHERE id = $2",
        [result.id, userId]
      );
      responseSender(res, 200, true, "Account created successfully", result);
    } else {
      responseSender(res, 500, false, "Failed to create connected account.");
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const createAccountLink = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM USERS WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (rowCount === 0 || !rows[0].connected_account_id) {
      return responseSender(
        res,
        404,
        false,
        "Account not found or don't have connected account id"
      );
    }

    const result = await stripe.accountLinks.create({
      account: rows[0].connected_account_id,
      refresh_url: `${process.env.FRONT_URL}`,
      return_url: `${process.env.FRONT_URL}`,
      type: "account_onboarding",
      collection_options: {
        fields: "eventually_due",
        future_requirements: "include",
      },
    });

    if (result) {
      responseSender(
        res,
        200,
        true,
        "Account link created successfully",
        result
      );
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const checkRequirements = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM USERS WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (rowCount === 0 || !rows[0].connected_account_id) {
      return responseSender(
        res,
        404,
        false,
        "Account not found or don't have connected account id"
      );
    }

    const account = await stripe.accounts.retrieve(
      rows[0].connected_account_id
    );

    // Make sure we have an account object and requirements before proceeding
    if (!account || !account.requirements) {
      return responseSender(
        res,
        400,
        false,
        "Account or account requirements are not available"
      );
    }

    // Check each field to ensure it's not null before trying to access its properties
    const requirements = account.requirements;
    const result = {
      current_deadline: requirements.current_deadline,
      currently_due: requirements.currently_due || [],
      disabled_reason: requirements.disabled_reason,
      errors: requirements.errors || [],
      eventually_due: requirements.eventually_due || [],
      past_due: requirements.past_due || [],
      pending_verification: requirements.pending_verification || [],
    };
    // Check if all the requirements are empty or null
    const requirementCompleted =
      result.current_deadline === null &&
      result.currently_due.length === 0 &&
      result.disabled_reason === null &&
      result.errors.length === 0 &&
      result.eventually_due.length === 0 &&
      result.past_due.length === 0 &&
      result.pending_verification.length === 0;

    if (requirementCompleted) {
      await pool.query(
        `UPDATE USERS SET is_requirement_completed = $1 WHERE id = $2`,
        [true, userId]
      );
      return responseSender(
        res,
        200,
        true,
        "Account Requirements are completed"
      );
    } else {
      return responseSender(
        res,
        400,
        false,
        "Account Requirements are not completed"
      );
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  createConnectedAccount,
  createAccountLink,
  checkRequirements,
};
