import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

export default function ChatPage({ alumniId, onBack }) {
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);

    // Setup socket
    useEffect(() => {
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    // Fetch user + chat
    useEffect(() => {
        const fetchData = async () => {
            const me = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
            setCurrentUser(me.data);

            const res = await axios.post(
                `http://localhost:5000/api/chat/start/${alumniId}`,
                {},
                { withCredentials: true }
            );
            setChat(res.data);
            setMessages(res.data.messages || []);

            if (socket) {
                socket.emit("join_chat", res.data._id);
            }
        };

        if (socket) fetchData();
    }, [alumniId, socket]);

    // Socket listener (re-renders correctly)
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg) => {
            setMessages((prev) => [...prev, msg]); // always append
        };

        socket.on("receive_message", handleMessage);
        return () => socket.off("receive_message", handleMessage);
    }, [socket]);

    const handleSend = () => {
        if (!text || !chat || !currentUser) return;

        const msg = {
            chatId: chat._id,
            senderId: currentUser._id,
            text,
        };

        socket.emit("send_message", msg);
        setText(""); // clear input only
    };

    return (
        <div className="border p-4 rounded">
            <button className="mb-2 text-blue-500" onClick={onBack}>← Back</button>

            {/* Messages */}
            <div className="h-64 overflow-y-auto border p-2 mb-2 flex flex-col">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`mb-1 flex ${(m.sender?._id || m.sender || m.senderId) === currentUser?._id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                    >
                        <span
                            className={`inline-block px-3 py-1 rounded-lg max-w-xs break-words ${(m.sender?._id || m.sender || m.senderId) === currentUser?._id
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-black"
                                }`}
                        >
                            {m.text}
                        </span>
                    </div>

                ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    className="flex-1 border p-1 rounded"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                />
                <button
                    className="bg-blue-500 text-white px-3 rounded"
                    onClick={handleSend}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
