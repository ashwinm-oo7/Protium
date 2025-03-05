const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["Deposit", "Withdrawal", "Buy", "Sell"],
    required: true,
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true }, // "Bank Transfer" or "UPI"
  accountDetails: { type: String, required: true }, // UPI ID or Bank Account
  status: {
    type: String,
    enum: ["Pending", "Completed", "Rejected"],
    default: "Pending",
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MoneyTransaction", transactionSchema);
