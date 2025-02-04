"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Example auth context

const WalletConnect = () => {
  const { user, token, currentRole, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const GET_USER_API = process.env.NEXT_PUBLIC_API_URL + "/api/auth/me";
  
  const fetchUser = async () => {
    if (!user || !token) return;

    setLoading(true); // ✅ Ensure loading starts when fetching

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
      setLoading(false); // ✅ Ensure loading stops only after fetch is completed
    }
  };

  useEffect(() => {
    fetchUser()
  }, [user, token])

  return (
    <div>
      WalletConnect
    </div>
  )
}

export default WalletConnect