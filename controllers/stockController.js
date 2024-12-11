const { query } = require("express");
const Stock = require("../models/Stock");
const { getCache, setCache } = require("../utils/cache");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const API_KEY = process.env.API_KEY;

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
    const { symbol, stockId } = req.params;
    let query = {};

    // Build query based on provided params
    if (symbol) {
      query.symbol = symbol;
    }
    if (stockId) {
      query._id = stockId;
    }

    // Fetch stock details based on the query
    const stock = await Stock.findOne(query);
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    // Calculate daily change
    const dailyChange =
      stock.priceHistory.length > 1
        ? stock.currentPrice -
          stock.priceHistory[stock.priceHistory.length - 2].price
        : 0; // If no previous price, daily change is 0

    // Return stock information including daily change and price history
    res.json({
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice,
      dailyChange,
      priceHistory: stock.priceHistory,
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

const updateStockPrice = async (req, res) => {
  try {
    const { symbol, newPrice } = req.body;
    if (!symbol || !newPrice) {
      return res.status(404).json({ error: "Invalid Input" });
    }
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    // Update price history only if the price has changed
    const today = new Date().toISOString().split("T")[0];
    const lastHistoryEntry = stock.priceHistory.at(-1);

    if (
      !lastHistoryEntry ||
      lastHistoryEntry.date.toISOString().split("T")[0] !== today
    ) {
      stock.priceHistory.push({ date: new Date(), price: newPrice });
    }

    stock.currentPrice = newPrice;
    await stock.save();

    res.status(200).json({ message: "Stock price updated", stock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating stock price" });
  }
};

const getLiveStockPrice = async (req, res, next) => {
  const { symbol } = req.params;

  try {
    const cachedPrice = getCache(symbol);
    if (cachedPrice) {
      return res.status(200).json({ symbol, price: cachedPrice });
    }

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${process.env.API_KEY}`;
    const response = await axios.get(url);

    const stockData = response.data["Time Series (5min)"];
    const latestTime = Object.keys(stockData)[0];
    const currentPrice = stockData[latestTime]["4. close"];

    // Update the stock price in the database
    const stock = await Stock.findOne({ symbol });
    if (stock) {
      const today = new Date().toISOString().split("T")[0];
      const lastHistoryEntry = stock.priceHistory.at(-1);

      // Add a new entry to priceHistory if the date is different or price has changed
      if (
        !lastHistoryEntry ||
        lastHistoryEntry.date.toISOString().split("T")[0] !== today
      ) {
        stock.priceHistory.push({ date: new Date(), price: currentPrice });
      }

      stock.currentPrice = currentPrice;
      await stock.save();
    }

    setCache(symbol, currentPrice);
    res.status(200).json({ symbol, price: currentPrice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addStock,
  getStockPrice,
  getStockDetails,
  getLiveStockPrice,
  updateStockPrice,
};
