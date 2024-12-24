const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
dotenv.config();
const errorHandler = require("./middleware/errorHandler");

const stockRoutes = require("./routes/stockRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const yahooRoutes = require("./controllers/yahooFinance");
const razorpayRoutes = require("./routes/RazorpayRoutes");
const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware setup
app.use(cors());
app.use(express.json());

require("./utils/cronJobs"); // This ensures the cron job is triggered
// Ensure environment variables are loaded correctly
const requiredEnvVars = [
  "MONGO_USERNAME",
  "MONGO_PASSWORD",
  "MONGO_URI",
  "dbName",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing environment variable: ${varName}`);
    throw new Error(`Environment variable ${varName} is missing`);
  }
});

// MongoDB URI construction
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const dbName = process.env.dbName;
const uri = `mongodb+srv://${username}:${encodeURIComponent(password)}@${
  process.env.MONGO_URI
}/${dbName}?retryWrites=true&w=majority`;

// Connect to MongoDB
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection failed:", err));

// Use routes

// Add protected route to the main server
app.use("/api/protected", protectedRoutes);

app.use("/api/stocks", stockRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/yahoo", yahooRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
