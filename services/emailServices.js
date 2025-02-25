const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email notification to the user
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body
 */
const sendEmailNotification = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};
const sendEmailNotificationAlert = async (
  email,
  subject,
  transactionDetails
) => {
  const { stockName, stockSymbol, quantity, price, totalCost, walletBalance } =
    transactionDetails;

  const mailOptions = {
    from: `"Stock Alert 🚀" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Stock Transaction Alert 📈</h2>
        <p style="font-size: 16px;">Dear User,</p>
        <p style="font-size: 16px;">Your recent <strong>${subject}</strong> transaction was successful.</p>
        
        <h3>📊 Transaction Details:</h3>
        <ul style="font-size: 16px; list-style: none; padding: 0;">
          <li><strong>Stock Name:</strong> ${stockName} (${stockSymbol})</li>
          <li><strong>Quantity:</strong> ${quantity}</li>
          <li><strong>Price per Share:</strong> $${price.toFixed(2)}</li>
          <li><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</li>
        </ul>

        <p style="font-size: 16px;">💰 <strong>Updated Wallet Balance:</strong> $${walletBalance.toFixed(
          2
        )}</p>

        <br>
        <a href="https://upstock-in.vercel.app/transactions" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Transactions</a>
        <br><br>
        <p style="font-size: 14px; color: gray;">If you have any questions, contact support.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
};

module.exports = { sendEmailNotification, sendEmailNotificationAlert };
