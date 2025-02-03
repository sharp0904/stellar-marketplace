const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job", 
    required: true, 
    index: true  // ✅ Indexed for faster lookups
  }, 
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, 
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true  // ✅ Indexed for faster filtering
  }, 
  message: { 
    type: String, 
    required: true 
  }, 
  read: { 
    type: Boolean, 
    default: false 
  }, 
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Create an index to speed up queries involving job & receiver
MessageSchema.index({ job: 1, receiver: 1 });

module.exports = mongoose.model("Message", MessageSchema);
