const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("🔹 Checking Auth Header:", authHeader); // ✅ Debugging

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token
  console.log("🔹 Extracted Token:", token); // ✅ Debugging

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔹 Decoded Token:", decoded); // ✅ Debugging
    req.user = decoded.user; // Attach user data
    next();
  } catch (err) {
    console.error("❌ Token Verification Failed:", err);
    res.status(401).json({ msg: "Unauthorized: Invalid token" });
  }
};

