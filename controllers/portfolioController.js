const Portfolio = require("../models/Portfolio");
const Stock = require("../models/Stock");
const User = require("../models/User"); // Import User model

// Add stock to portfolio
const addStockToPortfolio = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;
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

    const portfolio = await Portfolio.findOne({ userId }).populate(
      "stocks.stockId"
    );
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Calculate total portfolio value and individual stock performance
    let totalValue = 0;
    const holdings = portfolio.stocks.map((stock) => {
      const currentValue = stock.quantity * stock.stockId.currentPrice;
      totalValue += currentValue;

      return {
        stockId: stock.stockId._id,
        symbol: stock.stockId.symbol,
        name: stock.stockId.name,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        currentPrice: stock.stockId.currentPrice,
        currentValue,
        profitLoss: currentValue - stock.quantity * stock.purchasePrice,
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

    // Fetch the user's portfolio
    const portfolio = await Portfolio.findOne({ userId }).populate(
      "stocks.stockId"
    );

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // Find the specific stock in the portfolio
    const stockData = portfolio.stocks.find(
      (stock) => stock.stockId._id.toString() === stockId
    );

    if (!stockData) {
      return res.status(404).json({ message: "Stock not found in portfolio" });
    }

    // Calculate performance metrics
    const currentValue = stockData.quantity * stockData.stockId.currentPrice;
    const purchaseValue = stockData.quantity * stockData.purchasePrice;
    const performance = currentValue - purchaseValue;

    // Return stock performance details
    res.status(200).json({
      stock: {
        symbol: stockData.stockId.symbol,
        name: stockData.stockId.name,
        quantity: stockData.quantity,
        currentPrice: stockData.stockId.currentPrice,
        purchasePrice: stockData.purchasePrice,
        currentValue,
        purchaseValue,
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
