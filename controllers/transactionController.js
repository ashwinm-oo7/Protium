const Transaction = require("../models/Transaction");
const Stock = require("../models/Stock");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User"); // Import User model
const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { sendEmailNotificationAlert } = require("../services/emailServices");
require("dotenv").config();

const app = express();
app.use(express.json());
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
    const totalPrice = stock.currentPrice * quantity; // Total cost for buying the stocks

    // Check if the user has enough balance in the wallet
    if (user.walletBalance < totalPrice) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Your current balance is $${user.walletBalance.toFixed(
          2
        )}.`,
      });
    }

    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId, stocks: [] });
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

    user.walletBalance -= totalPrice;
    await user.save();

    // Update the portfolio with the stock (if necessary)

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
    sendEmailNotificationAlert(user.email, "Stock Buy Transaction", {
      stockName: stock.name,
      stockSymbol: stock.symbol,
      quantity,
      price: stock.currentPrice,
      totalCost: totalPrice,
      walletBalance: user.walletBalance,
    });

    res.status(201).json({
      message: "Buy transaction recorded successfully",
      transaction,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error recording buy transaction", error });
  }
};

const recordSellTransaction = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;
    console.log(userId);
    // Validate User ID and Stock ID
    if (!userId) {
      return res
        .status(401)
        .json({ message: "User not logged in. Please login to continue." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ message: "Invalid Stock ID" });
    }
    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
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
      return res
        .status(404)
        .json({ message: "Portfolio not found for this user" });
    }

    const existingStock = portfolio.stocks.find(
      (item) => item.stockId._id.toString() === stockId
    );

    if (!existingStock) {
      return res.status(400).json({ message: "No stock found in portfolio" });
    }

    if (existingStock.quantity < quantity || quantity <= 0) {
      return res.status(400).json({ message: "Not enough stock to sell" });
    }

    // Calculate the sale value and profit/loss
    const costPrice = existingStock.purchasePrice * quantity;
    const saleValue = quantity * stock.currentPrice;
    const profitLoss = saleValue - costPrice;
    const totalPrice = stock.currentPrice * quantity;
    // Create and save the sell transaction
    const transaction = new Transaction({
      userId,
      stockId,
      type: "sell",
      quantity,
      profitLoss,
      price: stock.currentPrice,
    });

    await transaction.save();

    // Add the sale value to the user's wallet balance

    user.walletBalance += saleValue;
    await user.save();

    // Update the user's portfolio
    existingStock.quantity -= quantity;
    if (existingStock.quantity === 0) {
      // Remove stock from portfolio if quantity reaches 0
      await Portfolio.findOneAndUpdate(
        { userId },
        {
          $pull: { stocks: { stockId: new mongoose.Types.ObjectId(stockId) } },
        },
        { new: true, runValidators: true }
      );
    } else {
      // Update stock quantity in portfolio
      await Portfolio.findOneAndUpdate(
        { userId, "stocks.stockId": new mongoose.Types.ObjectId(stockId) },
        { $set: { "stocks.$.quantity": existingStock.quantity } },
        { new: true }
      );
    }
    sendEmailNotificationAlert(user.email, "Stock Sell Transaction", {
      stockName: stock.name,
      stockSymbol: stock.symbol,
      quantity,
      price: stock.currentPrice,
      totalCost: totalPrice,
      walletBalance: user.walletBalance,
    });

    res.status(201).json({
      message: "Stock sold and transaction recorded",
      transaction,
      walletBalance: user.walletBalance, // Send updated wallet balance
    });
  } catch (error) {
    console.error("Error recording sell transaction:", error);

    // Handle specific errors
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.message });
    } else if (error.name === "MongoError") {
      return res
        .status(500)
        .json({ message: "Database Error", details: error.message });
    }

    // General server error
    res.status(500).json({
      message: "Error recording sell transaction",
      error: error.message,
    });
  }
};

// Get transaction history for a user
// Get transaction history for a user with aggregated data
const getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { stockId, startDate, endDate, transactionType, symbol } = req.query;

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
    if (symbol) {
      filters.symbol = symbol;
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
