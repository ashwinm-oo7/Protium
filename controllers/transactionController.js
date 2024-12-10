const Transaction = require("../models/Transaction");
const Stock = require("../models/Stock");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User"); // Import User model

// Record buy transaction
const recordBuyTransaction = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the stock by ID
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Create and save the buy transaction
    const transaction = new Transaction({
      userId,
      stockId,
      type: "buy",
      quantity,
      price: stock.currentPrice,
    });

    await transaction.save();

    // Update the portfolio with the stock (if necessary)
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

    res
      .status(201)
      .json({ message: "Buy transaction recorded successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error recording buy transaction", error });
  }
};

// Record sell transaction
const recordSellTransaction = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Check if the user has enough stock to sell
    let portfolio = await Portfolio.findOne({ userId }).populate(
      "stocks.stockId"
    );
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const existingStock = portfolio.stocks.find(
      (item) => item.stockId._id.toString() === stockId
    );
    console.log(portfolio, "", stockId, "", existingStock);
    if (!existingStock) {
      return res.status(400).json({ message: "No stock is there" });
    }

    if (!existingStock || existingStock.quantity < quantity) {
      return res.status(400).json({ message: "Not enough stock to sell" });
    }

    // Record the sell transaction
    const transaction = new Transaction({
      userId,
      stockId,
      type: "sell",
      quantity,
      price: stock.currentPrice,
    });

    // Save the transaction
    await transaction.save();

    // Update the user's portfolio
    existingStock.quantity -= quantity;
    if (existingStock.quantity === 0) {
      portfolio.stocks.pull(existingStock._id);
    }

    await portfolio.save();
    res
      .status(201)
      .json({ message: "Stock sold and transaction recorded", transaction });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error recording sell transaction", error });
  }
};

// Get transaction history for a user
const getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all transactions for a given user, sorted by most recent first
    const transactions = await Transaction.find({ userId })
      .populate("stockId")
      .sort({ date: -1 });

    if (!transactions.length) {
      return res
        .status(404)
        .json({ message: "No transactions found for this user" });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching transaction history", error });
  }
};

module.exports = {
  recordBuyTransaction,
  recordSellTransaction,
  getTransactionHistory,
};
