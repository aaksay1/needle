"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage: string;
    };
}

interface Conversation {
    id: string;
    otherUser: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage: string;
    };
    product: {
        id: string;
        name: string;
    } | null;
    lastMessage: {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
    } | null;
    updatedAt: string;
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageContent, setMessageContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    // Initialize socket connection
    useEffect(() => {
        // Get user ID from session
        fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
                if (data.user?.id) {
                    setUserId(data.user.id);
                    const socketUrl = typeof window !== "undefined" 
                        ? window.location.origin 
                        : "http://localhost:3000";
                    const newSocket = io(socketUrl, {
                        transports: ["websocket"],
                    });

                    newSocket.on("connect", () => {
                        newSocket.emit("join", data.user.id);
                    });

                    newSocket.on("new-message", (messageData: any) => {
                        // Reload messages if this conversation is currently open
                        if (messageData.conversationId === selectedConversation) {
                            fetch(`/api/messages/${selectedConversation}`)
                                .then((res) => res.json())
                                .then((msgs) => {
                                    setMessages(msgs);
                                })
                                .catch(console.error);
                        }
                        // Always update conversation list to show new last message
                        loadConversations();
                    });

                    setSocket(newSocket);
                }
            })
            .catch((error) => {
                console.error("Failed to get user session:", error);
            });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    // Load conversations
    const loadConversations = async () => {
        try {
            const res = await fetch("/api/messages", {
                cache: "no-store", // Ensure fresh data
            });
            if (!res.ok) {
                throw new Error("Failed to fetch conversations");
            }
            const data = await res.json();
            setConversations(data || []);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
        
        // Set up interval to refresh conversations periodically (every 5 seconds)
        const interval = setInterval(() => {
            loadConversations();
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedConversation && socket) {
            socket.emit("join-conversation", selectedConversation);
            
            fetch(`/api/messages/${selectedConversation}`)
                .then((res) => res.json())
                .then((data) => {
                    setMessages(data);
                })
                .catch((error) => {
                    console.error("Failed to load messages:", error);
                });

            return () => {
                socket.emit("leave-conversation", selectedConversation);
            };
        }
    }, [selectedConversation, socket]);

    const sendMessage = async () => {
        if (!messageContent.trim() || !selectedConversation || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/messages/${selectedConversation}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: messageContent }),
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages((prev) => [...prev, newMessage]);
                setMessageContent("");
                
                // Emit to socket
                if (socket) {
                    socket.emit("send-message", {
                        conversationId: selectedConversation,
                        senderId: userId,
                        content: newMessage.content,
                    });
                }

                // Reload conversations to update last message
                loadConversations();
            } else {
                alert("Failed to send message");
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const currentConversation = conversations.find((c) => c.id === selectedConversation);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex h-[calc(100vh-200px)]">
                    {/* Conversations List */}
                    <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No conversations yet.</p>
                                <p className="text-sm mt-2">Accept an offer to start messaging!</p>
                            </div>
                        ) : (
                            <div>
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv.id)}
                                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition ${
                                            selectedConversation === conv.id ? "bg-indigo-50" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-indigo-600 font-semibold">
                                                    {conv.otherUser.firstName[0]}
                                                    {conv.otherUser.lastName[0]}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">
                                                    {conv.otherUser.firstName} {conv.otherUser.lastName}
                                                </div>
                                                {conv.product && (
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {conv.product.name}
                                                    </div>
                                                )}
                                                {conv.lastMessage && (
                                                    <div className="text-sm text-gray-600 truncate mt-1">
                                                        {conv.lastMessage.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span className="text-indigo-600 font-semibold">
                                                {currentConversation?.otherUser.firstName[0]}
                                                {currentConversation?.otherUser.lastName[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {currentConversation?.otherUser.firstName}{" "}
                                                {currentConversation?.otherUser.lastName}
                                            </div>
                                            {currentConversation?.product && (
                                                <div className="text-sm text-gray-500">
                                                    {currentConversation.product.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message) => {
                                        const isOwn = message.senderId === userId;
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-3 ${
                                                        isOwn
                                                            ? "bg-indigo-600 text-white"
                                                            : "bg-gray-100 text-gray-900"
                                                    }`}
                                                >
                                                    <p className="text-sm">{message.content}</p>
                                                    <p
                                                        className={`text-xs mt-1 ${
                                                            isOwn ? "text-indigo-100" : "text-gray-500"
                                                        }`}
                                                    >
                                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={messageContent}
                                            onChange={(e) => setMessageContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={sendMessage}
                                            disabled={!messageContent.trim() || sending}
                                            className="self-end"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <p className="text-lg">Select a conversation to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

