const express = require("express");
const MoneyTransaction = require("../models/MoneyTransaction");
const router = express.Router();
const User = require("../models/User");
const { sendEmailNotificationWithdraw } = require("../services/emailServices");

router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, sort, dateFrom, dateTo } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "Invalid User." });
    }

    // Find user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let filter = { userId };

    if (type) {
      filter.type = type; // Filter by Deposit, Withdrawal, Buy, Sell
    }

    if (dateFrom && dateTo) {
      filter.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }

    let transactions = await MoneyTransaction.find(filter).sort(
      sort === "amount" ? { amount: -1 } : { date: -1 } // Sort by amount or latest date
    );

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

router.post("/withdraw-money-WAIT", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Validate input
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount." });
    }

    // Find user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    // Deduct balance
    user.walletBalance -= amount;
    await user.save();

    // Store transaction
    const transaction = new MoneyTransaction({
      userId,
      type: "Withdrawal",
      amount,
    });
    await transaction.save();

    // Send email notification
    await sendEmailNotificationWithdraw(user.email, amount, user.walletBalance);
    res.status(200).json({
      message: "Withdrawal successful!",
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    console.error("Error withdrawing money:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Withdraw Money Request
router.post("/withdraw-money", async (req, res) => {
  try {
    const { userId, amount, paymentMethod, accountDetails } = req.body;

    if (
      !userId ||
      !amount ||
      amount <= 0 ||
      !paymentMethod ||
      !accountDetails
    ) {
      return res.status(400).json({ message: "Invalid request details." });
    }

    // Find user and check balance
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    // Deduct money and create a withdrawal request
    user.walletBalance -= amount;
    await user.save();

    const withdrawal = new MoneyTransaction({
      userId,
      amount,
      type: "Withdrawal",
      paymentMethod,
      accountDetails,
      status: "Completed", // Default status
    });

    await withdrawal.save();

    // Send email confirmation
    await sendEmailNotificationWithdraw(user.email, amount, user.walletBalance);

    res
      .status(200)
      .json({
        message: "Withdrawal successfully!",
        walletBalance: user.walletBalance,
      });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;
