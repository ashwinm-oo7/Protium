const express = require("express");
const router = express.Router();
const {
  addStock,
  getStockDetails,
  updateStockPrice,
  getLiveStockPrice,
  getAllStockDetails,
} = require("../controllers/stockController");

router.get("/getAllStockDetails", getAllStockDetails);
// Add stock

router.post("/adding-stock-data", addStock);

router.get("/stock-detail/:stockId", getStockDetails);

router.post("/update", updateStockPrice);
// Example GET route for stocks
router.get("/getLiveStockPrice/:symbol", getLiveStockPrice);

module.exports = router;
