
const {
  getReportsData
} = require("../services/reportsService");

// ========================
// GET REPORTS
// ========================
const getReports = async (req, res) => {
  try {
    const reports = await getReportsData();

    res.status(200).json(reports);
  } catch (error) {
    console.error("Reports error:", error);

    res.status(500).json({
      message: "Failed to get reports data"
    });
  }
};

module.exports = {
  getReports
};
