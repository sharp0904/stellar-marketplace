import { FC, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  timestamp: string;
}

interface ClientChatProps {
  messages: Message[];
  selectedJobId: string | null;
  activeChat: string | null;
  closeChat: () => void;
}

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
  transports: ["websocket"],
});

const ClientChat: FC<ClientChatProps> = ({ activeChat, selectedJobId, closeChat }) => {
  const [newMessage, setNewMessage] = useState("");
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (activeChat && selectedJobId) {
      fetchMessages();
      socket.emit("joinRoom", { jobId: selectedJobId });
    }

    socket.on("receiveMessage", (newMsg: Message) => {
      console.log(newMsg)
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on("userTyping", ({ sender }) => {
      if (sender !== user) setTyping(true);
    });

    socket.on("userStoppedTyping", () => setTyping(false));

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [activeChat, selectedJobId]);

  const fetchMessages = async () => {
    if (!token || !user || !activeChat || !selectedJobId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${selectedJobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch messages.");

      const data = await res.json();
      setMessages(data);
      console.log(data)
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!token || !user || !activeChat || !newMessage.trim() || !selectedJobId) return;

    const messageData = {
      jobId: selectedJobId,
      sender: user,
      receiver: activeChat,
      message: newMessage,
    };

    socket.emit("sendMessage", messageData);

    setNewMessage("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 p-4 border shadow-lg rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Chat</h3>
        <button
          onClick={closeChat}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          X
        </button>
      </div>

      <div className="mt-2 h-96 overflow-y-auto border p-2 bg-white dark:bg-gray-700 rounded-md">
        {messages.map((msg) => (
          <p key={msg._id} className={`p-1 ${msg.sender === user ? "text-right" : "text-left"}`}>
            <span className={`px-2 py-1 rounded-md inline-block ${msg.sender === user ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
              {msg.message}
            </span>
          </p>
        ))}
      </div>
      {typing && <p className="text-gray-500">Typing...</p>}

      <input
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
          socket.emit("typing", { jobId: selectedJobId, sender: user });
          setTimeout(() => socket.emit("stopTyping", { jobId: selectedJobId, sender: user }), 2000);
        }}
        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 mt-2"
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} className="bg-blue-500 text-white py-2 px-4 mt-2 rounded-md">
        Send
      </button>
    </div>
  );
};

export default ClientChat;
