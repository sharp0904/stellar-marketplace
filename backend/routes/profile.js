const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

// Test Route
router.get("/", auth, (req, res) => {
    res.json({ msg: "Profile route working" });
});

module.exports = router;
