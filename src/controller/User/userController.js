const pool = require("../../config/db");
const logger = require("../../config/logger");
const { verifyEmailSender } = require("../../services/verifyEmailSender");
const { welcomeEmailSender } = require("../../services/welcomeEmailSender");
const {
  updateCloudinaryFile,
  uploadToCloudinary,
  deleteAllCloudinaryFiles,
} = require("../../utilities/cloudinary");
const comparePassword = require("../../utilities/helpers/comparePassword");
const generatePasswordHash = require("../../utilities/helpers/generateHashedPassword");
const generateToken = require("../../utilities/helpers/generateToken");
const { pagination } = require("../../utilities/pagination");

const { responseSender } = require("../../utilities/responseHandlers");

// email signup
async function handlePhoneSignUp(email, password, device_id, signup_type) {
  // Hash the password
  const hashedPassword = await generatePasswordHash(password);

  // Create the new user
  const newUser = await pool.query(
    `INSERT INTO users (email,password,signup_type,device_id ) VALUES ($1,$2,$3,$4) RETURNING *`,
    [email, hashedPassword, signup_type, device_id]
  );

  if (newUser) {
    return { success: true, user: newUser.rows[0] };
  }
}

// google signup
async function handleGoogleSignup(
  email,
  google_accessToken,
  device_id,
  signup_type
) {
  const registerQuery =
    "INSERT INTO users (email, signup_type , google_access_token, device_id) VALUES ($1,$2,$3,$4) RETURNING *";
  const registeredUser = await pool.query(registerQuery, [
    email,
    signup_type,
    google_accessToken,
    device_id,
  ]);

  return { success: true, user: registeredUser.rows[0] };
}

// apple signup
async function handleAppleSignup(
  email,
  apple_accessToken,
  device_id,
  signup_type
) {
  const registerQuery =
    "INSERT INTO users (email, signup_type , apple_access_token, device_id) VALUES ($1,$2,$3,$4) RETURNING *";
  const registeredUser = await pool.query(registerQuery, [
    email,
    signup_type,
    apple_accessToken,
    device_id,
  ]);

  return { success: true, user: registeredUser.rows[0] };
}

