const bcrypt = require("bcrypt");
const pool = require("../config/database");
const jwt = require("jsonwebtoken");


// =========================
// REGISTER USER
// =========================

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required"
      });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always creates an Employee.
    // We do NOT trust a role sent by the frontend.
    const newUser = await pool.query(
      `INSERT INTO users
       (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, status, created_at`,
      [
        full_name,
        email,
        hashedPassword,
        "Employee"
      ]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};


// =========================
// LOGIN USER
// =========================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // User not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Compare entered password with stored hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    // Wrong password
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Check whether account is active
    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Account is inactive"
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    // Successful login
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};


// =========================
// EXPORT CONTROLLERS
// =========================

module.exports = {
  registerUser,
  loginUser
};