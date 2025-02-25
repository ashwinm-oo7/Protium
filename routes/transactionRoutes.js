const express = require("express");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const {
  recordBuyTransaction,
  recordSellTransaction,
  getTransactionHistory,
} = require("../controllers/transactionController");
const User = require("../models/User");

const router = express.Router();

// Email Notification Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailNotification = async (email, subject, message) => {
  const mailOptions = {
    from: `"Stock Alert 🚀" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Stock Transaction Alert 📈</h2>
        <p style="font-size: 16px;">Dear User,</p>
        <p style="font-size: 16px;">${message}</p>
        <p style="font-size: 16px;">Check your transaction history for details.</p>
        <br>
        <a href="https://upstock-in.vercel.app/transactions" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Transactions</a>
        <br><br>
        <p style="font-size: 14px; color: gray;">If you have any questions, contact support.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
};

// Middleware to send notifications after transactions
const notifyTransaction = async (req, res, next) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (user) {
    const message = `Your recent transaction has been successfully processed.`;
    sendEmailNotification(user.email, "Stock Transaction Alert", message);
  }
  next();
};

// Record buy transaction
router.post("/buy", recordBuyTransaction);

// Record sell transaction
router.post("/sell", recordSellTransaction);

// Get transaction history for a user
router.get("/history/:userId", getTransactionHistory);

module.exports = router;
