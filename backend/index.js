const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const app = express();
const server = http.createServer(app); // Create HTTP server for WebSockets
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/jobs", require("./routes/job"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/messages", require("./routes/message")); 
app.use("/api/escrow", require("./routes/escrow")); 
app.use("/api/payments", require("./routes/payments")); // ✅ Added payments Routes

// Default Route
app.get("/", (req, res) => {
  res.send("Stellar Developer Marketplace API is Running 🚀");
});

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("🔗 A user connected:", socket.id);

  // Join Room for a Specific Job
  socket.on("joinRoom", ({ jobId }) => {
    socket.join(jobId);
    console.log(`✅ User joined room: ${jobId}`);
  });

  // Handle Sending Messages
  socket.on("sendMessage", async ({ jobId, sender, receiver, message }) => {
    console.log(`📨 Message Sent in Job ${jobId}:`, message);

    // Save message in database
    const Message = require("./models/Message");
    const newMessage = new Message({ job: jobId, sender, receiver, message });
    await newMessage.save();

    // Send message to everyone in the job room
    io.to(jobId).emit("receiveMessage", newMessage);
  });

  // ✅ Handle Read Receipts
  socket.on("markAsRead", async ({ messageId }) => {
    const Message = require("./models/Message");

    const message = await Message.findById(messageId);
    if (message) {
      message.read = true;
      await message.save();

      io.to(message.job.toString()).emit("messageRead", { messageId });
      console.log(`✅ Message ${messageId} marked as read`);
    }
  });

  // ✅ Handle Typing Indicators
  socket.on("typing", ({ jobId, sender }) => {
    io.to(jobId).emit("userTyping", { sender });
  });

  socket.on("stopTyping", ({ jobId, sender }) => {
    io.to(jobId).emit("userStoppedTyping", { sender });
  });

  // Handle Disconnection
  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
