const transporter = require("../config/nodemailerConfig");
const User = require("../models/User");
const { setCache } = require("../utils/cache"); // Import setCache

exports.generateOtp = () => ({
  otp: Math.floor(100000 + Math.random() * 900000),
  expiresAt: Date.now() + 5 * 60 * 1000, // Current time + 5 minutes
});

exports.sendOtp = async (req, res) => {
  try {
    const { email, mobile, reset } = req.body;
    let userEmail;

    if (email) {
      userEmail = email;
    } else if (mobile) {
      const user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      userEmail = user.email;
    } else {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    if (reset) {
      if (!(await User.findOne({ email: userEmail }))) {
        return res.status(400).json({ success: false, message: "Email doesn't exist." });
      }
    } else {
      if (await User.findOne({ email: userEmail })) {
        return res.status(400).json({ success: false, message: "Email already exists." });
      }
    }

    const subject = reset
      ? "M-Stock Password-Change Verify Your OTP Code"
      : "M-Stock Verify Your Email OTP Code";

    const otpData = this.generateOtp();

    // Store OTP in NodeCache
    setCache(userEmail, otpData.otp);

    // Simulate sending OTP (log it for now)
    console.log(`OTP for ${userEmail}: ${otpData.otp}`);

    const mailOptions = {
      from: '"M-Stock" <ashwinmaurya1997@gmail.com>',
      to: userEmail,
      subject: subject,
      text: `Your OTP is ${otpData.otp}. It is valid for 5 minutes.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to send OTP.", error: err });
      }
      res.status(200).json({
        success: true,
        message: "OTP sent.",
        mailInfo: info,
      });
    });
  } catch (error) {
    console.error("Error in sendOtp:", error.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};
