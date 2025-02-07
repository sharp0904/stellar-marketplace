"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false); // ✅ Loading state

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const REGISTER_API = API_URL + '/api/auth/register';

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // ✅ Disable button during login

    try {
      const res = await fetch(REGISTER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          walletAddress,
          roles,
        })
      })

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to register.");
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to register.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />

      {/* Blurred Background */}
      <div className="relative flex-1 text-gray-600">
        <div className="absolute inset-0 bg-[url('/dashboard.png')] bg-cover bg-center blur-xl"></div>

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-xl"></div>

        {/* Login Form */}
        <div className="flex justify-center items-center h-full relative z-10">
          <div className="bg-white p-8 rounded-lg shadow-md w-96">
            <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <form onSubmit={handleRegister} className="flex flex-col space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {email.length > 0 && !isValidEmail(email) && (
                <p className="text-red-500 text-sm">Please enter a valid email address.</p>
              )}

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {password.length > 0 && password.length < 6 && (
                <p className="text-red-500 text-sm">Password must be at least 6 characters.</p>
              )}

              <input
                type="text"
                placeholder="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Select Role</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={roles[0]}
                    onChange={(e) => setRoles([e.target.value])}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose Role</option>
                    <option value="developer">Developer</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition disabled:opacity-50"
                disabled={loading} // ✅ Disable button when loading
              >
                {loading ? "Logging in..." : "Register"}
              </button>
            </form>

            <p className="text-sm text-center mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-green-500 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
