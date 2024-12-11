const Transaction = require("../models/Transaction");
const Stock = require("../models/Stock");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User"); // Import User model
const mongoose = require("mongoose");

// Record buy transaction
const recordBuyTransaction = async (req, res) => {
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
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ message: "Invalid Stock ID" });
    }

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

    if (!existingStock) {
      return res.status(400).json({ message: "No stock found in portfolio" });
    }

    if (existingStock.quantity < quantity) {
      return res.status(400).json({ message: "Not enough stock to sell" });
    }
    const purchaseValue = existingStock.quantity * existingStock.purchasePrice;
    const saleValue = quantity * stock.currentPrice;
    const profitLoss = saleValue - quantity * existingStock.purchasePrice;
    // Record the sell transaction
    const transaction = new Transaction({
      userId,
      stockId,
      type: "sell",
      quantity,
      profitLoss,
      price: stock.currentPrice,
    });

    // Save the transaction
    await transaction.save();

    // Update the user's portfolio
    existingStock.quantity -= quantity;
    if (existingStock.quantity === 0) {
      await Portfolio.findOneAndUpdate(
        { userId },
        {
          $pull: { stocks: { stockId: new mongoose.Types.ObjectId(stockId) } },
        },
        { new: true }
      );
    } else {
      // Otherwise, update the stock's quantity in the portfolio
      await Portfolio.findOneAndUpdate(
        { userId, "stocks.stockId": new mongoose.Types.ObjectId(stockId) },
        { $set: { "stocks.$.quantity": existingStock.quantity } },
        { new: true }
      );
    }

    // await portfolio.save();
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
// Get transaction history for a user with aggregated data
const getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { stockId, startDate, endDate, transactionType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filters = { userId };

    // If stockId is provided, add to filters
    if (stockId && mongoose.Types.ObjectId.isValid(stockId)) {
      filters.stockId = new mongoose.Types.ObjectId(stockId);
    }

    // If startDate and endDate are provided, add them to filters
    if (startDate && endDate) {
      filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // If transactionType is provided, filter by type (buy or sell)
    if (
      transactionType &&
      (transactionType === "buy" || transactionType === "sell")
    ) {
      filters.type = transactionType;
    }

    // Fetch transactions based on filters
    const transactions = await Transaction.find(filters)
      .populate("stockId")
      .sort({ date: -1 });

    if (!transactions.length) {
      return res
        .status(404)
        .json({ message: "No transactions found for this user" });
    }

    // Calculate aggregated data (buy/sell value, net gains)
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let netGain = 0;

    transactions.forEach((transaction) => {
      const transactionValue = transaction.quantity * transaction.price;
      if (transaction.type === "buy") {
        totalBuyValue += transactionValue;
      } else if (transaction.type === "sell") {
        totalSellValue += transactionValue;
      }
    });

    netGain = totalSellValue - totalBuyValue;

    res.status(200).json({
      transactions,
      aggregatedData: {
        totalBuyValue,
        totalSellValue,
        netGain,
      },
    });
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
