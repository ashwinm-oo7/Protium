const axios = require("axios");
const Alert = require("../models/Alert");
const User = require("../models/User");
const { sendEmailNotification } = require("./emailServices");

/**
 * Check stock prices and send email alerts if target price is met
 */
const checkStockAlerts = async () => {
  try {
    console.log("🔍 Checking stock price alerts...");

    const alerts = await Alert.find();
    for (const alert of alerts) {
      const { userId, symbol, targetPrice, alertType } = alert;
      const user = await User.findById(userId);
      if (!user) continue;
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${process.env.API_KEY}`;
      // Fetch the latest stock price
      const response = await axios.get(url);
      const currentPrice = response.data.currentPrice;
      console.log(response.data);

      // Check if the price meets the alert condition
      if (
        (alertType === "BUY" && currentPrice <= targetPrice) ||
        (alertType === "SELL" && currentPrice >= targetPrice)
      ) {
        // Send email notification
        const subject = `📈 Stock Alert: ${symbol}`;
        const message = `The stock ${symbol} has reached your alert price of $${targetPrice}. Current price: $${currentPrice}.`;

        await sendEmailNotification(user.email, subject, message);

        console.log(`✅ Alert triggered for ${symbol} at ${currentPrice}`);

        // Remove alert after sending (optional)
        await Alert.findByIdAndDelete(alert._id);
      }
    }
  } catch (error) {
    console.error("❌ Error checking stock alerts:", error);
  }
};

module.exports = { checkStockAlerts };
