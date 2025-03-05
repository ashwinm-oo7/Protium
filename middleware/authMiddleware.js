const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Unauthorized - Token Expired or Invalid" });
  }
};

module.exports = authMiddleware;
