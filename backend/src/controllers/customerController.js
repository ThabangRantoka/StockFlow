const pool = require("../config/database");
const { validateCustomer } = require("../utils/validators");




const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM customers ORDER BY id ASC"
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get customers"
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const validation = validateCustomer(req.body);

if (!validation.valid) {
  return res.status(400).json({
    message: validation.message
  });
}
    const {
      first_name,
      last_name,
      email,
      phone
    } = req.body;

    const result = await pool.query(
      `INSERT INTO customers
       (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [first_name, last_name, email, phone]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A customer with this email already exists"
      });
    }

    res.status(500).json({
      message: "Failed to create customer"
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validateCustomer(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone
    } = req.body;

    const result = await pool.query(
      `UPDATE customers
       SET first_name = $1,
           last_name = $2,
           email = $3,
           phone = $4
       WHERE id = $5
       RETURNING *`,
      [first_name, last_name, email, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A customer with this email already exists"
      });
    }

    res.status(500).json({
      message: "Failed to update customer"
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM customers WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.status(200).json({
      message: "Customer deleted successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete customer"
    });
  }
};


module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};