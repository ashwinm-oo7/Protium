const { number } = require("joi");
const mongoose = require("mongoose");

// Define the schema for User with required fields
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletBalance: {
      type: Number,
      default: 0, // Default wallet balance
    },
    profilePic: { type: String, default: "" },
    mobile: { type: Number },
    base64Data: { type: String, default: null }, // Base64 image data (optional)
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
