const mongoose = require("mongoose");

const BankAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bankName: { type: String, required: true },
  branch: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  ifscCode: { type: String, required: true, match: /^[A-Z]{4}0[A-Z0-9]{6}$/ }, // Standard IFSC format
  accountNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return /^[1-9][0-9]{8,17}$/.test(value); // Account Number must be 9-18 digits and not start with 0
      },
      message:
        "Invalid Account Number! It should be 9-18 digits and cannot start with 0.",
    },
  },
  upiId: { type: String, match: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/ }, // Optional UPI validation
  accountHolderName: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const BankAccount = mongoose.model("BankAccount", BankAccountSchema);
module.exports = BankAccount;
