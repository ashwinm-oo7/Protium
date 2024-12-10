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

const getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }
    // Return stock information including the daily change
    res.json({
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice,
      dailyChange: stock.dailyChange,
    });
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

const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const API_KEY = process.env.API_KEY;

const getStockPriceLive = async (symbol) => {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const stockData = response.data["Time Series (5min)"]; // Access the time series data
    const latestTime = Object.keys(stockData)[0]; // Get the latest time
    const latestData = stockData[latestTime]; // Get the data for that time
    const currentPrice = latestData["4. close"]; // Extract the current price

    console.log(`Current price of ${symbol}: $${currentPrice}`);
    return currentPrice;
  } catch (error) {
    console.error("Error fetching stock data:", error);
  }
};

module.exports = { addStock, getStockPrice, getStockDetails };
