const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: {
    type: [String], // ✅ Allow multiple roles
    enum: ["client", "developer"],
    default: [], // ✅ User selects roles during registration
  },
  walletAddress: { type: String, default: "" }, // Stellar Wallet Address
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
