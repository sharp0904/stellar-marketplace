"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const WalletConnect = () => {
  const { user, token } = useAuth();
  const [, setName] = useState("");
  const [, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [balance, setBalance] = useState("");

  const GET_USER_API = process.env.NEXT_PUBLIC_API_URL + "/api/auth/me";
  const UPDATE_WALLET_API = process.env.NEXT_PUBLIC_API_URL + "/api/wallet/connect";
  const BALLANCE_WALLET_API = process.env.NEXT_PUBLIC_API_URL + "/api/wallet/balance";

  const fetchUser = async () => {
    if (!user || !token) return;

    setLoading(true);

    try {
      const res = await fetch(GET_USER_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("❌ Invalid Token");
        throw new Error("Invalid Token.");
      }

      const userInfo = await res.json();
      setName(userInfo.name || "");
      setEmail(userInfo.email || "");
      setWalletAddress(userInfo.walletAddress || "");
    } catch (err) {
      console.error("❌ Error getting user info:", err);
      setError("Failed to fetch user info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    if (token != null) {
      handleWalletBalance();
    }
  }, [user, token]);

  const handleWalletUpdate = async () => {
    if (!walletAddress.trim()) {
      setSuccess("");
      setBalance("");
      setError("Wallet address cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");
    setBalance("");
    setSuccess("");

    try {
      const res = await fetch(UPDATE_WALLET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress }),
      });

      if (!res.ok) {
        throw new Error("Failed to update wallet address.");
      }

      setSuccess("Wallet address updated successfully.");
    } catch (err) {
      console.error("❌ Error updating wallet address:", err);
      setError("Failed to update wallet address.");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletBalance = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setBalance("");

    try {
      const res = await fetch(BALLANCE_WALLET_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (res.status === 402) {
        return setError("Invalid wallet address.");
      } else if (!res.ok) {
        throw new Error("Failed to update wallet address.");
      }

      const data = await res.json();
      console.log(data)
      setBalance(data.balances[0].balance)

      setSuccess("Wallet connected successfully!");
    } catch (err) {
      console.error("❌ Error getting balance from wallet address:", err)
      setError("Faild to get balance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen">

      {/* blur background start */}
      <div className="absolute inset-0 bg-[url('/dashboard.png')] bg-cover bg-center blur-xl"></div>
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-xl"></div>
      {/* blur background end */}

      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">WalletConnect</h2>
        {loading && <p className="text-blue-500 text-lg text-center">Loading...</p>}
        {error && <p className="text-red-500 text-lg mt-2">{error}</p>}
        {balance && <p className="text-red-500 text-lg mt-2">{balance}</p>}
        {success && <p className="text-green-500 text-lg mt-2">{success}</p>}
        <div className="mt-6">
          <label className="block text-lg font-medium mb-2 text-gray-900 dark:text-white">Wallet Address:</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md mb-4 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <button
            onClick={handleWalletUpdate}
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white text-lg font-semibold rounded-md hover:bg-blue-600 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-800">
            {loading ? "Updating..." : "Save Wallet Address"}
          </button>

          <button
            onClick={handleWalletBalance}
            disabled={loading}
            className="w-full mt-2 py-2 bg-blue-500 text-white text-lg font-semibold rounded-md hover:bg-blue-600 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-800">
            {loading ? "Updating..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
