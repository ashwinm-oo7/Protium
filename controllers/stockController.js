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
    console.log("stock id  ", stockId);
    const cachedStock = getCache(stockId);
    if (cachedStock) {
      console.log("Stock cached: " + JSON.stringify(cachedStock));
      return res.status(200).json(cachedStock);
    }

    let query = {};

    // Build query based on provided params
    if (symbol) {
      query.symbol = symbol;
    }
    if (stockId) {
      query._id = stockId;
    }

    // Fetch stock details based on the query
    const stock = await Stock.findOne(query).lean();
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    // Calculate daily change
    const dailyChange =
      stock.priceHistory?.length > 1
        ? stock.currentPrice -
          stock.priceHistory[stock.priceHistory?.length - 2].close
        : 0; // If no previous price, daily change is 0

    // Return stock information including daily change and price history
    const stockDetails = {
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice,
      dailyChange,
      priceHistory: stock.priceHistory,
    };

    // Cache the stock details
    setCache(stockId, stockDetails);

    // Return response
    res.json(stockDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    // Check cache first
    const cachedPrice = getCache(symbol);
    if (cachedPrice) {
      console.log("Cache cached price: " + cachedPrice);
      return res.status(200).json({ symbol, price: cachedPrice });
    }

    // Fetch stock price from the database
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    // Cache the stock price
    setCache(symbol, stock.currentPrice);

    // Return response
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
    setCache(symbol, newPrice);

    res.status(200).json({ message: "Stock price updated", stock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating stock price" });
  }
};

const getLiveStockPrice = async (req, res, next) => {
  const { symbol } = req.params;

  try {
    // Check if data is already cached
    const cachedData = getCache(symbol);
    if (cachedData) {
      return res.status(200).json({ symbol, history: cachedData });
    }

    // Fetch historical data from Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await axios.get(url);

    const stockData = response.data["Time Series (Daily)"];
    if (!stockData) {
      return res.status(500).json({
        error: "Failed to fetch stock data",
        details: response.data, // Helps in debugging
      });
    }
    console.log("LIVE", stockData);
    // Parse and save historical data
    const history = [];
    for (const date in stockData) {
      const {
        "1. open": open,
        "2. high": high,
        "3. low": low,
        "4. close": close,
        "5. volume": volume,
      } = stockData[date];

      history.push({ date, open, high, low, close, volume });
    }

    // Update or insert into the database
    const stock = await Stock.findOne({ symbol });
    if (stock) {
      // Merge new history with existing priceHistory
      const existingDates = new Set(
        stock.priceHistory.map(
          (entry) => entry.date.toISOString().split("T")[0]
        )
      );

      const newHistory = history?.filter(
        (entry) => !existingDates.has(entry.date)
      );

      stock.priceHistory.push(
        ...newHistory.map((entry) => ({
          date: new Date(entry.date),
          open: parseFloat(entry.open),
          high: parseFloat(entry.high),
          low: parseFloat(entry.low),
          close: parseFloat(entry.close),
          volume: parseInt(entry.volume),
        }))
      );

      stock.currentPrice = history[0].close; // Latest price
      await stock.save();
    } else {
      // Create a new record
      await Stock.create({
        symbol,
        name: symbol, // Add stock name if you want it, or fetch it from another source
        currentPrice: parseFloat(history[0].close),
        priceHistory: history.map((entry) => ({
          date: new Date(entry.date),
          open: parseFloat(entry.open),
          high: parseFloat(entry.high),
          low: parseFloat(entry.low),
          close: parseFloat(entry.close),
          volume: parseInt(entry.volume),
        })),
      });
    }
    // Cache the history
    setCache(symbol, history);

    res.status(200).json({ symbol, history });
  } catch (error) {
    next(error);
  }
};

const getAllStockDetailsWAIT = async (req, res) => {
  try {
    // Fetch all stocks from the database
    const cacheKey = "getAllStockDetails";
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log("Cache hit for getAllStockDetails");
      return res.status(200).json(cachedData);
    }

    const stocks = await Stock.find().lean();

    if (!stocks || stocks?.length === 0) {
      return res.status(404).json({ error: "No stocks found" });
    }

    // Calculate daily change for each stock
    const stocksDetails = stocks.map((stock) => {
      const dailyChange =
        stock.priceHistory?.length > 1
          ? stock.currentPrice -
            stock.priceHistory[stock.priceHistory?.length - 2].price
          : 0; // If no previous price, daily change is 0

      return {
        _id: stock._id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        dailyChange,
        priceHistory: stock.priceHistory,
      };
    });
    setCache("getAllStockDetails", stocksDetails);
    // Return all stocks details with daily change
    res.status(200).json(stocksDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllStockDetails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get current page from query params (default 1)
    const limit = parseInt(req.query.limit) || 20; // Set limit per page (default 20)
    const skip = (page - 1) * limit; // Calculate number of documents to skip

    // Cache key with pagination to store different pages separately
    const cacheKey = `getAllStockDetails_page${page}_limit${limit}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log("Cache hit for paginated getAllStockDetails");
      return res.status(200).json(cachedData);
    }

    // Fetch paginated stocks
    const stocks = await Stock.find().skip(skip).limit(limit).lean();
    const totalCount = await Stock.countDocuments(); // Get total number of stocks

    if (!stocks || stocks.length === 0) {
      return res.status(404).json({ error: "No stocks found" });
    }

    // Calculate daily change for each stock
    const stocksDetails = stocks.map((stock) => {
      const dailyChange =
        stock.priceHistory?.length > 1
          ? stock.currentPrice -
            stock.priceHistory[stock.priceHistory?.length - 2].price
          : 0;

      return {
        _id: stock._id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        dailyChange,
        priceHistory: stock.priceHistory,
      };
    });

    const response = {
      stocks: stocksDetails,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalStocks: totalCount,
    };

    setCache(cacheKey, response);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  addStock,
  getStockPrice,
  getStockDetails,
  getLiveStockPrice,
  updateStockPrice,
  getAllStockDetails,
};
