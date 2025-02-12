"use client"

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";


interface Job {
  _id: string;
  title: string;
  description: string;
  client: string;
}

interface Message {
  job: string;
  message: string;
  read: boolean;
  receiver: string;
  sender: string;
  timestamp: string;
  __v: number;
  _id: string;
}

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
  transports: ["websocket"],
});

const AppliedJobsList = () => {
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [receiver, setReceiver] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState<boolean>(false);
  const [, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const params = useParams();
  const id = params.id || [];
  const [activeChat, setActiveChat] = useState<string | null>(id[0] || "");
  
  const { user, roles, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // Prevent redirect until authentication is confirmed
  
    if (!user) {
      router.replace("/login"); // Use `replace` to prevent back navigation issues
      return;
    }
  
    // Only redirect if `activeChat` and `receiver` are defined
    if (activeChat && receiver) {
      router.replace(`/dashboard/developer/appliedJob/${activeChat}/${receiver}`);
    } else {
      router.replace("/dashboard/developer/appliedJob");
    }
  }, [user, roles, router, activeChat, receiver]);

  useEffect(() => {
    if (id.length === 2) {
      setReceiver(id[1])
    }
  }, [id])

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const MESSAGE_API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/messages";
  const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api/jobs";

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      socket.emit("joinRoom", { jobId: activeChat });
    }

    socket.on("receiveMessage", (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on("userTyping", ({ sender }) => {
      if (sender !== user) setTyping(true);
    });

    socket.on("userStoppedTyping", () => setTyping(false));

    socket.on("messageRead", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, read: true } : msg))
      );
    });
    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [activeChat]);

  // ✅ Detect if user scrolls to bottom
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10; // Small threshold for smoothness

    if (isAtBottom) {
      const unreadMessages = messages.filter((msg) => !msg.read && msg.receiver === user);
      unreadMessages.forEach((msg) => {
        socket.emit("markAsRead", { messageId: msg._id });
      });
    }
  };

  useEffect(() => {
    const chatBox = chatContainerRef.current;
    if (chatBox) {
      chatBox.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (chatBox) {
        chatBox.removeEventListener("scroll", handleScroll);
      }
    };
  }, [messages]);

  useEffect(() => {
    if (activeChat !== "") {
      setShowChat(true)
    }
    fetchAppliedJobs();
  }, [token, activeChat]);

  // ✅ Fetch Messages
  const fetchMessages = async (jobId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${MESSAGE_API_URL}/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      setError("Error fetching messages");
    }
  };

  // ✅ Send a Message
  const sendMessage = async () => {
    if (!token || !user || !activeChat || !newMessage.trim() || !receiver) {
      return;
    }

    const messageData = {
      jobId: activeChat,
      sender: user,
      receiver: receiver,
      message: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
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

  return (
    <div>
      <Header />
      <div className="flex justify-center dark:bg-gray-900 dark:text-gray-100">
        <div className="p-6 text-gray-600 dark:text-gray-300 w-full max-w-5xl">
          <h2 className="text-xl font-semibold mt-6">Applied Jobs</h2>
          {appliedJobs.length > 0 ? (
            <div className="grid gap-4 mt-4">
              {appliedJobs.map((job) => (
                <div key={job._id} className="border p-4 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <button
                    className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
                    onClick={() => {
                      setActiveChat(job._id);
                      setReceiver(job.client);
                      // fetchMessages(job._id);
                      // setShowChat(!showChat);
                      router.push(`/dashboard/developer/appliedJob/${job._id}/${job.client}`)
                    }}
                  >
                    Chat with Client
                  </button>

                  {activeChat === job._id && showChat && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                      <h3 className="text-md font-semibold">Chat with Client</h3>
                      <div ref={chatContainerRef} className="h-40 overflow-y-auto border p-2 bg-white dark:bg-gray-600 rounded-md">
                        {messages.map((msg) => (
                          <div key={msg._id} className={`p-1 ${msg.sender === user ? "text-right" : "text-left"}`}>
                            <span className={`px-2 py-1 rounded-md inline-block ${msg.sender === user ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                              {msg.message}
                            </span>
                            {msg.sender === user && (
                              <span className={`ml-2 text-xs ${msg.read ? "text-green-500" : "text-gray-500"}`}>✔</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {typing && <p className="text-gray-500">Typing...</p>}
                      <input
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          socket.emit("typing", { jobId: job._id, sender: user });
                          setTimeout(() => socket.emit("stopTyping", { jobId: job._id, sender: user }), 2000);
                        }}
                        className="w-full p-2 border rounded mt-2 text-gray-600"
                        placeholder="Type a message..."
                      />
                      <div className="flex w-full justify-end">
                        <button onClick={sendMessage} className="mt-2 bg-blue-500 text-white px-6 py-2 rounded">
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No applied jobs.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppliedJobsList;
