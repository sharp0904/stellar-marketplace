const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");
const StellarSdk = require("stellar-sdk");

const router = express.Router();

const USE_TESTNET = true;

const server = new StellarSdk.Horizon.Server(
  USE_TESTNET ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org"
);
const networkPassphrase = USE_TESTNET ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;

// 📌 Connect a Stellar Wallet (Store Public Key)
router.post("/connect", auth, async (req, res) => {
  const { walletAddress } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.walletAddress = walletAddress;
    await user.save();

    res.json({ msg: "Wallet connected successfully", walletAddress: user.walletAddress });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Get Stellar Account Balance
router.get("/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.walletAddress) {
      return res.status(400).json({ msg: "No wallet connected" });
    }

    // Fetch balance from Stellar
    const account = await server.loadAccount(user.walletAddress);
    const balances = account.balances.map((balance) => ({
      asset: balance.asset_type === "native" ? "XLM" : balance.asset_code,
      balance: balance.balance,
    }));

    res.json({ walletAddress: user.walletAddress, balances });
  } catch (err) {
    res.status(500).json({ msg: "Error retrieving wallet balance", error: err.toString() });
  }
});

// 📌 Send XLM Payment from One User to Another
router.post("/send", auth, async (req, res) => {
  const { recipientAddress, amount, secretKey } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.walletAddress) {
      return res.status(400).json({ msg: "You must connect a wallet first" });
    }

    // Validate transaction amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ msg: "Invalid transaction amount" });
    }

    // Fetch sender's balance
    const account = await server.loadAccount(user.walletAddress);
    const balance = account.balances.find(b => b.asset_type === "native");

    if (!balance || parseFloat(balance.balance) < parseFloat(amount)) {
      return res.status(400).json({ msg: "Insufficient XLM balance" });
    }

    // Create Stellar transaction
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const destination = recipientAddress;

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: destination,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();

    // Sign transaction
    transaction.sign(sourceKeypair);

    // Submit transaction
    const transactionResult = await server.submitTransaction(transaction);

    res.json({
      msg: "Payment sent successfully",
      transactionHash: transactionResult.hash
    });

  } catch (err) {
    res.status(500).json({ msg: "Error processing payment", error: err.toString() });
  }
});

module.exports = router;
