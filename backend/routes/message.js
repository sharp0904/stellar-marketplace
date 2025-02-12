const express = require("express");
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Job = require("../models/Job");
const mongoose = require("mongoose");

const router = express.Router();

// 📌 Send a Message (Client or Developer)
router.post("/send", auth, async (req, res) => {
  const { jobId, receiverId, message } = req.body;

  try {
    if (!jobId || !receiverId || !message) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Validate jobId and receiverId
    if (!mongoose.isValidObjectId(jobId) || !mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ msg: "Invalid job or user ID format" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    // Allow messages only between the job client, applicants, and hired developer
    const isClient = job.client.toString() === req.user.id;
    const isApplicant = job.applicants.some((applicant) => applicant.toString() === req.user.id);
    const isHiredDeveloper = job.selectedDeveloper?.toString() === req.user.id;

    if (!isClient && !isApplicant && !isHiredDeveloper) {
      return res.status(403).json({ msg: "You are not authorized to message on this job" });
    }

    const newMessage = new Message({
      job: jobId, 
      sender: req.user.id,
      receiver: receiverId,
      message,
    });

    await newMessage.save();
    res.json({ msg: "Message sent successfully", newMessage });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Get All Messages for a Job (Client, Applicants & Hired Developer)
router.get("/:jobId", auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ msg: "Invalid job ID format" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    // Allow only job participants to access messages
    const isClient = job.client.toString() === req.user.id;
    const isApplicant = job.applicants.some((applicant) => applicant.toString() === req.user.id);
    const isHiredDeveloper = job.selectedDeveloper?.toString() === req.user.id;

    if (!isClient && !isApplicant && !isHiredDeveloper) {
      return res.status(403).json({ msg: "You are not authorized to view messages for this job" });
    }

    const messages = await Message.find({ job: jobId })
      // .populate("sender", "name email")
      // .populate("receiver", "name email")
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

module.exports = router;
