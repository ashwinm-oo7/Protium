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
const sendEmailNotificationAddMoney = async (email, amount, walletBalance) => {
  const mailOptions = {
    from: `"UpStock Wallet" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "💰 Money Added to Your Wallet",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #4CAF50; text-align: center;">🎉 Money Added Successfully!</h2>
        <p style="font-size: 16px; text-align: center;">Hello,</p>
        <p style="font-size: 16px; text-align: center;">You have successfully added <strong>$${amount.toFixed(
          2
        )}</strong> to your UpStock wallet.</p>
        
        <h3 style="color: #4CAF50; text-align: center;">💼 Wallet Details</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: center;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Added</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${amount.toFixed(
              2
            )}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Wallet Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${walletBalance.toFixed(
              2
            )}</td>
          </tr>
        </table>

        <br>
        <p style="text-align: center;">
          <a href="https://upstock-in.vercel.app/portfolio" style="display: inline-block; padding: 12px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Wallet</a>
        </p>

        <p style="font-size: 14px; text-align: center; color: gray;">
          If you didn't perform this transaction, please contact our support team immediately.
        </p>

        <br>
        <p style="font-size: 12px; text-align: center; color: #777;">© 2025 UpStock. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("💰 Add Money Email Sent Successfully");
  } catch (error) {
    console.error("❌ Error sending add money email:", error);
  }
};

const sendEmailNotificationWithdraw = async (email, amount, walletBalance) => {
  const mailOptions = {
    from: `"UpStock Wallet" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🚨 Withdrawal Successful!",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #D9534F; text-align: center;">⚠ Withdrawal Successful</h2>
        <p style="font-size: 16px; text-align: center;">Hello,</p>
        <p style="font-size: 16px; text-align: center;">You have successfully withdrawn <strong>$${amount.toFixed(
          2
        )}</strong> from your UpStock wallet.</p>
        
        <h3 style="color: #D9534F; text-align: center;">💼 Wallet Update</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: center;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Withdrawn</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${amount.toFixed(
              2
            )}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Wallet Balance</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${walletBalance.toFixed(
              2
            )}</td>
          </tr>
        </table>

        <br>
        <p style="text-align: center;">
          <a href="https://upstock-in.vercel.app/transactions" style="display: inline-block; padding: 12px 20px; background-color: #D9534F; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Transactions</a>
        </p>

        <p style="font-size: 14px; text-align: center; color: gray;">
          If you didn't perform this transaction, please contact our support team immediately.
        </p>

        <br>
        <p style="font-size: 12px; text-align: center; color: #777;">© 2025 UpStock. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Withdrawal Email Sent Successfully");
  } catch (error) {
    console.error("❌ Error sending withdrawal email:", error);
  }
};

module.exports = {
  sendEmailNotification,
  sendEmailNotificationAlert,
  sendEmailNotificationAddMoney,
  sendEmailNotificationWithdraw,
};
