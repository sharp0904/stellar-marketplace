"use client"

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";


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

const AppliedJobsList = () => {

  const { token, user } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [receiver, setReceiver] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
    transports: ["websocket"],
  });

  const MESSAGE_API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/messages";
  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";


  useEffect(() => {
    fetchAppliedJobs();
  }, [token]);

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

  return (
    <div>
      <h2 className="text-xl font-semibold mt-6">Applied Jobs</h2>
      {appliedJobs.length > 0 ? (
        <div className="grid gap-4 mt-4">
          {appliedJobs.map((job) => (
            <div key={job._id} className="border p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <button
                className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  setActiveChat(job._id);
                  setReceiver(job.client);
                  fetchMessages(job._id);
                  setShowChat(!showChat);
                }}
              >
                Chat with Client
              </button>

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
                      setNewMessage(e.target.value);
                      socket.emit("typing", { jobId: job._id, sender: user });
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
  );
};

export default AppliedJobsList;
