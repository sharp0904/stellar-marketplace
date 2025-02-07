const express = require("express");
const auth = require("../middleware/auth");
const Job = require("../models/Job");
const User = require("../models/User");
const StellarSdk = require("stellar-sdk"); // ✅ Ensure proper import
require("dotenv").config();

const router = express.Router();
const TESTNET = process.env.STELLAR_TESTNET;
const server = new StellarSdk.Horizon.Server(
  TESTNET ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org"
);
const PLATFORM_FEE_PERCENTAGE = 5;

// 📌 Choose Payment Method (Client Selects)
router.post("/choose", auth, async (req, res) => {
  const { jobId, paymentMethod } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized to choose payment" });
    }

    job.paymentMethod = paymentMethod;
    await job.save();

    res.json({ msg: "Payment method updated successfully", job });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Direct Payment (Client Pays Developer Instantly)
router.post("/pay", auth, async (req, res) => {
  const { jobId } = req.body;

  try {
    const job = await Job.findById(jobId).populate("selectedDeveloper");
    if (!job || job.paymentMethod !== "direct") return res.status(400).json({ msg: "Invalid payment method" });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ msg: "Unauthorized" });
    if (!job.selectedDeveloper.walletAddress) return res.status(402).json({ msg: "Developer's wallet not connected" })

    const clientKeypair = StellarSdk.Keypair.fromSecret(process.env.CLIENT_SECRET);
    const clientAccount = await server.loadAccount(clientKeypair.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(clientAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: TESTNET ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: job.selectedDeveloper.walletAddress,
          asset: StellarSdk.Asset.native(),
          amount: job.budget.toString(),
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(clientKeypair);
    await server.submitTransaction(transaction);

    job.status = "completed";
    await job.save();

    res.json({ msg: "Payment successful", job });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Milestone Payments (Client Sends Partial Payments)
router.post("/milestone", auth, async (req, res) => {
  const { jobId, milestoneAmount } = req.body;

  try {
    const job = await Job.findById(jobId).populate("selectedDeveloper");
    if (!job || job.paymentMethod !== "milestone") return res.status(400).json({ msg: "Invalid payment method" });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ msg: "Unauthorized" });

    const clientKeypair = StellarSdk.Keypair.fromSecret(process.env.CLIENT_SECRET);
    const clientAccount = await server.loadAccount(clientKeypair.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(clientAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: TESTNET ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: job.selectedDeveloper.walletAddress,
          asset: StellarSdk.Asset.native(),
          amount: milestoneAmount.toString(),
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(clientKeypair);
    await server.submitTransaction(transaction);

    res.json({ msg: "Milestone payment sent", milestoneAmount });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Escrow Payment Using Smart Contracts
router.post("/escrow", auth, async (req, res) => {
  const { jobId } = req.body;

  try {
    const job = await Job.findById(jobId).populate("selectedDeveloper");
    if (!job || job.paymentMethod !== "escrow") return res.status(400).json({ msg: "Invalid payment method" });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ msg: "Unauthorized" });

    // Call Soroban smart contract for escrow
    const escrowResult = await callEscrowContract(job);

    job.status = "escrowed";
    await job.save();

    res.json({ msg: "Escrow payment initiated", escrowResult });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Release Escrow Payment (Client Approves)
router.post("/release-escrow", auth, async (req, res) => {
  const { jobId } = req.body;

  try {
    const job = await Job.findById(jobId).populate("selectedDeveloper");
    if (!job || job.paymentMethod !== "escrow" || job.status !== "escrowed") {
      return res.status(400).json({ msg: "Invalid escrow release" });
    }
    if (job.client.toString() !== req.user.id) return res.status(403).json({ msg: "Unauthorized" });

    // Call Soroban smart contract for release
    const releaseResult = await releaseEscrowContract(job);

    job.status = "completed";
    await job.save();

    res.json({ msg: "Escrow payment released", releaseResult });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Interact with Soroban Smart Contract
async function callEscrowContract(job) {
  // TODO: Implement Soroban contract call for funding escrow
  return { success: true, jobId: job.id, message: "Escrow funded successfully." };
}

async function releaseEscrowContract(job) {
  // TODO: Implement Soroban contract call for releasing escrow
  return { success: true, jobId: job.id, message: "Escrow released successfully." };
}

module.exports = router;
