"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { user, roles, switchRole } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(true);
  
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

  if (redirecting) {
    return <p className="text-center mt-10 text-lg font-semibold">Redirecting...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user}!</h1>
      <p className="mt-4">You don&apos;t have a role assigned yet. Please select a role:</p>

      <div className="mt-4 flex gap-4">
        {roles.includes("client") && (
          <button
            className="p-2 bg-blue-500 text-white rounded"
            onClick={() => switchRole("client")}
          >
            Switch to Client
          </button>
        )}
        {roles.includes("developer") && (
          <button
            className="p-2 bg-green-500 text-white rounded"
            onClick={() => switchRole("developer")}
          >
            Switch to Developer
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
