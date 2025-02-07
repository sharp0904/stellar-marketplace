const express = require("express");
const auth = require("../middleware/auth");
const Job = require("../models/Job");
const mongoose = require("mongoose");

const router = express.Router();

// 📌 Create a New Job (Client Posts a Job)
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, budget, deadline, paymentMethod } = req.body;

    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const newJob = new Job({
      title,
      description,
      budget,
      client: req.user.id, // Ensures only authenticated clients can post jobs
      applicants: [],
      deadline,
      status: "open",
      paymentMethod,
    });

    await newJob.save();
    res.json(newJob);
  } catch (err) {
    console.error("❌ Error creating job:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});


// 📌 Get All Jobs (For Developers to Browse)
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("applicants", "_id name email")
      .sort({createdAt: -1}); // Fetch jobs from MongoDB
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Get Jobs Applied by Developer
router.get("/applied", auth, async (req, res) => {
  try {
    const jobs = await Job.find({ applicants: req.user.id });
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error fetching applied jobs:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Get Jobs a Developer Has Been Hired For
router.get("/hired", auth, async (req, res) => {
  try {
    const jobs = await Job.find({ selectedDeveloper: req.user.id });
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error fetching hired jobs:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Developer Applies to a Job
router.post("/apply/:jobId", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({ msg: "Invalid job ID" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    // Check if developer already applied
    if (job.applicants.includes(req.user.id)) {
      return res.status(400).json({ msg: "You have already applied for this job" });
    }

    job.applicants.push(req.user.id);
    await job.save();

    res.json({ msg: "Successfully applied for job", job });
  } catch (err) {
    console.error("❌ Error applying for job:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 View Applicants for a Job (Client Only)
router.get("/applicants/:jobId", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({ msg: "Invalid job ID" });
    }

    const job = await Job.findById(req.params.jobId).populate("applicants", "name email");
    if (!job) return res.status(404).json({ msg: "Job not found" });

    console.log(`🔍 User ${req.user.id} is checking applicants for job ${req.params.jobId}`);

    if (job.client.toString() !== req.user.id) {
      console.log(`🚨 Unauthorized Access: Job's client ID = ${job.client.toString()}, Request User ID = ${req.user.id}`);
      return res.status(403).json({ msg: "Unauthorized to view applicants" });
    }

    res.json({ applicants: job.applicants });
  } catch (err) {
    console.error("❌ Error fetching applicants:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Accept an Applicant (Client Hires Developer)
router.post("/accept/:jobId/:applicantId", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId) || !mongoose.isValidObjectId(req.params.applicantId)) {
      return res.status(400).json({ msg: "Invalid job or applicant ID" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    console.log(`🔍 Accept Debug - Job's Client ID: ${job.client.toString()} | Request User ID: ${req.user.id}`);

    if (job.client.toString() !== req.user.id) {
      console.log(`🚨 Unauthorized! This user is NOT the client.`);
      return res.status(403).json({ msg: "Unauthorized to accept applicants" });
    }

    if (!job.applicants.some((applicant) => applicant.equals(req.params.applicantId))) {
      return res.status(400).json({ msg: "Applicant not found in job applications" });
    }

    job.selectedDeveloper = new mongoose.Types.ObjectId(req.params.applicantId);
    job.status = "in progress";
    await job.save();

    res.json({ msg: "Developer hired successfully", job });
  } catch (err) {
    console.error("❌ Error accepting applicant:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

// 📌 Reject an Applicant (Client Removes Developer)
router.post("/reject/:jobId/:applicantId", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId) || !mongoose.isValidObjectId(req.params.applicantId)) {
      return res.status(400).json({ msg: "Invalid job or applicant ID" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    console.log(`🔍 Reject Debug - Job's Client ID: ${job.client.toString()} | Request User ID: ${req.user.id}`);

    if (job.client.toString() !== req.user.id) {
      console.log(`🚨 Unauthorized! This user is NOT the client.`);
      return res.status(403).json({ msg: "Unauthorized to reject applicants" });
    }

    job.applicants = job.applicants.filter(
      (applicant) => !applicant.equals(req.params.applicantId)
    );
    await job.save();

    res.json({ msg: "Applicant rejected successfully", job });
  } catch (err) {
    console.error("❌ Error rejecting applicant:", err);
    res.status(500).json({ msg: "Server error", error: err.toString() });
  }
});

module.exports = router;
