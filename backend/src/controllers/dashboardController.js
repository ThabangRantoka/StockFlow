const {
  getDashboardSummary,
  getRecentOrders
} = require("../services/dashboardService");

// ========================
// GET DASHBOARD
// ========================
const getDashboard = async (req, res) => {
  try {

const summary = await getDashboardSummary();
const recentOrders = await getRecentOrders();

res.status(200).json({
  summary: summary,
  recent_orders: recentOrders
});

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get dashboard data"
    });
  }
};


module.exports = {
  getDashboard
};