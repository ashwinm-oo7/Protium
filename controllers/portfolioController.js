const Portfolio = require("../models/Portfolio");
const Stock = require("../models/Stock");
const Transaction = require("../models/Transaction");
const User = require("../models/User"); // Import User model
const mongoose = require("mongoose");

// Add stock to portfolio
const addStockToPortfolio = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ message: "Invalid Stock ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId, stocks: [] });
    }

    const existingStock = portfolio.stocks.find(
      (item) => item.stockId.toString() === stockId
    );

    if (existingStock) {
      existingStock.quantity += quantity;
    } else {
      portfolio.stocks.push({
        stockId,
        quantity,
        purchasePrice: stock.currentPrice,
      });
    }
    const transaction = new Transaction({
      userId,
      stockId,
      type: "buy",
      quantity,
      price: purchasePrice,
      date: new Date(),
    });

    await transaction.save();
    await portfolio.save();
    res.status(201).json({ message: "Stock added successfully", portfolio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding stock to portfolio", error });
  }
};

// Get stock holdings and portfolio value
const getPortfolioHoldings = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const portfolio = await Portfolio.findOne({ userId })
      .populate("stocks.stockId")
      .lean();
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Calculate total portfolio value and individual stock performance
    let totalValue = 0;
    const holdings = portfolio.stocks.map((stock) => {
      const currentValue = stock.quantity * stock.stockId.currentPrice;
      totalValue += currentValue;
      const purchaseValue = stock.purchasePrice * stock.quantity;
      return {
        stockId: stock.stockId._id,
        symbol: stock.stockId.symbol,
        name: stock.stockId.name,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        currentPrice: stock.stockId.currentPrice,
        currentValue,
        profitLoss: currentValue - purchaseValue,
      };
    });

    res.status(200).json({
      userId,
      totalValue,
      holdings,
    });
  } catch (error) {
    console.error("Error fetching portfolio holdings:", error);
    res
      .status(500)
      .json({ message: "Error fetching portfolio holdings", error });
  }
};

// Get portfolio total value only
const getPortfolioValue = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const portfolio = await Portfolio.findOne({ userId }).populate(
      "stocks.stockId"
    );
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const totalValue = portfolio.stocks.reduce(
      (sum, stock) => sum + stock.quantity * stock.stockId.currentPrice,
      0
    );

    res.status(200).json({ totalValue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching portfolio value", error });
  }
};

const trackStockPerformance = async (req, res) => {
  try {
    const { userId, stockId } = req.params;

    // Validate User ID and Stock ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ message: "Invalid Stock ID" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if stock exists
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Fetch the user's portfolio
    const portfolio = await Portfolio.findOne({ userId }).populate(
      "stocks.stockId"
    );

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Find all purchases for the specific stock
    const stockData = portfolio.stocks.filter(
      (stock) => stock.stockId._id.toString() === stockId
    );

    if (stockData.length === 0) {
      return res.status(404).json({ message: "Stock not found in portfolio" });
    }

    // Calculate performance metrics for multiple purchases
    let totalQuantity = 0;
    let totalPurchaseValue = 0;
    stockData.forEach((purchase) => {
      totalQuantity += purchase.quantity;
      totalPurchaseValue += purchase.quantity * purchase.purchasePrice;
    });

    const currentValue = totalQuantity * stock.currentPrice;
    const performance = currentValue - totalPurchaseValue;

    // Update stock price history
    const today = new Date().toISOString().split("T")[0];
    const priceHistoryEntry = stock.priceHistory.find(
      (entry) => entry.date.toISOString().split("T")[0] === today
    );

    if (!priceHistoryEntry) {
      stock.priceHistory.push({ date: new Date(), price: stock.currentPrice });
      await stock.save();
    }

    // Return stock performance details
    res.status(200).json({
      stock: {
        symbol: stock.symbol,
        name: stock.name,
        totalQuantity,
        currentPrice: stock.currentPrice,
        averagePurchasePrice: totalPurchaseValue / totalQuantity,
        currentValue,
        totalPurchaseValue,
        performance,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error tracking stock performance", error });
  }
};

module.exports = {
  addStockToPortfolio,
  getPortfolioHoldings,
  getPortfolioValue,
  trackStockPerformance,
};
