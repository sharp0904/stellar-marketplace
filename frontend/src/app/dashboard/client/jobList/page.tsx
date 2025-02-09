"use client"

import ClientChat from "@/app/components/clientChat";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
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

  const router = useRouter();
  const { user, roles, token } = useAuth();

  const [, setRedirecting] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login"); // Redirect to login if not authenticated
      return;
    }
    // Automatically redirect to the appropriate dashboard
    if (roles.includes("client")) {
      router.push("/dashboard/client/jobList");
    } else if (roles.includes("developer")) {
      router.push("/dashboard/developer/appliedJob");
    } else {
      setRedirecting(false);
    }
  }, [user, roles, router]);

  const JOB_API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";
  const PAY_API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/payments";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("")
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState("");

  // ✅ Accept an Applicant
  const acceptApplicant = async (jobId: string, applicantId?: string) => {
    if (!applicantId) {
      setError("Error: Applicant ID is missing.");
      return;
    }

    try {
      const res = await fetch(`${JOB_API_URL}/accept/${jobId}/${applicantId}`, {
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

  const completeApplicant = async (jobId: string) => {
    try {
      setIsComplete(jobId);
      const res = await fetch(`${PAY_API_URL}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobId }),
      });
      if (res.status == 402) {
        setError("Developer's wallet not connected");
        return;
      }
      if (!res.ok) throw new Error("Failed to accept applicant.");

      fetchJobs();
    } catch (err) {
      console.error("❌ Error accepting applicant:", err);
      setError("Error accepting applicant.");
    }
  }

  // ✅ Reject an Applicant
  const rejectApplicant = async (jobId: string, applicantId?: string) => {
    if (!applicantId) {
      setError("Error: Applicant ID is missing.");
      return;
    }

    try {
      const res = await fetch(`${JOB_API_URL}/reject/${jobId}/${applicantId}`, {
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
      const res = await fetch(JOB_API_URL, {
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
      <div className="relative flex justify-center">

        {/* blur background start */}
        <div className="absolute inset-0 bg-[url('/dashboard.png')] bg-cover bg-center blur-xl"></div>
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-xl"></div>
        {/* blur background end */}

        <div className="mt-6 p-6 max-w-5xl w-full z-10">
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
                      <button className="w-24 my-1 ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => acceptApplicant(job._id, applicant._id)}>
                        Accept
                      </button>
                      <button className="w-24 my-1 ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => rejectApplicant(job._id, applicant._id)}>
                        Reject
                      </button>
                      <button className="w-24 my-1 ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => openChat(applicant._id ?? "", job._id)}>
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
                        <button className="w-24 my-1 ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => completeApplicant(job._id)}>
                          Complete
                        </button>
                        <button className="w-24 my-1 ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => rejectApplicant(job._id, applicant._id)}>
                          Reject
                        </button>
                        <button className="w-24 my-1 ml-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={() => openChat(applicant._id ?? "", job._id)}>
                          Message
                        </button>
                      </div>
                    </div>
                  )
                ))}
                {error && isComplete == job._id && (
                  <span className="text-red-500">{error}</span>
                )}
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
