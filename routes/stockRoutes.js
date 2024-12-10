const express = require("express");
const router = express.Router();
const { addStock } = require("../controllers/stockController");

// Add stock
router.post("/add", addStock);

// Example GET route for stocks
router.get("/", async (req, res) => {
  try {
    const db = await (await require("../config/db").connectDatabase()).getDb();
    const stocksCollection = db.collection("stocks");
    const stocks = await stocksCollection.find().toArray();
    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stocks data", error });
  }
});

module.exports = router;
