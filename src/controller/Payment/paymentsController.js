
const pool = require("../../config/db");
const logger = require("../../config/logger");
const { responseSender } = require("../../utilities/responseHandlers");
const { pagination } = require("../../utilities/pagination");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// create customer
const createPaymentIntent = async (req, res, next) => {
  const { userId } = req.user;
  const { amount } = req.body;

  try {
    const {
      rows: [senderInfo],
    } = await pool.query(`SELECT * FROM users WHERE id = $1 `, [userId]);

    let customerId = senderInfo.customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: senderInfo.email,
        name: senderInfo.name,
      });

      customerId = customer.id;

      await pool.query(`UPDATE users SET customer_id = $1 WHERE id = $2`, [
        customerId,
        userId,
      ]);
    }

    const intent = await stripe.paymentIntents.create({
      amount: parseInt(amount * 100),
      currency: "usd",
      customer: customerId,
      setup_future_usage: "off_session",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: process.env.API_VERSION_STRIPE }
    );

    return responseSender(res, 200, true, "Payment Intent Created", {
      paymentIntent: intent,
      ephemeralKey: ephemeralKey.secret,
      customerId: customerId,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const upcomingPayments = async (req, res, next) => {
  const { userId } = req.user;
  const { amount, recipient_id, transaction_type, details } = req.body;

  try {
    await pool.query("BEGIN");

    const applicationFeeAmount = Math.floor(amount * 0.1);
    const totalAmount = parseInt(amount);

    const amountAfterFee =
      parseFloat(totalAmount) - parseFloat(applicationFeeAmount);

    // add paymentData in payment history table
    const paymentData = await pool.query(
      `INSERT INTO transactions (sender_id, recipient_id, transaction_type , details) VALUES ($1, $2, $3 , $4) RETURNING *`,
      [userId, recipient_id, transaction_type, details]
    );

    if (!paymentData || paymentData.rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Failed to Add Payment Details");
    }

    const admin = await pool.query(
      `SELECT * FROM  users WHERE user_role = $1 LIMIT 1`,
      ["ADMIN"]
    );

    if (admin.rowCount > 0) {
      await pool.query(
        `UPDATE wallet SET current_balance = current_balance + $1 , total_earning = total_earning + $1 WHERE user_id = $2 RETURNING *`,
        [parseFloat(applicationFeeAmount), admin.rows[0].id]
      );
    }

    const upcomingBalances = await pool.query(
      `INSERT INTO upcoming_balances (user_id , balance) VALUES ($1, $2) RETURNING *`,
      [recipient_id, parseFloat(amountAfterFee)]
    );

    if (upcomingBalances.rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Failed to add Payment");
    }

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "Payment successfull", {
      payment_history: paymentData.rows[0],
      upcoming: upcomingBalances.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

const transferAndWithdraw = async (req, res, next) => {
  const { userId } = req.user;
  const { amount } = req.body;

  try {
    await pool.query("BEGIN");

    // Fetch user info including connected account ID
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM USERS WHERE id = $1`,
      [userId]
    );

    if (rowCount === 0 || !rows[0].connected_account_id) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "Account not found");
    }

    const { rows: wallet, rowCount: walletRowCount } = await pool.query(
      `SELECT * FROM WALLET WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (walletRowCount === 0 || amount > parseInt(wallet[0]?.current_balance)) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Insufficient balance.");
    }

    if (amount < 6) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Amount is too small.");
    }

    // Step 1: Transfer funds to the connected account
    const transfer = await stripe.transfers.create({
      amount: parseInt(amount * 100),
      currency: "usd",
      destination: rows[0].connected_account_id,
    });

    if (!transfer.id) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Failed to transfer funds.");
    }

    // Step 2: Initiate a payout to the connected account's bank account
    const payout = await stripe.payouts.create(
      {
        amount: parseInt(amount * 100),
        currency: "usd",
      },
      {
        stripeAccount: rows[0].connected_account_id,
      }
    );

    if (!payout.id) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Payment failed.");
    }

    // Update wallet balance
    await pool.query(
      `UPDATE wallet SET current_balance = current_balance - $1 WHERE user_id = $2 RETURNING *`,
      [amount, userId]
    );

    // Record the transaction
    const { rows: withdraw, rowCount: withdrawCount } = await pool.query(
      "INSERT INTO transactions (sender_id, recipient_id, transaction_type, details) VALUES ($1, $1, $2, $3) RETURNING *",
      [userId, "WITHDRAWAL", payout]
    );

    if (withdrawCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "Failed to record transaction.");
    }

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      "Payment Transfer successfully",
      withdraw[0]
    );
  } catch (error) {
    await pool.query("ROLLBACK");

    if (error?.code === "balance_insufficient") {
      return responseSender(res, 400, false, "Insufficient balance.");
    }

    if (error?.code === "amount_too_small") {
      return responseSender(res, 400, false, "Payment amount is too small.");
    }

    logger.error(error.stack);
    next(error);
  }
};

