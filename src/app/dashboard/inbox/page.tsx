"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ChatList, ChatMockData } from "@/components/inbox/ChatList";
import { ChatWindow, MessageMock } from "@/components/inbox/ChatWindow";
import { CustomerProfile } from "@/components/inbox/CustomerProfile";
import { io, Socket } from "socket.io-client";

export default function InboxPage() {
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<ChatMockData[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<MessageMock[]>([]);
  
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch initial Chat List
  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Failed to fetch chats", err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // 2. Initialize Socket.io
  useEffect(() => {
    // Connect to the custom server (running on the same port)
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Real-time Sync Server", socket.id);
    });

    socket.on("agent_typing", ({ agentName }) => {
      setTypingAgent(`${agentName} is typing...`);
    });

    socket.on("agent_stop_typing", () => {
      setTypingAgent(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 3. Select Chat and fetch Messages
  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    setTypingAgent(null); // Reset typing indicator

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      setMessages(data);

      // Join the socket room for real-time typing/message collision
      if (socketRef.current) {
        socketRef.current.emit("join_chat", chatId);
      }

      // Optimistically clear unread count
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ));

    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  // 4. Send a Message
  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;

    try {
      // Optimistic UI Update
      const optimisticMsg: MessageMock = {
        id: `opt_${Date.now()}`,
        text,
        senderType: "AGENT",
        timestamp: "Sending..."
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // Actually POST to DB
      const res = await fetch(`/api/chats/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contactId: selectedChatId, 
          text, 
          agentId: session?.user?.id || null,
        })
      });

      const data = await res.json();

      if (data.success) {
        // Replace optimistic msg with real one
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
        // Refresh the sidebar
        fetchChats();
      }
    } catch (err) {
      console.error("Failed to send message", err);
      // Revert optimistic update here if needed
    }
  };

  const handleTypingStart = () => {
    if (socketRef.current && selectedChatId && session?.user?.name) {
      socketRef.current.emit("typing", { chatId: selectedChatId });
    }
  };

  const handleTypingStop = () => {
    if (socketRef.current && selectedChatId) {
      socketRef.current.emit("stop_typing", { chatId: selectedChatId });
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  const activeChat = chats.find(c => c.id === selectedChatId) || null;

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Column 1: Chat List */}
      <ChatList 
        chats={chats} 
        selectedChatId={selectedChatId} 
        onSelectChat={handleSelectChat} 
      />

      {/* Column 2: Active Chat Window */}
      <ChatWindow 
        chat={activeChat} 
        messages={messages} 
        onSendMessage={handleSendMessage}
        typingAgent={typingAgent}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />

      {/* Column 3: Customer Profile & Actions */}
      <CustomerProfile 
        chat={activeChat}
        onSelectQuickReply={handleQuickReply}
      />
    </div>
  );
}
