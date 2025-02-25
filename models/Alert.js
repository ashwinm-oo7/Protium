const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  symbol: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  alertType: { type: String, enum: ["BUY", "SELL"], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Alert", alertSchema);
