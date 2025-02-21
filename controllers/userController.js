const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dns = require("dns");
const User = require("../models/User");
const client = require("../config/redisClient");
const mongoose = require("mongoose");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const upload = require("../utils/FileUpload");
const dotenv = require("dotenv");
dotenv.config();
// const otpGenerator = require("otp-generator");
let otpStorage = {}; // Temporary storage for OTPs (you can use a DB for production)

const { check, validationResult } = require("express-validator");
const transporter = require("../config/nodemailerConfig");

const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@])[A-Za-z\d@]{6,}$/;
  return passwordRegex.test(password);
};

const allowedImageFormats = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const allowedVideoFormats = ["video/mp4", "video/webm", "video/ogg"];

exports.registerUser = async (req, res) => {
  try {
    const { name, email, username, password, otp } = req.body;

    // Validate the request data
    if (!name || !email || !username || !password || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUsers = await User.findOne({ email });
    if (newUsers) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    const otpDataString = await client.get(`otp:${email}`);
    const otpData = JSON.parse(otpDataString);

    if (!otpDataString) {
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new one." });
    }
    if (otpData.expiresAt < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }
    if (otpData.otp !== parseInt(otp, 10)) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    await client.del(`otp:${email}`);

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long, include one uppercase letter, one lowercase letter, one digit, and the '@' symbol.",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });

    // Save the new user to the database
    await newUser.save();
    const { password: _, ...userDetails } = newUser.toObject();

    res
      .status(201)
      .json({ message: "User created successfully", user: userDetails });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    if (otp) {
      console.log("Submitted OTP:", otpStorage[email]);
      console.log("Submitted OTP Type:", typeof otp);

      if (otpStorage[email]) {
        const { otps: storedOtp, timestamp } = otpStorage[email];
        const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes expiry time
        console.log("Submitted OTP:", otp);

        // Check if OTP has expired
        if (Date.now() - timestamp > OTP_EXPIRY_TIME) {
          return res.status(400).json({ message: "OTP has expired" });
        }
        console.log(storedOtp === Number(otp), storedOtp, otp);
        // Validate OTP
        if (storedOtp === Number(otp)) {
          // OTP is valid, issue JWT token
          const user = await User.findOne({ email });
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

          const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
          );

          // Clear OTP from storage after successful verification
          delete otpStorage[email];

          // Send response with token and user info
          return res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, email: user.email },
          });
        } else {
          return res.status(401).json({ message: "Invalid OTP" });
        }
      } else {
        return res.status(404).json({ message: "OTP not found or expired" });
      }
    }
    // Validate the request data
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const otps = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    otpStorage[email] = {
      otps,
      timestamp: Date.now(), // Store OTP and timestamp
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP for login is: ${otps}`,
    };
    console.log("Stored OTP:", otpStorage[email]);
    await transporter.sendMail(mailOptions);

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
    let base64Image = null;

    if (user.profilePic) {
      try {
        const imageBuffer = fs.readFileSync(user.profilePic); // Read file from server
        base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`; // Convert to base64
      } catch (err) {
        console.error("Error reading profile picture:", err.message);
        base64Image = null; // Set null if file cannot be read
      }
    }

    const { password: _, ...userDetails } = user.toObject();
    userDetails.profilePicBase64 = base64Image;
    res
      .status(200)
      .json({ message: "Login successful", token, user: userDetails });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
};
// Change Password Endpoint
exports.changePassword = async (req, res) => {
  try {
    const { email, otp, newPassword, mobile } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }
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

    console.log(email, otp, newPassword);
    // Verify OTP first
    const storedOtp = await client.get(`otp:${userEmail}`);
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or does not exist.",
      });
    }

    const otpData = JSON.parse(storedOtp);

    if (otpData.otp !== parseInt(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (Date.now() > otpData.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    // OTP is valid, now change the user's password
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;

    await user.save();

    // Clear OTP from Redis after password change
    await client.del(`otp:${userEmail}`);

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Error in changePassword:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while changing the password.",
      error: error.message,
    });
  }
};

exports.validateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Email Checking ", email);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required..." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const domain = email.split("@")[1];
    if (!domain) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    dns.resolveMx(domain, (err, addresses) => {
      if (err || addresses.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or non-existent email domain",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Valid email domain",
        });
      }
    });
  } catch (error) {
    console.error("Error in verify Email:", error.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    if (!id) {
      console.log("user not found");
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    let base64Image = null;

    if (user.profilePic) {
      const imageBuffer = fs.readFileSync(user.profilePic); // Read file from server
      if (imageBuffer) {
        base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`; // Convert to base64
      } else {
        return null;
      }
    }
    return res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        profilePicBase64: base64Image || null, // Add base64 image to the response
      },
    });
  } catch (error) {
    console.error(
      `Error while fetching user profile for user :`,
      error.message
    );

    res.status(500).json({ success: false, message: error.message });
  }
};

// API endpoint to update the profile image

exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from the route parameter
    const { name, username } = req.body;
    const usernames = await User.findOne({ username });
    if (usernames) {
      return res.status(404).json({ message: "username exist!!!" });
    }

    // Find user by ID and update details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, username },
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.validatePasswordChange = [
  check("oldPassword").notEmpty().withMessage("Old password is required."),
  check("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters."),
];

exports.oldPasswordChanged = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { oldPassword, newPassword } = req.body;

  try {
    const userId = req.params.id;

    // Fetch user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the password.",
    });
  }
};

exports.updateProfilePic = async (req, res) => {
  const { id } = req.params;
  const { base64Image } = req.body;

  try {
    // Fetch user by ID
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let savedFilePath = null;

    if (req.file) {
      // Handle multer file upload
      savedFilePath = req.file.path;
      user.profilePic = savedFilePath;
      user.base64Data = null; // Clear previous base64 data
    } else if (base64Image) {
      // Validate and save base64 image
      if (Buffer.byteLength(base64Image, "base64") > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Base64 image size exceeds the limit of 5MB.",
        });
      }

      savedFilePath = await saveBase64Image(base64Image);
      user.profilePic = savedFilePath;
      user.base64Data = null; // Clear previous base64 data
    } else {
      return res.status(400).json({
        success: false,
        message: "No file or base64 image provided.",
      });
    }

    await user.save(); // Save updated user data

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePic: user.profilePic,
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Multer error: ${error.message}`,
      });
    } else {
      console.error(`Error updating profile picture for user ${id}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the profile picture.",
      });
    }
  }
};

// Helper function to handle base64 image processing
const saveBase64Image = async (base64Image) => {
  try {
    const base64Data = base64Image.split(";base64,").pop(); // Extract base64 content
    const uploadDir = path.join(
      "C:/Users/Ashwin/Downloads/Upgrad Stock and Adharcard/stockImage"
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `profile-${Date.now()}.png`);
    fs.writeFileSync(filePath, base64Data, { encoding: "base64" });
    return filePath;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    throw new Error("Failed to save base64 image.");
  }
};
