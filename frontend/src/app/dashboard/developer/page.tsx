"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

interface Job {
  _id: string;
  title: string;
  description: string;
  client: string;
}

const DeveloperDashboard = () => {
  const { user, roles } = useAuth();
  const router = useRouter();
  const [, setRedirecting] = useState(true);
  
  useEffect(() => {
    if (!user) {
      router.push("/login"); // Redirect to login if not authenticated
      return;
    }
    // Automatically redirect to the appropriate dashboard
    if (roles.includes("client")) {
      router.push("/dashboard/client");
    } else if (roles.includes("developer")) {
      router.push("/dashboard/developer");
    } else {
      setRedirecting(false);
    }
  }, [user, roles, router]);


  const { token } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";


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
        router.push(`/dashboard/developer/appliedJob/${job?._id}`)
      }

    } catch (err) {
      console.error("❌ Error applying for job:", err);
      setError("Failed to apply for job");
    }
  };

  // ✅ Chat for a Job
  const chatForJob = async (jobId: string) => {
    router.push(`/dashboard/developer/appliedJob/${jobId}`)
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

  useEffect(() => {
    fetchAvailableJobs();
    fetchAppliedJobs();
  }, [token]);

  return (
    <div>
      <Header />
      <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
        <div className="p-6 text-gray-600 dark:text-gray-300 w-full max-w-5xl">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Developer Dashboard</h1>
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
                  {appliedJobs.some((appliedJob) => appliedJob._id === job._id) ?
                    (
                      <button
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => chatForJob(job._id)}
                      >Chat with Client </button>
                    ) : (
                      <button
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => applyForJob(job._id)}
                      >Apply</button>
                    )
                  }
                </div>
              ))}
            </div>
          ) : (
            <p>No available jobs.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeveloperDashboard;
