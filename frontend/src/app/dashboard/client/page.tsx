"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Profile from "@/app/components/profileList";
import ClientChat from "@/app/components/clientChat"; // Import ClientChat component
import JobPostingForm from "@/app/components/jobPostingForm"; // Import JobPostingForm component

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  applicants: Applicant[];
  client: string;
  escrow: boolean; // Add escrow property
}

interface Applicant {
  _id?: string;
  name: string;
  email: string;
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  timestamp: string;
}

const ClientDashboard = () => {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";

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

  const handleJobPost = async (data: { title: string; description: string; budget: number; deadline: string; escrow: boolean }) => {
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
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.msg || "Failed to post job.");

      setSuccess("Job posted successfully!");
      fetchJobs();
    } catch (err) {
      console.error("❌ Error posting job:", err);
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
      <div className="p-6 text-gray-600 dark:text-gray-300 w-full max-w-5xl">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Client Dashboard</h1>
          <Profile />
        </div>
        <p>Post jobs, manage applications, and message developers.</p>

        {/* ✅ Job Posting Form */}
        <JobPostingForm
          onSubmit={handleJobPost}
          error={error}
          setError={setError}
          success={success}
          setSuccess={setSuccess}
        />

        {/* ✅ Job Listings */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Your Jobs</h2>
          {jobs.map((job) => (
            <div key={job._id} className="border mt-4 p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              {job.applicants.map((applicant) => (
                <div key={applicant._id} className="flex justify-between items-center border-b py-2">
                  <span>{applicant.name} ({applicant.email})</span>
                  <div>
                    <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => acceptApplicant(job._id, applicant._id)}>
                      Accept
                    </button>
                    <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => rejectApplicant(job._id, applicant._id)}>
                      Reject
                    </button>
                    <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => openChat(applicant._id ?? "", job._id)}>
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ✅ Chat UI */}
        {activeChat && (
          <ClientChat
            selectedJobId={selectedJobId}
            activeChat={activeChat}
            closeChat={() => setActiveChat(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
