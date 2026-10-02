const pool = require("../config/database");
const bcrypt = require("bcrypt");


// =========================
// GET ALL USERS
// =========================

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        role,
        status,
        created_at
       FROM users
       ORDER BY id ASC`
    );

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Failed to get users"
    });
  }
};


// =========================
// CREATE USER
// =========================

const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Check required fields
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        message: "Full name, email, password and role are required"
      });
    }

    // Only these roles are allowed
    const allowedRoles = ["Employee", "Manager", "Admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    // Check whether email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users
       (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, status, created_at`,
      [full_name, email, hashedPassword, role]
    );

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Failed to create user"
    });
  }
};


const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["Employee", "Manager", "Admin"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, full_name, email, role, status, created_at`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "User role updated successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      message: "Failed to update user role"
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Active", "Inactive"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING id, full_name, email, role, status, created_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "User status updated successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      message: "Failed to update user status"
    });
  }
};


// =========================
// EXPORTS
// =========================

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus
};