const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    dailyChange: { type: Number, default: 0 },
    priceHistory: [
      {
        date: { type: Date, default: Date.now },
        price: { type: Number, required: true },
      },
    ],
    dateAdded: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
