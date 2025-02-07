"use client"

import ClientChat from "@/app/components/clientChat";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

interface Applicant {
  _id?: string;
  name: string;
  email: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  applicants: Applicant[];
  client: string;
  status: string;
  escrow: boolean; // Add escrow property
  selectedDeveloper: string;
}

const JobListings = () => {

  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";

  const [jobs, setJobs] = useState<Job[]>([]);
  const { user, token } = useAuth();
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("")
  const [activeChat, setActiveChat] = useState<string | null>(null);

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

  return (
    <>
      <Header />
      <div className="mt-6 flex justify-center">
        <div className="max-w-5xl w-full">
          <h2 className="text-xl font-semibold">Your Jobs</h2>
          <div>
            {jobs.map((job) => (
              <div key={job._id} className="border w-full mt-4 p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                <div className="flex">
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <h5 className="ml-5">{job.status}</h5>
                </div>
                {job.status === "open" && job.applicants.map((applicant) => (
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
                {job.status == "in progress" && job.applicants.map((applicant) => (
                  applicant._id === job.selectedDeveloper && (
                    <div key={applicant._id} className="flex justify-between items-center border-b py-2">
                      <span>{applicant.name} ({applicant.email})</span>
                      <div>
                        <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => acceptApplicant(job._id, applicant._id)}>
                          Complete
                        </button>
                        <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => rejectApplicant(job._id, applicant._id)}>
                          Reject
                        </button>
                        <button className="ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => openChat(applicant._id ?? "", job._id)}>
                          Message
                        </button>
                      </div>
                    </div>
                  )
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
      <Footer />
    </>
  );
};

export default JobListings;
