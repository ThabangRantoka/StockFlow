
const pool = require("../config/database");
const bcrypt = require("bcrypt");

const allowedRoles = ["Admin", "Manager", "Employee"];
const allowedStatuses = ["Active", "Inactive"];

const publicColumns =
  "id, full_name, email, role, status, created_at";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0 &&
    Number.isSafeInteger(Number(value));
}

// GET ALL USERS — ADMIN ONLY
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${publicColumns}
       FROM users
       ORDER BY id ASC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Failed to get users",
    });
  }
};

// CREATE USER — ADMIN ONLY
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body || {};

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message: "Full name, email, password and role are required",
      });
    }

    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Use Admin, Manager or Employee",
      });
    }

    if (
      Buffer.byteLength(password, "utf8") < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 UTF-8 bytes",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${publicColumns}`,
      [cleanName, cleanEmail, hashedPassword, role]
    );

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};

// UPDATE USER ROLE — ADMIN ONLY
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (String(req.user.id) === String(id) && role !== "Admin") {
      return res.status(403).json({
        message: "You cannot remove your own Admin role",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING ${publicColumns}`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User role updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      message: "Failed to update user role",
    });
  }
};

// UPDATE USER STATUS — ADMIN ONLY
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use Active or Inactive",
      });
    }

    if (String(req.user.id) === String(id) && status === "Inactive") {
      return res.status(403).json({
        message: "You cannot deactivate your own account",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING ${publicColumns}`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User status updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      message: "Failed to update user status",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
};
