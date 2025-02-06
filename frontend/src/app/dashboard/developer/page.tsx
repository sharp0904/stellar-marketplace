"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import Profile from "@/app/components/profileList";

interface Job {
  _id: string;
  title: string;
  description: string;
  client: string;
}

interface Message {
  job: string;
  message: string;
  read: boolean;
  receiver: string;
  sender: string;
  timestamp: string;
  __v: number;
  _id: string;
}

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
  transports: ["websocket"],
});

const DeveloperDashboard = () => {
  const { token, user } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [showChat, setShowChat] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";
  const MESSAGE_API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/messages";

  useEffect(() => {
    fetchAppliedJobs();
    fetchAvailableJobs();
  }, [token]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      socket.emit("joinRoom", { jobId: activeChat });
    }

    socket.on("receiveMessage", (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on("userTyping", ({ sender }) => {
      if (sender !== user) setTyping(true);
    });

    socket.on("messageRead", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, read: true } : msg))
      );
    });

    socket.on("userStoppedTyping", () => setTyping(false));

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [activeChat]);

  // ✅ Detect if user scrolls to bottom
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10; // Small threshold for smoothness

    if (isAtBottom) {
      const unreadMessages = messages.filter((msg) => !msg.read && msg.receiver === user);
      unreadMessages.forEach((msg) => {
        socket.emit("markAsRead", { messageId: msg._id });
      });
    }
  };

  useEffect(() => {
    const chatBox = chatContainerRef.current;
    if (chatBox) {
      chatBox.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (chatBox) {
        chatBox.removeEventListener("scroll", handleScroll);
      }
    };
  }, [messages]);

  // ✅ Fetch Jobs Applied By Developer
  const fetchAppliedJobs = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/applied`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch applied jobs");

      const data = await res.json();
      setAppliedJobs(data || []);
    } catch (err) {
      console.error("❌ Error fetching applied jobs:", err);
      setError("Error fetching applied jobs");
    }
  };

  // ✅ Fetch Available Jobs
  const fetchAvailableJobs = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch available jobs");

      const data = await res.json();
      setAvailableJobs(data || []);
    } catch (err) {
      console.error("❌ Error fetching available jobs:", err);
      setError("Error fetching available jobs");
    }
  };

  // ✅ Apply for a Job
  const applyForJob = async (jobId: string) => {
    try {
      const res = await fetch(`${API_URL}/apply/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to apply for job");

      const job = availableJobs.find((job) => job._id === jobId);
      if (job) {
        setAppliedJobs((prev) => [...prev, job]);
        setAvailableJobs((prev) => prev.filter((job) => job._id !== jobId));
      }

      fetchAppliedJobs();
    } catch (err) {
      console.error("❌ Error applying for job:", err);
      setError("Failed to apply for job");
    }
  };

  // ✅ Fetch Messages
  const fetchMessages = async (jobId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${MESSAGE_API_URL}/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      setError("Error fetching messages");
    }
  };

  // ✅ Send a Message
  const sendMessage = async () => {
    if (!token || !user || !activeChat || !newMessage.trim()) return;

    const messageData = {
      jobId: activeChat,
      sender: user,
      receiver: receiver,
      message: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  return (
    <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
      <div className="p-6 text-gray-600 dark:text-gray-300 w-full">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          <Profile />
        </div>
        <p>Find jobs, submit applications, and chat with clients.</p>

        {error && <p className="text-red-500">{error}</p>}

        {/* ✅ Available Jobs */}
        <h2 className="text-xl font-semibold mt-6">Available Jobs</h2>
        {availableJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {availableJobs.map((job) => (
              <div key={job._id} className="border p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{job.description}</p>
                <button
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => applyForJob(job._id)}
                  disabled={appliedJobs.some((appliedJob) => appliedJob._id === job._id)}
                >
                  {appliedJobs.some((appliedJob) => appliedJob._id === job._id)
                    ? "Already Applied"
                    : "Apply Now"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No available jobs.</p>
        )}

        {/* ✅ Applied Jobs with Chat */}
        <h2 className="text-xl font-semibold mt-6">Applied Jobs</h2>
        {appliedJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            {appliedJobs.map((job) => (
              <div key={job._id} className="border p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <button
                  className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
                  onClick={() => {
                    setActiveChat(job._id);
                    setReceiver(job.client)
                    fetchMessages(job._id);
                    setShowChat(!showChat);
                  }}
                >
                  Chat with Client
                </button>

                {/* ✅ Chat UI */}
                {activeChat === job._id && showChat && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <h3 className="text-md font-semibold">Chat with Client</h3>
                    <div ref={chatContainerRef} className="h-40 overflow-y-auto border p-2 bg-white dark:bg-gray-600 rounded-md">
                      {messages.map((msg) => (
                        <div key={msg._id} className={`p-1 ${msg.sender === user ? "text-right" : "text-left"}`}>
                          <span className={`px-2 py-1 rounded-md inline-block ${msg.sender === user ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                            {msg.message}
                          </span>
                          {msg.sender === user && (
                            <span className={`ml-2 text-xs ${msg.read ? "text-green-500" : "text-gray-500"}`}>✔</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {typing && <p className="text-gray-500">Typing...</p>}
                    <input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        socket.emit("typing", { jobId: job._id, sender: user })
                        setTimeout(() => socket.emit("stopTyping", { jobId: job._id, sender: user }), 2000);
                      }}
                      className="w-full p-2 border rounded mt-2 text-gray-600"
                      placeholder="Type a message..."
                    />
                    <button onClick={sendMessage} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
                      Send
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No applied jobs.</p>
        )}
      </div>
    </div>
  );
};

export default DeveloperDashboard;
