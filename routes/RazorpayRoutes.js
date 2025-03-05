const express = require("express");
const User = require("../models/User"); // Assuming you have a User model
const {
  sendEmailNotificationAlert,
  sendEmailNotificationAddMoney,
} = require("../services/emailServices");
const MoneyTransaction = require("../models/MoneyTransaction");
const router = express.Router();

// Mock Add Money Route
router.post("/add-money", async (req, res) => {
  try {
    const { userId, amount, bankAccount } = req.body;

    // Validate input
    if (!userId || !amount || amount <= 0 || !bankAccount) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    // Find user and update wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();
    const transaction = new MoneyTransaction({
      userId,
      type: "Deposit",
      amount,
      paymentMethod: "Bank Transfer",
      accountDetails: bankAccount,
      status: "Completed",
    });
    await transaction.save();

    await sendEmailNotificationAddMoney(user.email, amount, user.walletBalance);

    res.status(200).json({
      message: "Money added successfully!",
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    console.error("Error adding money:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;
