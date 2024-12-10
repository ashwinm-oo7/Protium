const Stock = require("../models/Stock");

const addStock = async (req, res) => {
  try {
    const { symbol, name, currentPrice } = req.body;

    let stock = await Stock.findOne({ symbol });
    if (stock) {
      return res.status(400).json({ error: "Stock already exists" });
    }

    stock = new Stock({ symbol, name, currentPrice });
    await stock.save();
    res.status(201).json(stock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }
    res.json({ symbol: stock.symbol, price: stock.currentPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { addStock, getStockPrice };
