const cron = require("node-cron");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const Stock = require("../models/Stock"); // Assuming you have a Stock model

const API_KEY = process.env.API_KEY;

cron.schedule("0 * * * *", async () => {
  //.for every hour
  // cron.schedule("*/15 * * * *", async () => {
  //for every 15minute
  console.log("Updating stock prices...");

  // Runs every hour at the 0th minute
  const stockSymbols = ["AAPL", "GOOGL", "NFLX", "IBM"]; // List of stock symbols to update

  for (const symbol of stockSymbols) {
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;
      const response = await axios.get(url);
      const stockData = response.data["Time Series (5min)"];
      const latestTime = Object.keys(stockData)[0];
      const latestData = stockData[latestTime];
      const currentPrice = latestData["4. close"];

      // Update stock price in the database
      const stock = await Stock.findOne({ symbol });
      if (stock) {
        stock.currentPrice = currentPrice;
        stock.dailyChange = calculateDailyChange(stock); // If you need to calculate daily change
        await stock.save();
        console.log(`Stock price for ${symbol} updated to $${currentPrice}`);
      }
    } catch (error) {
      console.error(`Error updating stock data for ${symbol}:`, error);
    }
  }
});

// Function to calculate daily change if needed
const calculateDailyChange = (stock) => {
  const initialPrice = stock.priceHistory[0]?.price;
  if (initialPrice) {
    return ((stock.currentPrice - initialPrice) / initialPrice) * 100; // Percentage change
  }
  return 0;
};
