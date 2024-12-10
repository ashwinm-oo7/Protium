const express = require("express");
const {
  recordBuyTransaction,
  recordSellTransaction,
  getTransactionHistory,
} = require("../controllers/transactionController");

const router = express.Router();

// Record buy transaction
router.post("/buy", recordBuyTransaction);

// Record sell transaction
router.post("/sell", recordSellTransaction);

// Get transaction history for a user
router.get("/history/:userId", getTransactionHistory);

module.exports = router;
