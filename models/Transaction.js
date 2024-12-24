const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
    type: { type: String, enum: ["buy", "sell"], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    profitLoss: { type: Number },
    date: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
