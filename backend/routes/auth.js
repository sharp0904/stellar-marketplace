const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

// 📌 User Registration (Sign Up)
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    check("walletAddress", "Name is required").not().isEmpty(),
    check("roles", "Roles must be an array containing 'client' or 'developer'")
      .isArray()
      .custom((roles) => roles.every((role) => ["client", "developer"].includes(role))),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { name, email, password, walletAddress, roles } = req.body;
    email = email.toLowerCase(); // ✅ Ensure email is always stored in lowercase

    try {
      let user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });

      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name,
        email,
        password: hashedPassword,
        roles,
        walletAddress,
      });

      await user.save();

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

      res.json({ token });
    } catch (err) {
      console.error("❌ Error during registration:", err);
      res.status(500).send("Server error");
    }
  }
);

// 📌 User Login (Fix: Return `userId`)
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { email, password } = req.body;
    email = email.toLowerCase(); // ✅ Ensure login is case-insensitive

    try {
      let user = await User.findOne({ email: { $regex: new RegExp("^" + email + "$", "i") } });

      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

      // ✅ FIXED: Now returns `userId` in response
      res.json({ token, userId: user.id, roles: user.roles });
    } catch (err) {
      console.error("❌ Error during login:", err);
      res.status(500).send("Server error");
    }
  }
);


// 📌 Get Logged-in User Data
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    res.status(500).send("Server error");
  }
});

// 📌 View User Profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).send("Server error");
  }
});

// 📌 Update User Profile
router.put("/update", auth, async (req, res) => {
  const { name, roles, password, walletAddress } = req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (name) user.name = name;
    if (roles) user.roles = roles;
    if (walletAddress) user.walletAddress = walletAddress;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