// create user
const createUser = async (req, res, next) => {
  const {
    email,
    password,
    signup_type,
    device_id,
    google_accessToken,
    apple_accessToken,
  } = req.body;

  try {
    const { rowCount } = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (rowCount > 0) {
      return responseSender(
        res,
        409,
        false,
        "User with this email already exists."
      );
    }

    let user;
    if (signup_type === "EMAIL") {
      // Email signup
      const signupResult = await handlePhoneSignUp(
        email,
        password,
        device_id,
        signup_type
      );

      if (!signupResult.success) {
        return responseSender(res, 400, false, signupResult.message);
      }

      user = signupResult.user;

      const token = await generateToken(
        {
          userId: user.id,
          userEmail: user.email,
        },
        process.env.JWT_SECRET
      );

      // send welcome mail
      // await welcomeEmailSender({
      //   email,
      //   subject: "Welcome To Chatatue",
      // });

      return responseSender(res, 201, true, "Signup Success", {
        ...user,
        authToken: token,
      });
    } else if (signup_type === "GOOGLE") {
      // google signup
      const googleSignup = await handleGoogleSignup(
        email,
        google_accessToken,
        device_id,
        signup_type
      );

      if (!googleSignup.success) {
        return responseSender(res, 400, false, googleSignup.message);
      }

      user = googleSignup.user;

      // generating token
      const token = await generateToken(
        {
          userId: user.id,
          userEmail: user.email,
        },
        process.env.JWT_SECRET
      );

      // send welcome mail
      // await welcomeEmailSender({
      //   email,
      //   subject: "Welcome To Chatatue",
      // });

      return responseSender(res, 201, true, "Signup Success.", {
        ...user,
        authToken: token,
      });
    } else if (signup_type === "APPLE") {
      const appleSignup = await handleAppleSignup(
        email,
        apple_accessToken,
        device_id,
        signup_type
      );

      if (!appleSignup.success) {
        return responseSender(res, 400, false, appleSignup.message);
      }

      user = appleSignup.user;

      // generate token
      const token = await generateToken(
        {
          userId: user.id,
          userEmail: user.email,
        },
        process.env.JWT_SECRET
      );

      // send welcome mail
      // await welcomeEmailSender({
      //   email,
      //   subject: "Welcome To Chatatue",
      // });

      return responseSender(res, 201, true, "Signup Success", {
        ...user,
        authToken: token,
      });
    } else {
      return responseSender(res, 400, false, "Invalid signup type");
    }
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// login user
const loginUser = async (req, res, next) => {
  const {
    email,
    password,
    signup_type,
    device_id,
    google_accessToken,
    apple_accessToken,
  } = req.body;

  try {
    if (email) {
      const { rows, rowCount } = await pool.query(
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email]
      );

      if (rowCount === 0) {
        return responseSender(
          res,
          400,
          false,
          "Invalid Credentials. Please try again.",
          null,
          req
        );
      }

      // check if user blocked
      const { rowCount: blockUser } = await pool.query(
        `SELECT * FROM users WHERE email = $1 AND block_status = $2 LIMIT 1`,
        [email, true]
      );

      if (blockUser > 0) {
        return responseSender(
          res,
          400,
          false,
          "Your account has been blocked. Please contact admin.",
          null,
          req
        );
      }

      // check if user delete his account
      const { rowCount: deleteUser } = await pool.query(
        `SELECT * FROM users WHERE email = $1 AND account_delete_status = $2 LIMIT 1`,
        [email, true]
      );

      if (deleteUser > 0) {
        return responseSender(
          res,
          400,
          false,
          "This Account has been deleted.",
          null,
          req
        );
      }
    }

    let user;
    // Handle login based on signup_type
    switch (signup_type) {
      case "EMAIL":
        const { rows, rowCount } = await pool.query(
          `SELECT * FROM users WHERE email = $1 LIMIT 1`,
          [email]
        );

        if (rowCount === 0) {
          return responseSender(
            res,
            400,
            false,
            "Invalid Credentials. Please try again.",
            null,
            req
          );
        }

        // Compare hashed password
        const passwordMatch = await comparePassword(password, rows[0].password);
        if (!passwordMatch) {
          return responseSender(
            res,
            400,
            false,
            "Invalid Credentials. Please try again.",
            null,
            req
          );
        }

        await pool.query(`UPDATE users SET device_id = $1 WHERE email = $2`, [
          device_id,
          email,
        ]);

        user = rows[0];
        break;

      case "GOOGLE":
        const updatetokenQuery =
          "UPDATE users SET google_access_token  = $1 , device_id = $2 WHERE email = $3 AND signup_type = $4 RETURNING *";
        const { rows: googleRows, rowCount: googleRowCount } = await pool.query(
          updatetokenQuery,
          [google_accessToken, device_id, email, signup_type]
        );

        if (googleRowCount === 0) {
          return responseSender(
            res,
            400,
            false,
            "Invalid Credentials.",
            null,
            req
          );
        }

        user = googleRows[0];
        break;

      case "APPLE":
        const { rows: appleRows, rowCount: appleRowCount } = await pool.query(
          "UPDATE users SET apple_access_token  = $1 , device_id = $2 WHERE email = $3 AND signup_type = $4 RETURNING *",
          [apple_accessToken, device_id, email, signup_type]
        );

        if (appleRowCount === 0) {
          return responseSender(
            res,
            400,
            false,
            "Invalid Credentials",
            null,
            req
          );
        }
        user = appleRows[0];
        break;

      default:
        return responseSender(
          res,
          400,
          false,
          "Invalid Login_Type.",
          null,
          req
        );
    }

    // Generating token
    const token = await generateToken(
      {
        userId: user.id,
        userEmail: user.email,
      },
      process.env.JWT_SECRET
    );

    return responseSender(res, 200, true, "Login Success.", {
      ...user,
      authToken: token,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// verify email
const verifyEmail = async (req, res, next) => {
  const { email } = req.body;

  try {
    // check user existence
    const { rowCount, rows } = await pool.query(
      `SELECT * FROM users WHERE email =$1 LIMIT 1`,
      [email]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Email not exist");
    }

    // Generating OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Update user
    const updateQuery = `UPDATE users SET otp = $1 , otp_expiry = NOW() + INTERVAL '5 minute'::INTERVAL
      WHERE email = $2 RETURNING *`;
    const updatedQueryResult = await pool.query(updateQuery, [otp, email]);

    if (!updatedQueryResult || updatedQueryResult.rowCount === 0) {
      return responseSender(res, 400, false, "Otp Not Sent.");
    }

    // Sending OTP with email
    const info = await verifyEmailSender({
      email,
      subject: "Verify Email",
      otp: otp,
      username: rows[0].username || rows[0].email,
    });

    if (!info) {
      return responseSender(res, 400, false, "OTP not sent.");
    }

    return responseSender(res, 200, true, "OTP sent successfully", {
      id: updatedQueryResult.rows[0].id,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// verify otp
const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // checking otp
    const otpQuery =
      "SELECT * FROM users WHERE email = $1 AND otp = $2 AND otp_expiry > NOW()";
    const otpCheck = await pool.query(otpQuery, [email, otp]);

    if (otpCheck.rows.length === 0) {
      await pool.query(
        `UPDATE users SET otp = null AND otp_expiry = null WHERE email = $1`,
        [email]
      );
      return responseSender(res, 400, false, "Invalid or expired OTP");
    }

    await pool.query(
      `UPDATE users SET otp = null AND otp_expiry = null WHERE email = $1`,
      [email]
    );

    return responseSender(res, 200, true, "OTP Verified.", {
      id: otpCheck.rows[0].id,
      email: otpCheck.rows[0].email,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const { id } = req.params;

  try {
    if (!password) {
      return responseSender(res, 400, false, "Password is required.");
    }

    // hashing new password
    const hash = await generatePasswordHash(password);

    // updating user password
    const passQuery =
      "UPDATE users SET password = $1  WHERE id = $2 RETURNING *";
    const updatedPassQuery = await pool.query(passQuery, [hash, id]);

    if (!updatedPassQuery) {
      return responseSender(res, 400, false, "Error in resetting password.");
    }

    // send success response
    return responseSender(
      res,
      200,
      true,
      "Password reset Success",
      updatedPassQuery.rows[0]
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// update user account
const updateUserAccount = async (req, res, next) => {
  const {
    username,
    bio,
    gender,
    age,
    block_status,
    phone_no,
    account_delete_status,
    running_experience_level_id,
    fitness_goal_ids,
    social_preferences_id,
    running_time_id,
    social_link_ids,
    lat,
    long,
    isPublicView,
    interest_ids,
  } = req.body;
  const { id } = req.params;

  try {
    await pool.query("BEGIN");

    const { rows: userRows, rowCount: userCount } = await pool.query(
      `SELECT * FROM users WHERE id =$1 LIMIT 1`,
      [id]
    );

    if (userCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "User not found");
    }

    let query = `UPDATE users SET `;
    let index = 2;
    let values = [id];

    if (username) {
      query += `username = $${index},`;
      values.push(username);
      index++;
    }

    if (bio) {
      query += `bio = $${index},`;
      values.push(bio);
      index++;
    }

    if (phone_no) {
      query += `phone_no = $${index},`;
      values.push(phone_no);
      index++;
    }

    if (gender) {
      query += `gender = $${index},`;
      values.push(gender);
      index++;
    }

    if (age) {
      query += `age = $${index},`;
      values.push(age);
      index++;
    }

    if (block_status) {
      query += `block_status = $${index},`;
      values.push(block_status);
      index++;
    }

    if (account_delete_status) {
      query += `account_delete_status = $${index} , account_delete_date = NOW()`;
      values.push(account_delete_status);
      index++;
    }

    if (running_experience_level_id) {
      query += `running_experience_level_id = $${index},`;
      values.push(running_experience_level_id);
      index++;
    }

    if (interest_ids) {
      query += `interest_ids = $${index},`;
      values.push(interest_ids);
      index++;
    }

    if (fitness_goal_ids?.length > 0) {
      query += `fitness_goal_ids = $${index},`;
      values.push(fitness_goal_ids);
      index++;
    }

    if (social_preferences_id) {
      query += `social_preferences_id = $${index},`;
      values.push(social_preferences_id);
      index++;
    }

    if (running_time_id) {
      query += `running_time_id = $${index},`;
      values.push(running_time_id);
      index++;
    }

    if (social_link_ids?.length > 0) {
      query += `social_link_ids = 
      $${index},`;
      values.push(social_link_ids);
      index++;
    }

    if (lat) {
      query += `lat = $${index},`;
      values.push(lat);
      index++;
    }

    if (long) {
      query += `long = $${index},`;
      values.push(long);
    }

    if (isPublicView) {
      query += ` is_public_view = $${index},`;
      values.push(isPublicView);
      index++;
    }

    if (req.files) {
      if (req.files["profile_image"]) {
        // check if image already exists
        const image = userRows[0].profile_image;

        const uploadImage =
          image !== null
            ? await updateCloudinaryFile(
                req.files["profile_image"][0].path,
                image.public_id
              )
            : await uploadToCloudinary(
                req.files["profile_image"][0].path,
                `ProfileImages`
              );

        query += `profile_image = $${index}, `;
        values.push(uploadImage);
        index++;
      }

      if (
        req.files["profile_showcase_photos"] &&
        req.files["profile_showcase_photos"].length > 0
      ) {
        const uploadPromises = req.files["profile_showcase_photos"].map(
          async (file) => {
            const uploadImage = await uploadToCloudinary(
              file.path,
              "ProfileShowCasePhotos"
            );
            return uploadImage;
          }
        );

        const uploadedImages = await Promise.all(uploadPromises);

        const currentImages = userRows[0].profile_showcase_photos || [];

        // Combine current and new images
        const allImages = currentImages.concat(uploadedImages);

        // Update the query and values to include the new images
        query += `profile_showcase_photos = $${index}, `;
        values.push(JSON.stringify(allImages));
        index++;
      }
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(res, 404, false, "User not found");
    }

    await pool.query("COMMIT");

    return responseSender(res, 200, true, "User Account updated", rows[0]);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);

    next(error);
  }
};

// update password
const updatePassword = async (req, res, next) => {
  const { email, newPassword, oldPassword } = req.body;

  try {
    // Check if email does not exist
    const emailCheckResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (emailCheckResult.rowCount === 0) {
      return responseSender(
        res,
        404,
        false,
        "User not found. Please check your email."
      );
    }

    // generate hash
    const hash = await generatePasswordHash(newPassword);

    // compare old passwords
    const checkPassword = await comparePassword(
      oldPassword,
      emailCheckResult.rows[0].password
    );

    if (!checkPassword) {
      return responseSender(res, 400, false, "Old password does not match.");
    }

    // Update user
    const { rows, rowCount } = await pool.query(
      "UPDATE users SET password = $1  WHERE email = $2 RETURNING *",
      [hash, email]
    );

    if (rowCount === 0) {
      return responseSender(
        res,
        500,
        false,
        "Cannot update password due to an error"
      );
    }

    return responseSender(res, 200, true, "Password updated.", {
      id: rows[0].id,
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// get user by id
const getUserById = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT 
        u.*,
        json_build_object('id' , r.id , 'level' , r.level) AS running_experience_level ,
        json_agg(json_build_object('id', fg.id , 'goal' , fg.goal)) As fitness_goal,
        json_build_object('id' , sp.id , 'preference' , sp.preference) AS social_preference,
        json_build_object('id' , rt.id , 'time_interval' , rt.time_interval) AS running_time,
        json_build_object('id' , sc.id , 'name' , sc.name, 'category_id' , sc.category_id) AS interests,
        json_agg(json_build_object('id', sl.id , 'platform_name' , sl.platform_name , 'platform_link' , sl.platform_link)) As social_links
      FROM users u
      LEFT JOIN social_links sl ON sl.user_id = u.id
      LEFT JOIN sub_category sc ON sc.id= ANY(u.interest_ids )
      LEFT JOIN fitness_goals fg ON fg.id= ANY(u.fitness_goal_ids )
      LEFT JOIN running_experience_levels r ON u.running_experience_level_id = r.id
      LEFT JOIN social_preferences sp ON u.social_preferences_id = sp.id
      LEFT JOIN running_times rt ON u.running_time_id = rt.id
      WHERE u.id = $1
      GROUP BY u.id, r.id, fg.id, sp.id, rt.id, sc.id`,
      [userId]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, true, "User not found.");
    }

    return responseSender(res, 200, true, "User retrieved successfully.", {
      user: rows[0],
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// get users
const getUsers = async (req, res, next) => {
  try {
    let { page, limit, sortField, sortOrder, search, account_delete_status } =
      req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 100;
    sortField = sortField || "created_at";
    sortOrder = sortOrder || "DESC";
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`u.username ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (account_delete_status) {
      whereClauses.push(`u.account_delete_status = $${queryParams.length + 1}`);
      queryParams.push(account_delete_status);
    }

    let whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT 
        u.*,
        json_build_object('id' , r.id , 'level' , r.level) AS running_experience_level ,
        json_agg(json_build_object('id', fg.id , 'goal' , fg.goal)) As fitness_goal,
        json_build_object('id' , sp.id , 'preference' , sp.preference) AS social_preference,
        json_build_object('id' , rt.id , 'time_interval' , rt.time_interval) AS running_time,
        json_build_object('id' , sc.id , 'name' , sc.name, 'category_id' , sc.category_id) AS interests,
        json_agg(json_build_object('id', sl.id , 'platform_name' , sl.platform_name , 'platform_link' , sl.platform_link)) As social_links
      FROM users u
      LEFT JOIN social_links sl ON sl.user_id = u.id
      LEFT JOIN sub_category sc ON sc.id= ANY(u.interest_ids )
      LEFT JOIN fitness_goals fg ON fg.id= ANY(u.fitness_goal_ids )
      LEFT JOIN running_experience_levels r ON u.running_experience_level_id = r.id
      LEFT JOIN social_preferences sp ON u.social_preferences_id = sp.id
      LEFT JOIN running_times rt ON u.running_time_id = rt.id
      ${whereClause}
      GROUP BY u.id, r.id, fg.id, sp.id, rt.id, sc.id
      ORDER BY u.${sortField} ${sortOrder} 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      
    `;
    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return responseSender(res, 404, false, "Users Not Found");
    }

    const countQuery = `
      SELECT COUNT(*)
      FROM users u
      ${whereClause}
    `;
    const totalRowsResult = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );

    return responseSender(res, 200, true, "Users Retrieved", {
      users: rows,
      pagination: pagination(totalRowsResult.rows[0].count, limit, page),
    });
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

// remove user images
const removeUserImages = async (req, res, next) => {
  const { publicIds, id } = req.body;

  try {
    await pool.query("BEGIN");

    const { rows, rowCount } = await pool.query(
      `UPDATE users 
       SET profile_showcase_photos = (
         SELECT jsonb_agg(image) AS profile_showcase_photos
         FROM jsonb_array_elements(profile_showcase_photos) AS image
         WHERE NOT (image->>'public_id' = ANY($1))
       )
       WHERE id = $2
       RETURNING *`,
      [publicIds, id]
    );

    if (rowCount === 0) {
      await pool.query("ROLLBACK");
      return responseSender(
        res,
        400,
        false,
        `${
          publicIds.length === 1 ? "Image not Deleted" : "Images not deleted"
        }`,
        null,
        req
      );
    }

    await deleteAllCloudinaryFiles(publicIds);

    await pool.query("COMMIT");

    return responseSender(
      res,
      200,
      true,
      `${publicIds.length === 1 ? "Image  Deleted" : "Images Deleted"}`,
      rows
    );
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(error.stack);
    next(error);
  }
};

// delete user account permanent
const deleteUserAccount = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rowCount, rows } = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (rowCount === 0) {
      return responseSender(res, 404, false, "User not found");
    }

    return responseSender(
      res,
      200,
      true,
      "User account deleted successfully.",
      rows[0].id
    );
  } catch (error) {
    logger.error(error.stack);
    next(error);
  }
};

module.exports = {
  createUser,
  loginUser,
  verifyEmail,
  verifyOTP,
  resetPassword,
  getUserById,
  getUsers,
  deleteUserAccount,
  updateUserAccount,
  removeUserImages,
  updatePassword,
};
