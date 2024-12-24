const transporter = require("../config/nodemailerConfig");
const client = require("../config/redisClient");
const User = require("../models/User");

exports.generateOtp = () => ({
  otp: Math.floor(100000 + Math.random() * 900000),
  expiresAt: Date.now() + 5 * 60 * 200, // Current time + 5 minutes
});

exports.sendOtp = async (req, res) => {
  try {
    const { email, mobile, reset } = req.body;
    let userEmail;

    if (email) {
      userEmail = email;
      // Validate email and send OTP
    } else if (mobile) {
      const user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      userEmail = user.email;
      // Validate mobile and send OTP
    } else {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    let subject = "";
    if (reset) {
      if (!(await User.findOne({ email: userEmail }))) {
        return res
          .status(400)
          .json({ success: false, message: "Email doesn't exist." });
      }
    } else {
      if (await User.findOne({ email: userEmail })) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists." });
      }
    }
    if (!email && !mobile) {
      return res
        .status(400)
        .json({ success: false, message: "Email required." });
    }

    if (reset) {
      subject = "M-Stock Password-Change Verify Your OTP Code";
    } else {
      subject = "M-Stock Verify Your Email OTP Code";
    }
    const otpData = this.generateOtp();

    // Send email
    if (!client.isOpen) {
      await client.connect();
    }

    await client.setEx(`otp:${userEmail}`, 300, JSON.stringify(otpData));

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
        return res
          .status(500)
          .json({ success: false, message: "Failed to send OTP.", error: err });
      }
      res.status(200).json({
        success: true,
        message: "OTP sent.",
        otpData,
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
