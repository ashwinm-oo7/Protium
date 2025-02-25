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
      subject = "UpStock Password-Change Verify Your OTP Code";
    } else {
      subject = "UpStock Verify Your Email OTP Code";
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
      from: '"UpStock" <ashwinmaurya1997@gmail.com>',
      to: userEmail,
      subject: subject,
      // text: `Your OTP is ${otpData.otp}. It is valid for 5 minutes.`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center;">
          <a href="https://upstock-in.vercel.app/">
            <img src="https://res.cloudinary.com/dgw6uprvj/image/upload/v1740343304/cdb5a94a-72b8-4682-bec5-279944c4471d_te1b75.jpg" alt="Company Logo" style="max-width: 150px; margin-bottom: 10px;">
          </a>
        </div>
        <h2 style="text-align: center; color: #333;">🔒 Secure  OTP</h2>
        <h2 style="text-align: center; color: #333;">Do Not Share AnyOne</h2>
        <p style="text-align: center; font-size: 18px;">Use the OTP below to verify in securely:</p>
    <div style="text-align: center; font-size: 24px; font-weight: bold; background: #f3f3f3; padding: 15px; border-radius: 5px; width: 50%; margin: auto; cursor: pointer;" onclick="copyToClipboard('${otpData.otp}')">
          ${otpData.otp}
        </div>
        <p style="text-align: center; margin-top: 10px;">This OTP is valid for only 1 minute.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://upstock-in.vercel.app/login" style="background-color: #28a745; color: white; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">Login Now</a>
        </div>
        <script>
      
      function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
          alert('OTP copied to clipboard!');
        }, function(err) {
          console.error('Could not copy OTP: ', err);
        });
      }
    </script>
      </div>
      `,
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
