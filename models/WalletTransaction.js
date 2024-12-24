const mongoose = require("mongoose");

const wallettransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["add_money"], required: true }, // Transaction type
  amount: { type: Number, required: true }, // Amount added
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WalletTransaction", wallettransactionSchema);
