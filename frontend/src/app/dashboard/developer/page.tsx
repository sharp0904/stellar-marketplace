"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

import Profile from "@/app/components/profileList";

interface Message {
  _id: string;
  sender: { email: string; name: string; _id: string };
  receiver: string;
  message: string;
  timestamp: string;
}

const DeveloperDashboard = () => {
  const { token, user } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";
  const MESSAGE_API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/messages";

  // ✅ Fetch Jobs the Developer Has Applied To
  const fetchAppliedJobs = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/applied`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        console.error("❌ Error fetching applied jobs:", errorMsg);
        throw new Error("Failed to fetch applied jobs");
      }

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

      if (!res.ok) {
        console.error("❌ Error fetching jobs:", await res.text());
        throw new Error("Failed to fetch available jobs");
      }

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
      console.log(`🔹 Attempting to apply for job ID: ${jobId}`);

      const res = await fetch(`${API_URL}/apply/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await res.text();
      console.log("🔹 Server Response:", responseText);

      if (!res.ok) {
        console.error("❌ Error applying for job:", responseText);
        setError(JSON.parse(responseText).msg);
        return;
      }

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

  // ✅ Fetch Messages for a Job
  const fetchMessages = async (jobId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${MESSAGE_API_URL}/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("❌ Error fetching messages:", await res.text());
        throw new Error("Failed to fetch messages");
      }

      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      setError("Error fetching messages");
    }
  };

  // ✅ Send a Message
  const sendMessage = async (jobId: string, receiverId: string) => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${MESSAGE_API_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId, receiverId, message: newMessage }),
      });

      if (!res.ok) {
        console.error("❌ Error sending message:", await res.text());
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      fetchMessages(jobId);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError("Error sending message");
    }
  };

  useEffect(() => {
    fetchAppliedJobs();
    fetchAvailableJobs();
  }, [token]);

  return (
    <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
      <div className="p-6 text-gray-600 dark:text-gray-300 w-full">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          </div>
          {/* Profile Avatar */}
          <Profile />
        </div>
        <p>Find jobs, submit applications, and chat with clients.</p>

        {error && <p className="text-red-500">{error}</p>}

        {/* ✅ Available Jobs */}
        <h2 className="text-xl font-semibold mt-6">Available Jobs</h2>
        {availableJobs.length > 0 ? (
          <div className="grid gap-4 mt-4">
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

        {/* ✅ Applied Jobs with Messaging */}
        <h2 className="text-xl font-semibold mt-6">Applied Jobs</h2>
        {appliedJobs.length > 0 ? (
          <div className="grid gap-4 mt-4">
            {appliedJobs.map((job) => (
              <div key={job._id} className="border p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{job.description}</p>
                <button
                  className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
                  onClick={() => {
                    setActiveChat(job._id);
                    fetchMessages(job._id);
                  }}
                >
                  Chat with Client
                </button>

                {/* ✅ Chat UI */}
                {activeChat === job._id && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                    <h3 className="text-md font-semibold">Chat with Client</h3>
                    <div className="h-40 overflow-y-auto border p-2 bg-white dark:bg-gray-600 rounded-md">
                      {messages.length > 0 ? (
                        messages.map((msg, index) => (
                          <div key={index} className={`p-1 ${msg.sender._id === user ? "text-right" : "text-left"}`}>
                            <span className={`px-2 py-1 rounded-md inline-block ${msg.sender._id === user ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                              {msg.message}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-300">No messages yet.</p>
                      )}
                    </div>

                    {/* ✅ Send Message */}
                    <div className="mt-2 flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 p-2 border rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                        placeholder="Type a message..."
                      />
                      <button
                        className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
                        onClick={() => sendMessage(job._id, job.client)}
                      >
                        Send
                      </button>
                    </div>
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
