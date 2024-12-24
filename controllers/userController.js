const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dns = require("dns");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const upload = require("../utils/FileUpload");
const dotenv = require("dotenv");
dotenv.config();

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

    // Validate OTP for login if necessary
    if (otp) {
      console.log("Submitted OTP:", otp);
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: { id: user._id, email: user.email },
      });
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
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    const user = await User.findOne({ email });
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
    if (!id) {
      return res.status(404).json({ message: "User not found" });
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
      base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`; // Convert to base64
    }
    return res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        profilePicBase64: base64Image, // Add base64 image to the response
      },
    });
  } catch (error) {
    console.error(
      `Error while fetching user profile for user ${id}:`,
      error.message
    );

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from the route parameter
    const { name, username } = req.body;

    const usernames = await User.findOne({ username });
    if (usernames) {
      return res.status(404).json({ message: "username exist!!!" });
    }

    const user = await User.findById(userId); // Find the user by their ID

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name; // Update user name if provided
    if (username) user.username = username; // Update username if provided

    await user.save(); // Save updated user details to database
    const { password, ...updatedUserDetails } = user.toObject();
    res
      .status(200)
      .json({ message: "User details updated successfully", user: updatedUserDetails });
  } catch (error) {
    console.error("Error updating user details:", error.message);
    res
      .status(500)
      .json({ message: "Error updating user details", error: error.message });
  }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure file is selected
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileExtension = path.extname(req.file.originalname);
    const isValidImage =
      allowedImageFormats.includes(req.file.mimetype) || allowedVideoFormats.includes(req.file.mimetype);
    if (!isValidImage) {
      return res.status(400).json({
        message: "Invalid file format. Only image or video files are allowed.",
      });
    }

    const profilePicPath = `./uploads/${userId}_${Date.now()}${fileExtension}`;
    fs.writeFileSync(profilePicPath, req.file.buffer);
    user.profilePic = profilePicPath;

    await user.save();
    const { password, ...userDetails } = user.toObject();
    res.status(200).json({ message: "Profile picture uploaded successfully", user: userDetails });
  } catch (error) {
    console.error("Error uploading profile picture:", error.message);
    res.status(500).json({ message: "Error uploading profile picture", error: error.message });
  }
};

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
