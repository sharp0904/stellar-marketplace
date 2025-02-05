"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

import Profile from "@/app/components/profileList";

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  applicants: Applicant[];
  client: string;
}

interface Applicant {
  _id?: string;
  name: string;
  email: string;
}

interface Message {
  _id: string;
  sender: { email: string; name: string; _id: string };
  receiver: string;
  message: string;
  timestamp: string;
}

const ClientDashboard = () => {
  const { token, user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";
  const MESSAGE_API = process.env.NEXT_PUBLIC_API_URL + "/api/messages";

  // ✅ Fetch Client's Jobs
  const fetchJobs = async () => {
    if (!token || !user) return;

    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("❌ Error fetching jobs:", await res.text());
        throw new Error("Failed to fetch jobs.");
      }

      const data: Job[] = await res.json();
      const clientJobs = data.filter((job) => job.client?.toString() === user?.toString());
      setJobs(clientJobs);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      setError("Error fetching jobs.");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token, user]);

  // ✅ Handle Job Posting (Fixed)
  const handleJobPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Unauthorized: No token provided.");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          budget: Number(budget),
          deadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to post job.");

      setSuccess("Job posted successfully!");
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      fetchJobs();
    } catch (err) {
      console.error("❌ Error posting job:", err);
      setError((err as Error).message);
    }
  };

  // ✅ Accept an Applicant
  const acceptApplicant = async (jobId: string, applicantId?: string) => {
    if (!applicantId) {
      setError("Error: Applicant ID is missing.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/accept/${jobId}/${applicantId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to accept applicant.");

      fetchJobs();
    } catch (err) {
      console.error("❌ Error accepting applicant:", err);
      setError("Error accepting applicant.");
    }
  };

  // ✅ Reject an Applicant
  const rejectApplicant = async (jobId: string, applicantId?: string) => {
    if (!applicantId) {
      setError("Error: Applicant ID is missing.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reject/${jobId}/${applicantId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to reject applicant.");

      fetchJobs();
    } catch (err) {
      console.error("❌ Error rejecting applicant:", err);
      setError("Error rejecting applicant.");
    }
  };

  // ✅ Open Chat
  const openChat = (applicantId: string, jobId: string) => {
    setActiveChat(applicantId);
    setSelectedJobId(jobId);
    fetchMessages(applicantId, jobId);
  };

  // ✅ Fetch Messages
  const fetchMessages = async (receiverId: string, jobId: string) => {
    if (!token || !user || !receiverId || !jobId) return;

    try {
      const res = await fetch(`${MESSAGE_API}/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch messages.");

      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    }
  };

  // ✅ Send Message
  const sendMessage = async () => {
    if (!token || !user || !activeChat || !newMessage.trim() || !selectedJobId) return;

    try {
      const res = await fetch(`${MESSAGE_API}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          receiverId: activeChat,
          message: newMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message.");

      setNewMessage("");
      fetchMessages(activeChat, selectedJobId);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
      <div className="p-6 text-gray-600 dark:text-gray-300">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Client Dashboard</h1>
          <Profile />
        </div>
        <p>Post jobs, manage applications, and message developers.</p>

        {/* ✅ Job Posting Form */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Post a New Job</h2>
          <form onSubmit={handleJobPost} className="space-y-4 mt-4">
            <input
              type="text"
              className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Job Description"
              className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input
              type="number"
              className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
              placeholder="Budget (XLM)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
            <input
              type="date"
              className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
            >
              Post Job
            </button>
          </form>
        </div>

        {/* ✅ Job Listings */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Your Jobs</h2>
          {jobs.map((job) => (
            <div key={job._id} className="border p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              {job.applicants.map((applicant) => (
                <div key={applicant._id} className="flex justify-between items-center border-b py-2">
                  <span>{applicant.name} ({applicant.email})</span>
                  <div>
                    <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => acceptApplicant(job._id, applicant._id)}>Accept</button>
                    <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => rejectApplicant(job._id, applicant._id)}>Reject</button>
                    <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => openChat(applicant._id ?? "", job._id)}>Message</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ✅ Chat UI */}
        {activeChat && (
          <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 p-4 border shadow-lg rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Chat</h3>
              {/* Close Button */}
              <button
                onClick={() => setActiveChat(null)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                X
              </button>
            </div>

            <div className="mt-2">
              {messages.map((msg) => (
                <p key={msg._id} className={msg.sender._id === user ? "text-right" : "text-left"}>
                  <span className={`px-2 py-1 rounded-md inline-block ${msg.sender._id === user ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                    {msg.message}
                  </span>
                </p>
              ))}
            </div>

            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 mt-2"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white py-2 px-4 mt-2 rounded-md"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