const updateWallet = async (req, res, next) => {
  const { userId } = req.user;

  try {
    await pool.query("BEGIN");

    // Fetch balances from upcoming_balances
    const { rows: balanceRows } = await pool.query(
      `SELECT id , balance FROM upcoming_balances WHERE user_id = $1 AND created_at < CURRENT_DATE - INTERVAL '7 days' `,
      [userId]
    );

    // Calculate total balance
    const totalBalance = balanceRows.reduce(
      (acc, row) => acc + parseInt(row.balance),
      0
    );

    const upcomingIds = balanceRows.map((upcoming) => {
      return upcoming.id;
    });

    if (totalBalance === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 400, false, "No balance to transfer.");
    }

    let wallet;

    // Check if user already has a wallet
    const { rowCount: walletRowCount, rows: walletRows } = await pool.query(
      `SELECT * FROM wallet WHERE user_id = $1`,
      [userId]
    );

    if (walletRowCount > 0) {
      // Update existing wallet
      const { rows: updatedWalletRows } = await pool.query(
        `UPDATE wallet 
         SET current_balance = current_balance + $1, 
             total_earning = total_earning + $1 
         WHERE user_id = $2 
         RETURNING *`,
        [totalBalance, userId]
      );

      if (updatedWalletRows.length === 0) {
        await pool.query("ROLLBACK");
        return responseSender(
          res,
          400,
          false,
          "Failed to transfer funds to wallet."
        );
      }

      wallet = updatedWalletRows[0];
    } else {
      // Create a new wallet
      const { rows: newWalletRows } = await pool.query(
        `INSERT INTO wallet (user_id, current_balance, total_earning) 
         VALUES ($1, $2, $2) 
         RETURNING *`,
        [userId, totalBalance]
      );

      if (newWalletRows.length === 0) {
        await pool.query("ROLLBACK");
        return responseSender(
          res,
          400,
          false,
          "Failed to transfer funds to wallet"
        );
      }

      wallet = newWalletRows[0];
    }

    const deleteUpcomingPayments = await pool.query(
      `DELETE FROM upcoming_balances WHERE id = ANY($1::uuid[]) RETURNING *`,
      [upcomingIds]
    );

    if (deleteUpcomingPayments.rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        400,
        false,
        "Failed to transfer funds to wallet"
      );
    }

    // Commit transaction
    await pool.query("COMMIT");

    return responseSender(
      res,
      201,
      true,
      "Payment transferred to wallet",
      wallet
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

// get user wallet
const getWallet = async (req, res, next) => {
  const { userId } = req.user;

  try {
    // check user wallet
    const { rows, rowCount } = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         w.current_balance,
         w.total_earning,
        json_build_object(
         'balance', SUM(up.balance)
         ) AS upcoming
       FROM users u
       LEFT JOIN wallet w ON u.id = w.user_id
       LEFT JOIN upcoming_balances up ON u.id = up.user_id
       WHERE u.id = $1 
       GROUP BY u.id , w.current_balance ,w.total_earning , up.balance`,
      [userId]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "User wallet empty");
    }

    return responseSender(
      res,
      200,
      true,
      "User Wallet details retrieved.",
      rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// payment history
const getPaymentHistory = async (req, res, next) => {
  const { userId } = req.user;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const sortField = req.query.sortField || "created_at";
  const sortOrder = req.query.sortOrder || "DESC";
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT 
        t.*, 
        json_build_object('username', s.username , 'email', s.email , 'profile_image' , s.profile_image) AS sender, 
        json_build_object('username', r.username , 'email', r.email , 'profile_image' , r.profile_image) AS receiver
      FROM 
        transactions t 
      LEFT JOIN 
        users s ON t.sender_id = s.id 
      LEFT JOIN 
        users r ON t.recipient_id = r.id 

      WHERE recipient_id = $1 OR sender_id = $1

      ORDER BY 
        ${sortField} ${sortOrder} 
      LIMIT 
        $2 OFFSET $3
    `;

    // Parameters for the SQL query
    const params = [userId, limit, offset];

    // Execute the query
    const paymentHistory = await pool.query(query, params);

    if (paymentHistory.rowCount === 0) {
      return responseSender(
        res,
        404,
        false,
        "Payment history not found.",
        null,
        req
      );
    }

    const historyResponse = paymentHistory.rows.map((history) => {
      return {
        ...history,
        status:
          history.recipient_id === userId &&
          history.transaction_type === "WITHDRAWL"
            ? "Outgoing"
            : history.recipient_id === userId &&
              history.transaction_type !== "WITHDRAWAL"
            ? "Incoming"
            : "Outgoing",
      };
    });

    // Count total rows, considering the receiver_id condition
    const countQuery = `SELECT COUNT(*) FROM transactions WHERE (recipient_id = $1 OR sender_id = $1)`;
    const totalRowsResult = await pool.query(countQuery, [userId]);
    const totalRows = totalRowsResult.rows[0].count;

    return responseSender(res, 200, true, "Payment history retrieved.", {
      payment_history: historyResponse,
      pagination: pagination(totalRows, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  upcomingPayments,
  transferAndWithdraw,
  updateWallet,
  getWallet,
  getPaymentHistory,
};
