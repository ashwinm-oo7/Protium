const express = require("express");
const router = express.Router();
const dns = require("dns");
// const { config } = require("dotenv");
const path = require("path");
const fs = require("fs");

require("dotenv").config();
const User = require("../models/User");
const { sendOtp } = require("../controllers/mailController");
const {
  registerUser,
  loginUser,
  validateEmail,
  changePassword,
  getUserProfile,

  updateUserDetails,
  oldPasswordChanged,
  validatePasswordChange,
  updateProfilePic,
} = require("../controllers/userController");
const upload = require("../utils/FileUpload");

// Send OTP
router.post("/send-otp", sendOtp);

router.post("/register", registerUser);

router.post("/login", loginUser);

// API endpoint to validate email domain
router.post("/validate-email", validateEmail);

router.post("/change-password", changePassword);

router.get("/user-profile/:id", getUserProfile);

router.post(
  "/updateProfilePic/:id",
  upload.single("profilePic"),
  updateProfilePic
);

router.put("/updateDetails/:userId", updateUserDetails);

// Change Password API
router.post("/password-change/:id", validatePasswordChange, oldPasswordChanged);

module.exports = router;
