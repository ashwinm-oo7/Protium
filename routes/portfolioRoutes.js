const express = require("express");
const {
  addStockToPortfolio,
  getPortfolioHoldings,
  getPortfolioValue,
  trackStockPerformance,
} = require("../controllers/portfolioController");

const router = express.Router();

// Add stock to portfolio
router.post("/add", addStockToPortfolio);

// Get stock holdings and details
router.get("/holdings/:userId", getPortfolioHoldings);

// Get total portfolio value only
router.get("/value/:userId", getPortfolioValue);

// Track individual stock performance
router.get("/performance/:userId/:stockId", trackStockPerformance);

module.exports = router;
