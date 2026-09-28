const validateProduct = (product) => {
  const { name, sku, category, price, stock_quantity } = product;

  if (!name || !sku || !category) {
    return {
      valid: false,
      message: "Name, SKU and category are required"
    };
  }

  if (price === undefined || price < 0) {
    return {
      valid: false,
      message: "Price must be 0 or greater"
    };
  }

  if (stock_quantity === undefined || stock_quantity < 0) {
    return {
      valid: false,
      message: "Stock quantity must be 0 or greater"
    };
  }

  return {
    valid: true
  };
};


const validateCustomer = (customer) => {
  const { first_name, last_name, email } = customer;

  if (!first_name || !last_name || !email) {
    return {
      valid: false,
      message: "First name, last name and email are required"
    };
  }

  if (!email.includes("@")) {
    return {
      valid: false,
      message: "Please provide a valid email address"
    };
  }

  return {
    valid: true
  };
};













module.exports = {
  validateProduct,
  validateCustomer
};