const express = require("express");
const auth = require("../middleware/auth");
const Job = require("../models/Job");
const { Keypair, SorobanRpc, Contract } = require("stellar-sdk");
require("dotenv").config();

const router = express.Router();

const PLATFORM_FEE_PERCENTAGE = 5; // ✅ Set platform fee percentage (5%)

// Soroban RPC URLs
const SOROBAN_RPC_TESTNET = "https://soroban-testnet.stellar.org";
const SOROBAN_RPC_MAINNET = "https://soroban-mainnet.stellar.org";

// Function to switch between testnet/mainnet
const getSorobanRpc = () => {
  return process.env.USE_MAINNET === "true" ? SOROBAN_RPC_MAINNET : SOROBAN_RPC_TESTNET;
};

// ✅ Create an Escrow Contract on Soroban
router.post("/create", auth, async (req, res) => {
  const { jobId } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only the client can create an escrow" });
    }

    if (job.escrowFunded) {
      return res.status(400).json({ msg: "Escrow already funded" });
    }

    const rpc = new SorobanRpc.Server(getSorobanRpc());
    const contract = new Contract(process.env.ESCROW_CONTRACT_ID);

    // Call Soroban Smart Contract to Create Escrow
    const response = await rpc.sendTransaction({
      contract: contract,
      function: "create_escrow",
      args: [
        job.client, 
        job.selectedDeveloper, 
        job.budget, 
        PLATFORM_FEE_PERCENTAGE
      ],
    });

    // Save escrow contract reference
    job.escrowFunded = true;
    job.escrowContractId = process.env.ESCROW_CONTRACT_ID;
    await job.save();

    res.json({ msg: "Escrow contract created", txHash: response.hash });
  } catch (err) {
    res.status(500).json({ msg: "Error creating escrow", error: err.toString() });
  }
});

// ✅ Release Payment from Escrow (With Platform Fee)
router.post("/release", auth, async (req, res) => {
  const { jobId } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only the client can release escrow funds" });
    }

    if (!job.escrowFunded) {
      return res.status(400).json({ msg: "No escrow funds available" });
    }

    const rpc = new SorobanRpc.Server(getSorobanRpc());
    const contract = new Contract(job.escrowContractId);

    // Call Soroban Smart Contract to Release Payment
    const response = await rpc.sendTransaction({
      contract: contract,
      function: "release_payment",
      args: [],
    });

    job.status = "completed";
    await job.save();

    res.json({ msg: "Payment released successfully", txHash: response.hash });
  } catch (err) {
    res.status(500).json({ msg: "Error releasing payment", error: err.toString() });
  }
});

module.exports = router;
