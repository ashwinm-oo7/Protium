const express = require("express");
const Alert = require("../models/Alert");

const router = express.Router();

// Create a new alert
router.post("/create", async (req, res) => {
  try {
    const { userId, symbol, targetPrice, alertType } = req.body;

    if (!userId || !symbol || !targetPrice || !alertType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const alert = new Alert({ userId, symbol, targetPrice, alertType });
    await alert.save();

    res.status(201).json({ message: "Alert created successfully", alert });
  } catch (error) {
    res.status(500).json({ message: "Error creating alert", error });
  }
});

// Fetch alerts for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const alerts = await Alert.find({ userId });

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching alerts", error });
  }
});

// Delete an alert
router.delete("/:alertId", async (req, res) => {
  try {
    const { alertId } = req.params;
    await Alert.findByIdAndDelete(alertId);

    res.status(200).json({ message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting alert", error });
  }
});

module.exports = router;
