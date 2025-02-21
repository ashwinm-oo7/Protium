const cron = require("node-cron");
const axios = require("axios");
const dotenv = require("dotenv");
const Stock = require("../models/Stock");
dotenv.config();
const mongoose = require("mongoose");

const API_KEY = process.env.API_KEY;

// Schedule cron job to run every hour
cron.schedule("0 * * * *", async () => {
  console.log("Updating stock prices...");

  try {
    // ✅ Fetch all stock symbols from the database
    const stocks = await Stock.find({}, "symbol");

    if (!stocks.length) {
      console.log("No stocks found in the database.");
      return;
    }

    // Loop through each stock and update its price
    for (const stock of stocks) {
      await updateStockPrice(stock.symbol);
    }

    console.log("✅ Stock prices updated successfully.");
  } catch (error) {
    console.error("❌ Error fetching stocks:", error);
  }
});

/**
 * Function to fetch stock price and update it in the database
 */
const updateStockPrice = async (symbol) => {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
    const response = await axios.get(url);
    const stockData = response.data["Time Series (5min)"];

    if (!stockData) {
      console.warn(`⚠️ No data found for ${symbol}. Skipping update.`);
      return;
    }

    const latestTime = Object.keys(stockData)[0]; // Get latest timestamp
    const latestData = stockData[latestTime];
    const currentPrice = parseFloat(latestData["4. close"]);

    // ✅ Update stock record in the database
    const stock = await Stock.findOne({ symbol });
    if (stock) {
      stock.currentPrice = currentPrice;
      stock.dailyChange = calculateDailyChange(stock);
      stock.priceHistory.push({
        date: new Date(latestTime),
        open: parseFloat(latestData["1. open"]),
        high: parseFloat(latestData["2. high"]),
        low: parseFloat(latestData["3. low"]),
        close: currentPrice,
        volume: parseInt(latestData["5. volume"]),
      });

      await stock.save();
      console.log(`🔄 Updated ${symbol}: $${currentPrice}`);
    }
  } catch (error) {
    console.error(`❌ Error updating stock data for ${symbol}:`, error.message);
  }
};

/**
 * Function to calculate daily change percentage
 */
const calculateDailyChange = (stock) => {
  const initialPrice = stock.priceHistory[0]?.close;
  if (initialPrice) {
    return ((stock.currentPrice - initialPrice) / initialPrice) * 100;
  }
  return 0;
};
