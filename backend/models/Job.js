const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Job owner (Client)
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Developers who applied (Stored as ObjectId)
  selectedDeveloper: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Developer hired

  status: { 
    type: String, 
    enum: ["open", "in progress", "completed"], 
    default: "open" 
  }, // ✅ Job status

  deadline: { type: Date, required: true }, // ✅ Job deadline
  escrowAddress: { type: String, default: "" }, // ✅ Escrow Account Address
  escrowFunded: { type: Boolean, default: false }, // ✅ Whether escrow is funded

  createdAt: { type: Date, default: Date.now }
});

// ✅ Ensure applicants field always stores ObjectIds correctly
JobSchema.pre("save", function (next) {
  if (this.applicants && this.applicants.length > 0) {
    this.applicants = this.applicants.map((applicant) => 
      new mongoose.Types.ObjectId(applicant)
    );
  }
  next();
});

module.exports = mongoose.model("Job", JobSchema);
