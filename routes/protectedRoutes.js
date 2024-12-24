const express = require("express");
const authenticate = require("../middleware/auth");
const router = express.Router();

router.get("/protected", authenticate, (req, res) => {
  res
    .status(200)
    .json({ message: "This is a protected route", user: req.user });
});

module.exports = router;
