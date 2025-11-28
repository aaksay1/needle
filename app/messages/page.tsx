"use client";

import React, { useEffect, useState, useRef } from "react";
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedConversationRef = useRef<string | null>(null);
    
    // Keep ref in sync with state
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    // Initialize socket connection
    useEffect(() => {
        let newSocket: Socket | null = null;
        
        // Get user ID from session
        fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
                if (data.user?.id) {
                    setUserId(data.user.id);
                    const socketUrl = typeof window !== "undefined" 
                        ? window.location.origin 
                        : "http://localhost:3000";
                    
                    console.log("Connecting to socket at:", socketUrl);
                    
                    // Use websocket only to avoid polling/XHR issues
                    newSocket = io(socketUrl, {
                        transports: ["websocket"], // Use websocket only
                        reconnection: true,
                        reconnectionDelay: 2000,
                        reconnectionAttempts: 5,
                        timeout: 5000, // 5 second timeout (shorter to fail faster and retry)
                        forceNew: false,
                        autoConnect: true,
                    });
                    

                    newSocket.on("connect", () => {
                        console.log("Socket connected:", newSocket?.id);
                        if (data.user?.id) {
                            newSocket?.emit("join", data.user.id);
                        }
                        // If there's already a selected conversation, join it now that we're connected
                        if (selectedConversationRef.current) {
                            console.log("Socket connected, joining existing conversation:", selectedConversationRef.current);
                            newSocket.emit("join-conversation", selectedConversationRef.current);
                        }
                    });

                    newSocket.on("disconnect", (reason) => {
                        console.log("Socket disconnected:", reason);
                    });

                    newSocket.on("connect_error", (error) => {
                        // Suppress timeout errors - they're expected during initial connection/reconnection
                        if (error.message && error.message.includes("timeout")) {
                            // Timeout is expected, Socket.IO will retry automatically
                            return;
                        }
                        console.error("Socket connection error:", error);
                    });

                    newSocket.on("reconnect", (attemptNumber) => {
                        console.log("Socket reconnected after", attemptNumber, "attempts");
                        if (data.user?.id) {
                            newSocket?.emit("join", data.user.id);
                        }
                        // Rejoin conversation room if one was selected
                        if (selectedConversationRef.current) {
                            console.log("Rejoining conversation after reconnect:", selectedConversationRef.current);
                            newSocket.emit("join-conversation", selectedConversationRef.current);
                        }
                    });

                    newSocket.on("reconnect_error", (error) => {
                        // Suppress timeout errors during reconnection
                        if (error.message && error.message.includes("timeout")) {
                            return;
                        }
                        console.error("Socket reconnection error:", error);
                    });

                    newSocket.on("reconnect_failed", () => {
                        console.warn("Socket reconnection failed - will continue trying");
                    });

                    // Set up message listener - use ref to always get current selectedConversation
                    const handleNewMessage = (messageData: any) => {
                        console.log("Received new message:", messageData);
                        console.log("Current selected conversation (ref):", selectedConversationRef.current);
                        
                        // Always update conversation list to show new last message
                        loadConversations();
                        
                        // Check if this message is for the currently selected conversation using ref
                        const currentConv = selectedConversationRef.current;
                        
                        if (messageData.conversationId === currentConv) {
                            console.log("Message is for current conversation, adding it");
                            // Use setMessages with a function to access current state
                            setMessages((prev) => {
                                // Check if message already exists (avoid duplicates)
                                const exists = prev.some((msg) => msg.id === messageData.id);
                                if (exists) {
                                    console.log("Message already exists, skipping");
                                    return prev;
                                }
                                
                                console.log("Adding new message to current conversation");
                                // Add the new message to the list and ensure no duplicates
                                const newMessages = [...prev, {
                                    id: messageData.id,
                                    content: messageData.content,
                                    senderId: messageData.senderId,
                                    createdAt: messageData.createdAt,
                                    sender: messageData.sender || {
                                        id: messageData.senderId,
                                        firstName: "Unknown",
                                        lastName: "User",
                                        profileImage: "",
                                    },
                                }];
                                
                                // Remove any duplicates by ID (safety check)
                                return Array.from(
                                    new Map(newMessages.map((msg) => [msg.id, msg])).values()
                                );
                            });
                        } else {
                            console.log("Message is for different conversation, ignoring");
                        }
                    };
                    
                    newSocket.on("new-message", handleNewMessage);

                    setSocket(newSocket);
                }
            })
            .catch((error) => {
                console.error("Failed to get user session:", error);
            });

        return () => {
            if (newSocket) {
                console.log("Cleaning up socket connection");
                newSocket.disconnect();
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
        
        // Set up interval to refresh conversations periodically (every 10 seconds as fallback)
        // Real-time updates via WebSocket handle most updates, but polling ensures messages appear
        const interval = setInterval(() => {
            loadConversations();
            // Also refresh messages if a conversation is selected
            if (selectedConversation) {
                fetch(`/api/messages/${selectedConversation}`)
                    .then((res) => res.json())
                    .then((data) => {
                        // Remove duplicates by using a Map with message ID as key
                        const uniqueMessages = Array.from(
                            new Map((data || []).map((msg: Message) => [msg.id, msg])).values()
                        );
                        setMessages(uniqueMessages);
                    })
                    .catch((error) => {
                        console.error("Failed to refresh messages:", error);
                    });
            }
        }, 10000); // Poll every 10 seconds as fallback
        
        return () => clearInterval(interval);
    }, [selectedConversation]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            // Load messages first
            fetch(`/api/messages/${selectedConversation}`)
                .then((res) => res.json())
                .then((data) => {
                    // Remove duplicates by using a Map with message ID as key
                    const uniqueMessages = Array.from(
                        new Map((data || []).map((msg: Message) => [msg.id, msg])).values()
                    );
                    setMessages(uniqueMessages);
                })
                .catch((error) => {
                    console.error("Failed to load messages:", error);
                });
            
            // Join conversation room - ensure we join even if socket connects later
            const joinRoom = () => {
                if (socket && socket.connected) {
                    console.log("Joining conversation room:", selectedConversation);
                    socket.emit("join-conversation", selectedConversation);
                }
            };
            
            // Try to join immediately if socket is connected
            joinRoom();
            
            // Also set up listener for when socket connects (if not connected yet)
            if (socket && !socket.connected) {
                socket.once("connect", () => {
                    console.log("Socket connected, joining conversation:", selectedConversation);
                    joinRoom();
                });
            }

            return () => {
                if (socket && socket.connected) {
                    console.log("Leaving conversation:", selectedConversation);
                    socket.emit("leave-conversation", selectedConversation);
                }
            };
        } else {
            // Clear messages when no conversation is selected
            setMessages([]);
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
                // Add message to local state immediately (optimistic update)
                // Use functional update to ensure we don't add duplicates
                setMessages((prev) => {
                    // Check if message already exists (prevent duplicates)
                    const exists = prev.some((msg) => msg.id === newMessage.id);
                    if (exists) {
                        console.log("Message already in state, skipping duplicate");
                        return prev;
                    }
                    // Add new message and remove any duplicates by ID
                    const newMessages = [...prev, newMessage];
                    return Array.from(
                        new Map(newMessages.map((msg) => [msg.id, msg])).values()
                    );
                });
                setMessageContent("");
                
                // Emit to socket from client side to ensure real-time delivery
                // This works as a fallback if server-side emission fails
                if (socket && selectedConversation) {
                    if (socket.connected) {
                        console.log("Emitting message via socket from client");
                        socket.emit("send-message", {
                            conversationId: selectedConversation,
                            senderId: userId,
                            content: newMessage.content,
                            messageId: newMessage.id,
                            createdAt: newMessage.createdAt,
                            sender: newMessage.sender,
                        });
                    } else {
                        console.warn("Socket not connected, message saved but not broadcasted. Will appear on refresh.");
                        // Message is still saved, it will appear when the other user refreshes
                        // Or when they receive it via the periodic refresh
                    }
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
                                    <div ref={messagesEndRef} />
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

