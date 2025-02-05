import { FC } from "react";

interface Message {
  _id: string;
  sender: { email: string; name: string; _id: string };
  receiver: string;
  message: string;
  timestamp: string;
}

interface ClientChatProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  activeChat: string | null;
  closeChat: () => void;
}

const ClientChat: FC<ClientChatProps> = ({ messages, newMessage, setNewMessage, sendMessage, activeChat, closeChat }) => {
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
          <p key={msg._id} className={msg.sender._id === activeChat ? "text-right" : "text-left"}>
            <span
              className={`px-2 py-1 rounded-md inline-block ${msg.sender._id === activeChat ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}
            >
              {msg.message}
            </span>
          </p>
        ))}
      </div>

      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 mt-2"
        placeholder="Type a message..."
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white py-2 px-4 mt-2 rounded-md"
      >
        Send
      </button>
    </div>
  );
};

export default ClientChat;
