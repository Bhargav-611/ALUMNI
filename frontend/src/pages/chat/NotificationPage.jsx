import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LinkedInLoadingScreen from "../../LinkedInLoadingScreen";
import { LinkedInHeader } from "../../components/Linkedin-header";
import ChatPage from "../chat/ChatPage";

export default function NotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/notifications", {
                    withCredentials: true,
                });
                setNotifications(res.data);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedChat]);

    const handleClick = async (notif) => {
        try {
            // Mark as read
            await axios.put(
                `http://localhost:5000/api/notifications/${notif._id}/read`,
                {},
                { withCredentials: true }
            );

            // Show ChatPage inline
            console.log(notif);
            
            if (notif.chatId) {
                setSelectedChat(notif.chatId);
            } else {
                console.error("No chatId found in notification");
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    if (loading) {
        return <LinkedInLoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <LinkedInHeader />

            {selectedChat ? (
                <ChatPage chatId={selectedChat} onBack={() => setSelectedChat(null)} />
            ) : (
                <div className="max-w-3xl mx-auto p-4">
                    <h2 className="text-2xl font-bold mb-4">Notifications</h2>

                    {notifications.length === 0 ? (
                        <p className="text-muted-foreground">No notifications yet.</p>
                    ) : (
                        <div className="grid gap-4">
                            {notifications.map((notif) => (
                                <Card
                                    key={notif._id}
                                    className={notif.read ? "bg-gray-100" : "bg-yellow-200"}
                                >
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <h3 className="font-semibold">
                                                {notif.sender?.username || "Unknown"}
                                            </h3>
                                            <p>{notif.text}</p>
                                            <span className="block text-xs text-gray-500">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleClick(notif)}
                                        >
                                            Open Chat
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
