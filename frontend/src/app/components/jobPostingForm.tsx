"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface JobPostingFormProps {
  onSubmit: (data: { title: string; description: string; budget: number; deadline: string; escrow: boolean }) => void;
  error: string;
  setError: any;
  success: string;
  setSuccess: any;
}

const JobPostingForm = ({ onSubmit, error, setError, success, setSuccess }: JobPostingFormProps) => {
  const { user, token, currentRole, logout } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [escrow, setEscrow] = useState(false);
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnect, setIsConnect] = useState(false);

  const BALLANCE_WALLET_API = process.env.NEXT_PUBLIC_API_URL + "/api/wallet/balance";

  const handleWalletBalance = async () => {
    setLoading(true);

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
        throw new Error("Internal Server Error");
      }
      
      const data = await res.json();
      setBalance(data.balances[0].balance)
      setIsConnect(true)
    } catch (err) {
      console.error("❌ Error getting balance from wallet address:", err)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    escrow && token != null && handleWalletBalance()
  }, [escrow])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(escrow) {
      if(isConnect) {

        if(Number(budget) > Number(balance)) {
          setSuccess("")
          setError("Lack of balance")
        } else {
          onSubmit({
            title,
            description,
            budget: Number(budget),
            deadline,
            escrow,
          });
          setTitle("");
          setDescription("");
          setBudget("");
          setDeadline("");
          setEscrow(false);
        }
      } else {
        setError("Please connect your wallet")
      }
    } else {
      onSubmit({
        title,
        description,
        budget: Number(budget),
        deadline,
        escrow,
      });
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setEscrow(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">Post a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
        <div className="w-full flex">
          <input
            type="number"
            className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
            placeholder="Budget (XLM)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
          <label className="flex items-center space-x-2 ml-3">
            <span>Escrow</span>
            <input
              type="checkbox"
              checked={escrow}
              onChange={() => setEscrow(!escrow)}
              className="w-5 h-5"
            />
          </label>
        </div>

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

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
    </div>
  );
};

export default JobPostingForm;
