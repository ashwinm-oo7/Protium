const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stocks: [
      {
        stockId: { type: mongoose.Schema.Types.ObjectId, ref: "Stock" },
        quantity: { type: Number, required: true },
        purchasePrice: { type: Number, required: true },
        dateAdded: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { versionKey: false }
);

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
