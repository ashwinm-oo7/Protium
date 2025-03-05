const mongoose = require("mongoose");

const BankSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  ifscPrefix: { type: String, required: true }, // Example: "SBIN" for SBI
  branch: { type: String, required: true }, // Example: "Mumbai Main"
  city: { type: String, required: true }, // Example: "Mumbai"
  state: { type: String, required: true }, // Example: "Maharashtra"
  ifscCode: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Bank", BankSchema);
