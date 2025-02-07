"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ClientChat from "@/app/components/clientChat"; // Import ClientChat component
import JobPostingForm from "@/app/components/jobPostingForm"; // Import JobPostingForm component
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

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

interface Applicant {
  _id?: string;
  name: string;
  email: string;
}

const ClientDashboard = () => {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleJobPost = async (data: { title: string; description: string; budget: number; deadline: string; escrow: boolean; paymentMethod: string; }) => {
    console.log(data)
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
    <div>
      <Header />
      <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
        <div className="p-6 text-gray-600 dark:text-gray-300 w-full max-w-5xl">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Client Dashboard</h1>
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
